
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
    console.log('Dialogflow Webhook Request Body:', JSON.stringify(body, null, 2));

    const intentName = body.queryResult?.intent?.displayName || 'Unknown Intent';
    const parameters = body.queryResult?.parameters || {};
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    let fulfillmentText = "Your request has been received, but the intent was not handled by the webhook.";

    // --- Handle Event Registration for Coding Hackathon only ---
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

      fulfillmentText = `Thank you, ${registrationData.fullName}. Your registration for ${eventName} has been submitted.`;
    } else {
      console.log(`Received unhandled intent: ${intentName}`);
    }

    // This response structure explicitly tells Dialogflow to REPLACE any static responses.
    return NextResponse.json({
      fulfillment_response: {
        messages: [{
          text: {
            text: [fulfillmentText],
          },
        }],
        merge_behavior: 'REPLACE',
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in Dialogflow Webhook:', error);
    // Even on error, we can try to send a clear message back to Dialogflow
    const errorMessage = 'An error occurred while processing your request in the webhook. Please try again or contact support.';
    return NextResponse.json({
       fulfillment_response: {
        messages: [{
          text: {
            text: [errorMessage],
          },
        }],
        merge_behavior: 'REPLACE',
      },
    }, { status: 500 });
  }
}
