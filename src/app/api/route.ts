
import { type NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { db } from '@/lib/firebase-admin';

// --- Helper to save data to Firestore ---
async function saveToFirestore(collection: string, data: any) {
  if (!db) {
    console.warn(`Firestore is not initialized. Skipping save for collection: ${collection}.`);
    // Return a failed promise to be caught by the caller
    return Promise.reject(new Error("Firestore not initialized"));
  }
  try {
    const docRef = await db.collection(collection).add(data);
    console.log(`Data saved to ${collection} with ID:`, docRef.id);
  } catch (firestoreError: any) {
    console.error(`Error saving to ${collection}:`, firestoreError);
    // Re-throw the error to be caught by the main handler
    throw firestoreError;
  }
}

// --- Main Webhook Handler ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Dialogflow Webhook Request Body:', JSON.stringify(body, null, 2));

    const intentName = body.queryResult?.intent?.displayName || 'Unknown Intent';
    const parameters = body.queryResult?.parameters || {};
    const timestamp = admin.firestore.FieldValue.serverTimestamp(); // Use server timestamp for consistency
    let fulfillmentText = body.queryResult?.fulfillmentText || "Your request has been received.";

    // --- Standard Report Data Structure ---
    // All reports will share this structure for consistency in the admin dashboard.
    const createReportData = () => ({
        timestamp,
        intentName,
        fullName: parameters.fullName || 'Not provided',
        email: parameters.email || 'Not provided',
        classSection: parameters.classSection || 'Not provided',
        details: parameters.details || body.queryResult?.queryText || 'No details provided',
        status: 'New' as const, // All new reports are marked as 'New'
    });
    
    switch (intentName) {
      // --- Event Registration Intent ---
      case 'EventRegistrationIntent':
        const registrationData = {
          timestamp,
          intentName,
          eventName: parameters.eventName || 'General Event',
          fullName: parameters.fullName || 'Not provided',
          email: parameters.email || 'Not provided',
          classSection: parameters.classSection || 'Not provided',
        };
        await saveToFirestore('registrations', registrationData);
        fulfillmentText = `Thank you, ${registrationData.fullName}. Your registration for ${registrationData.eventName} has been submitted.`;
        break;

      // --- Report Intents ---
      case 'BullyingReportIntent':
        await saveToFirestore('bullyingReports', createReportData());
        fulfillmentText = "Thank you for reaching out. Your confidential report has been submitted and will be reviewed shortly.";
        break;

      case 'EmotionalHealthReportIntent':
        await saveToFirestore('emotionalHealthReports', createReportData());
        fulfillmentText = "Thank you for sharing. Your confidential report has been received. Please remember to talk to a trusted adult if you need immediate support.";
        break;

      case 'SchoolIncidentReportIntent':
        await saveToFirestore('schoolIncidentReports', createReportData());
        fulfillmentText = "Thank you. Your incident report has been submitted and will be reviewed by the appropriate staff.";
        break;

      case 'OtherConcernsReportIntent':
         await saveToFirestore('otherConcernsReports', createReportData());
         fulfillmentText = "Thank you for letting us know. Your report has been submitted and will be reviewed.";
         break;

      // --- Default Case for Unhandled Intents ---
      default:
        console.log(`Received unhandled intent: ${intentName}`);
        // The default fulfillmentText is used here.
        break;
    }

    // --- Successful Response to Dialogflow ---
    return NextResponse.json({
      fulfillmentMessages: [{ text: { text: [fulfillmentText] } }],
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in Dialogflow Webhook:', error);
    // --- Error Response to Dialogflow ---
    return NextResponse.json({
      fulfillmentMessages: [
        { text: { text: ['An error occurred while processing your request. Please try again or contact support.'] } },
      ],
    }, { status: 500 });
  }
}
