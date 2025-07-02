
import { type NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
// Initialize Firebase Admin SDK only on the server and if not already initialized
if (typeof window === 'undefined' && !admin.apps.length) { // Check if in server environment and not already initialized
  try {
    // Read service account key JSON directly from environment variable
    if (process.env.FIREBASE_ADMIN_SDK_JSON) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_ADMIN_SDK_JSON as string
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized with service account credentials.');
    } else {
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized with default credentials.');
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

const db = admin.firestore();


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Dialogflow Webhook Request Body:', JSON.stringify(body, null, 2));

    const queryText = body.queryResult?.queryText || '';
    const intentName = body.queryResult?.intent?.displayName || 'Unknown Intent';
    const timestamp = new Date().toISOString();
    const parameters = body.queryResult?.parameters || {};

    const parsedName = parameters.fullName || 'Not provided';
    const parsedClassSection = parameters.classSection || 'Not provided';
    const parsedRollNumber = parameters.rollNumber ? String(parameters.rollNumber) : 'Not provided';
    const parsedContactNumber = parameters.contactNumber || 'Not provided';
    const parsedExperience = parameters.codingExperience || 'Not provided';

    console.log(`Registration Received:
- Full Name: ${parsedName}
- Class & Section: ${parsedClassSection}
- Roll Number: ${parsedRollNumber}
- Contact Number: ${parsedContactNumber}
- Coding Experience: ${parsedExperience}`);

    const registrationData = {
      timestamp,
      intentName,
      fullName: parsedName,
      classSection: parsedClassSection,
      rollNumber: parsedRollNumber,
      contactNumber: parsedContactNumber,
      codingExperience: parsedExperience,
      originalQuery: queryText,
    };

    // Save to Firestore
    if (admin.apps.length && db) {
      try {
        const docRef = await db.collection('registrations').add(registrationData);
        console.log('Registration data saved to Firestore with ID:', docRef.id);
      } catch (firestoreError: any) {
        console.error('Error saving registration to Firestore:', firestoreError);
      }
    } else {
      console.warn('Firestore Admin SDK not initialized or db object is null. Skipping Firestore save.');
    }

    let fulfillmentText = '';

    const allProvided = [
      parsedName,
      parsedClassSection,
      parsedRollNumber,
      parsedContactNumber,
      parsedExperience
    ].every(val => val !== 'Not provided');

    if (allProvided) {
        const eventName = intentName === 'EventRegistrationIntent' ? 'Coding Hackathon' : intentName;
        
        fulfillmentText = `Thank you! We've received the following registration details for event: ${eventName}: \n
 Full Name: ${parsedName} \n
 Class & Section: ${parsedClassSection} \n
 Roll Number: ${parsedRollNumber} \n
 Contact Number: ${parsedContactNumber} \n
 Coding Experience: ${parsedExperience} \n

We will process your registration.\n`;
    } else {
      // Check if it's a known intent that expects parameters, not a general welcome/fallback intent
      const parameterCollectionIntents = ['EventRegistrationIntent', 'CodingWorkshopRegistration']; // Add your actual intent names here
      if (parameterCollectionIntents.includes(intentName) || (intentName !== 'Unknown Intent' && intentName !== 'Default Welcome Intent' && intentName !== 'Welcome')) {
        fulfillmentText = `It seems some details might be missing for your registration for "${intentName}". Please ensure all information is provided. We received:
- Full Name: ${parsedName}
- Class & Section: ${parsedClassSection}
- Roll Number: ${parsedRollNumber}
- Contact Number: ${parsedContactNumber}
- Coding Experience: ${parsedExperience}`;
      } else {
        fulfillmentText = body.queryResult?.fulfillmentText || "Request received. How else can I help you today?";
      }
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
