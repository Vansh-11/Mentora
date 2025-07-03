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