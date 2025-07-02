
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
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    let fulfillmentText = body.queryResult?.fulfillmentText || "Your request has been received.";
    
    // --- Only handle Event Registration Intent ---
    if (intentName === 'EventRegistrationIntent') {
        let eventName = parameters.eventName || 'General Event';
        if (eventName.toLowerCase().includes('hackathon')) {
            eventName = 'Coding Hackathon';
        }

        const registrationData = {
          timestamp,
          intentName,
          eventName: eventName,
          fullName: parameters.fullName || 'Not provided',
          email: parameters.email || 'Not provided',
          classSection: parameters.classSection || 'Not provided',
        };
        await saveToFirestore('registrations', registrationData);
        fulfillmentText = `Thank you, ${registrationData.fullName}. Your registration for ${registrationData.eventName} has been submitted.`;
    } else {
        console.log(`Received unhandled intent, passing through: ${intentName}`);
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
