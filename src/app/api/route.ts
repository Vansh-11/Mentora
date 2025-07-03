import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { db } from '@/lib/firebase-admin';

// --- Helper to save data to Firestore ---
async function saveToFirestore(collection: string, data: any) {
  console.log('💾 FIRESTORE SAVE ATTEMPT');
  console.log('Collection:', collection);
  console.log('Data to save:', JSON.stringify(data, null, 2));
  
  if (!db) {
    const error = new Error("Firestore not initialized - db is null");
    console.error('❌ FIRESTORE ERROR: Database not initialized');
    console.error('DB status:', db);
    throw error;
  }
  
  try {
    console.log('🔄 Attempting to add document to collection:', collection);
    const docRef = await db.collection(collection).add(data);
    console.log('✅ FIRESTORE SUCCESS: Data saved with ID:', docRef.id);
    return docRef.id;
  } catch (firestoreError: any) {
    console.error('❌ FIRESTORE ERROR:', firestoreError.message);
    console.error('❌ Error code:', firestoreError.code);
    console.error('❌ Full error:', firestoreError);
    throw firestoreError;
  }
}

// --- Helper to extract report type from intent name ---
function getReportType(intentName: string): string {
  const typeMap: { [key: string]: string } = {
    'report_bullying': 'bullying',
    'report_mental_health': 'mental_health',
    'report_incident': 'incident',
    'report_other': 'other'
  };
  
  return typeMap[intentName] || 'other';
}

export async function POST(request: NextRequest) {
  console.log('🚀 WEBHOOK CALLED - Starting processing');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const body = await request.json();
    console.log('📥 Received body:', JSON.stringify(body, null, 2));
    
    const intentName = body.queryResult?.intent?.displayName;
    const parameters = body.queryResult?.parameters || {};
    
    console.log('🎯 Intent:', intentName);
    console.log('📋 Parameters:', JSON.stringify(parameters, null, 2));
    
    // --- Handle Registration Intent ---
    if (intentName === 'register_CH') {
      console.log('✅ Processing registration...');
      
      const fullName = parameters.fullName || 'Not provided';
      const contactNumber = parameters.contactNumber || 'Not provided';
      const classSection = parameters.classSection || 'Not provided';
      const rollNumber = parameters.rollNumber || 'Not provided';
      const codingExperience = parameters.codingExperience || 'Not provided';
      
      console.log('📋 Registration Data:', {
        fullName,
        contactNumber,
        classSection,
        rollNumber,
        codingExperience
      });
      
      // Prepare success response first (independent of Firebase save)
      const responseText = `Thank you, ${fullName}! Your registration for the Coding Hackathon has been submitted successfully. We'll contact you at ${contactNumber} with further details.`;
      
      // Prepare data for Firestore
      const registrationData = {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        intentName,
        eventName: "Coding Hackathon",
        fullName,
        contactNumber,
        classSection,
        rollNumber,
        codingExperience,
      };
      
      // Save to Firebase and wait for completion
      console.log('🔄 Starting Firebase save operation...');
      try {
        const docId = await saveToFirestore('registrations', registrationData);
        console.log('✅ REGISTRATION SAVED with ID:', docId);
        console.log('🎉 Firebase save completed successfully');
        
        // Return success response after Firebase save
        console.log('📤 Sending success response:', responseText);
        
        return NextResponse.json({
          fulfillmentText: responseText,
          fulfillmentMessages: [{
            text: { text: [responseText] }
          }]
        });
        
      } catch (saveError) {
        console.error('❌ REGISTRATION SAVE FAILED:', saveError);
        console.error('❌ Error type:', typeof saveError);
        console.error('❌ Error stack:', (saveError as any)?.stack);
        
        // Still return success to user, but log the error
        console.log('📤 Sending success response despite save error:', responseText);
        
        return NextResponse.json({
          fulfillmentText: responseText,
          fulfillmentMessages: [{
            text: { text: [responseText] }
          }]
        });
      }
    }
    
    // --- Handle Report Intents ---
    if (intentName && ['report_bullying', 'report_mental_health', 'report_incident', 'report_other'].includes(intentName)) {
      console.log('🚨 Processing report intent:', intentName);
      
      const name = parameters.name || 'Anonymous';
      const classSection = parameters.classSection || 'Not provided';
      const description = parameters.description || 'No description provided';
      const confirmation = parameters.confirmation || 'Not provided';
      
      console.log('📋 Report Data:', {
        name,
        classSection,
        description,
        confirmation,
        intentName
      });
      
      // Check confirmation status
      if (confirmation === 'no') {
        console.log('⚠️ User declined confirmation - sending warning');
        const warningText = "Please do not misuse the reporting system. False reports are not tolerated.";
        
        return NextResponse.json({
          fulfillmentText: warningText,
          fulfillmentMessages: [{
            text: { text: [warningText] }
          }]
        });
      }
      
      if (confirmation === 'yes') {
        console.log('✅ User confirmed - proceeding with report submission');
        
        // Extract report type from intent name
        const reportType = getReportType(intentName);
        console.log('📊 Report type:', reportType);
        
        // Prepare data for Firestore with consistent field names
        const reportData = {
          type: reportType,
          name,
          classSection,
          description,
          confirmation: 'yes',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Save to Firebase
        console.log('🔄 Starting report save operation...');
        try {
          const docId = await saveToFirestore('reports', reportData);
          console.log('✅ REPORT SAVED with ID:', docId);
          console.log('🎉 Report save completed successfully');
          
          const successText = "✅ Your report has been submitted to the school administration. Thank you for speaking up.";
          console.log('📤 Sending success response:', successText);
          
          return NextResponse.json({
            fulfillmentText: successText,
            fulfillmentMessages: [{
              text: { text: [successText] }
            }]
          });
          
        } catch (saveError) {
          console.error('❌ REPORT SAVE FAILED:', saveError);
          console.error('❌ Error type:', typeof saveError);
          console.error('❌ Error stack:', (saveError as any)?.stack);
          
          const errorText = "⚠️ There was a problem saving your report. Please try again later or contact support.";
          console.log('📤 Sending error response:', errorText);
          
          return NextResponse.json({
            fulfillmentText: errorText,
            fulfillmentMessages: [{
              text: { text: [errorText] }
            }]
          });
        }
      }
      
      // If confirmation is neither 'yes' nor 'no', ask for clarification
      const clarificationText = "Please confirm if you want to submit this report by saying 'yes' or 'no'.";
      
      return NextResponse.json({
        fulfillmentText: clarificationText,
        fulfillmentMessages: [{
          text: { text: [clarificationText] }
        }]
      });
    }
    
    // Default response for other intents
    return NextResponse.json({
      fulfillmentText: "I received your request but couldn't process this intent.",
      fulfillmentMessages: [{
        text: { text: ["I received your request but couldn't process this intent."] }
      }]
    });
    
  } catch (error: any) {
    console.error('❌ Webhook Error:', error);
    
    return NextResponse.json({
      fulfillmentText: "Sorry, there was an error processing your request. Please try again.",
      fulfillmentMessages: [{
        text: { text: ["Sorry, there was an error processing your request. Please try again."] }
      }]
    });
  }
}

// Handle GET requests (for testing)
export async function GET() {
  console.log('🔍 GET request to webhook endpoint');
  return NextResponse.json({
    message: "Webhook endpoint is working",
    timestamp: new Date().toISOString(),
    status: "OK"
  });
}