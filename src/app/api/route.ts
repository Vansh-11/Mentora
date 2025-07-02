
import { type NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('FIREBASE_ADMIN_SDK_JSON not set. Firebase Admin features will be disabled.');
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

async function saveToFirestore(collection: string, data: any) {
  if (!db) {
    console.warn('Firestore is not initialized. Skipping save.');
    return;
  }
  try {
    const docRef = await db.collection(collection).add(data);
    console.log(`Data saved to ${collection} with ID:`, docRef.id);
  } catch (firestoreError: any) {
    console.error(`Error saving to ${collection}:`, firestoreError);
    // Optionally re-throw or handle as needed
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Dialogflow Webhook Request Body:', JSON.stringify(body, null, 2));

    const queryText = body.queryResult?.queryText || '';
    const intentName = body.queryResult?.intent?.displayName || 'Unknown Intent';
    const timestamp = new Date();
    const parameters = body.queryResult?.parameters || {};
    let fulfillmentText = body.queryResult?.fulfillmentText || "Your request has been received.";

    switch (intentName) {
      case 'EventRegistrationIntent': // Or whatever your registration intent is named
        const registrationData = {
          timestamp,
          intentName,
          fullName: parameters.fullName || 'Not provided',
          classSection: parameters.classSection || 'Not provided',
          rollNumber: parameters.rollNumber ? String(parameters.rollNumber) : 'Not provided',
          contactNumber: parameters.contactNumber || 'Not provided',
          codingExperience: parameters.codingExperience || 'Not provided',
          originalQuery: queryText,
          status: 'new',
        };
        await saveToFirestore('registrations', registrationData);
        fulfillmentText = `Thank you, ${registrationData.fullName}. Your registration for the event has been submitted.`;
        break;

      case 'BullyingReportIntent': // Assumed intent name for bullying reports
        const bullyingReportData = {
          timestamp,
          intentName,
          details: parameters.report_details || queryText || 'No details provided', // Assuming a 'report_details' parameter
          status: 'new',
        };
        await saveToFirestore('bullyingReports', bullyingReportData);
        fulfillmentText = "Thank you for reaching out. Your report has been submitted confidentially. A counselor will review it shortly.";
        break;

      case 'CyberSecurityReportIntent': // Assumed intent name for cyber security reports
        const cyberReportData = {
          timestamp,
          intentName,
          details: parameters.report_details || queryText || 'No details provided',
          status: 'new',
        };
        await saveToFirestore('cyberSecurityReports', cyberReportData);
        fulfillmentText = "Thank you for your report. It has been submitted to the security team for review.";
        break;

      // Add other cases for different intents as needed

      default:
        console.log(`Received unhandled intent: ${intentName}`);
        // Default fulfillment text is already set
        break;
    }

    return NextResponse.json({
      fulfillmentMessages: [{ text: { text: [fulfillmentText] } }],
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in Dialogflow Webhook:', error);
    return NextResponse.json({
      fulfillmentMessages: [
        { text: { text: ['An error occurred while processing your request. Please try again.'] } },
      ],
    }, { status: 500 });
  }
}
