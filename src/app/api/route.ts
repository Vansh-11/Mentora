
import { type NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { db } from '@/lib/firebase-admin';

// --- Helper to save data to Firestore ---
async function saveToFirestore(collection: string, data: any) {
  if (!db) {
    console.warn(`Firestore is not initialized. Skipping save for collection: ${collection}.`);
    return Promise.reject(new Error("Firestore not initialized"));
  }
  try {
    const docRef = await db.collection(collection).add(data);
    console.log(`Data saved to ${collection} with ID:`, docRef.id);
  } catch (firestoreError: any) {
    console.error(`Error saving to ${collection}:`, firestoreError);
    throw firestoreError;
  }
}

// --- Main Webhook Handler ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('--- Dialogflow Webhook Request ---');
    console.log('Body:', JSON.stringify(body, null, 2));

    const intentName = body.queryResult?.intent?.displayName || 'Unknown Intent';
    const parameters = body.queryResult?.parameters || {};
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    console.log(`Intent Triggered: ${intentName}`);
    console.log('Parameters Received:', JSON.stringify(parameters, null, 2));

    let fulfillmentText = "Your request has been received, but the intent was not handled by the webhook.";

    if (intentName === 'register_CH') {
      const eventName = "Coding Hackathon";

      const registrationData = {
        timestamp,
        intentName,
        eventName,
        fullName: parameters.fullName || 'Not provided',
        email: parameters.email || 'Not provided',
        contactNumber: parameters.contactNumber || 'Not provided',
        codingExperience: parameters.codingExperience || 'Not provided',
        classSection: parameters.classSection || 'Not provided',
        rollNumber: parameters.rollNumber || 'Not provided',
      };

      console.log('Final Registration Payload:', registrationData);

      await saveToFirestore('registrations', registrationData);

      const thankYou = `Thank you, ${registrationData.fullName}. Your registration for ${eventName} has been submitted.`;
      const confirmation = `Your registration data has been sent to the event coordinator.`;

      fulfillmentText = thankYou + " " + confirmation;

      return NextResponse.json({
        fulfillmentText,
        fulfillmentMessages: [
          { text: { text: [thankYou] } },
          { text: { text: [confirmation] } }
        ],
      }, { status: 200 });
    } else {
      console.log(`Received unhandled intent: ${intentName}`);
    }

    console.log(`Sending fallback fulfillmentText: "${fulfillmentText}"`);

    return NextResponse.json({
      fulfillmentText,
      fulfillmentMessages: [
        {
          text: { text: [fulfillmentText] },
        },
      ],
    }, { status: 200 });

  } catch (error: any) {
    console.error('--- ERROR IN WEBHOOK ---');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    const errorMessage = 'An error occurred while processing your request in the webhook. Please check the server logs.';

    return NextResponse.json({
      fulfillmentText: errorMessage,
      fulfillmentMessages: [{
        text: { text: [errorMessage] },
      }],
    }, { status: 500 });
  }
}
