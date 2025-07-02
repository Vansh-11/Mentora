
import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Check if the app is already initialized to prevent errors
  if (admin.apps.length > 0) {
    return;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (!serviceAccountJson) {
      console.warn('FIREBASE_ADMIN_SDK_JSON environment variable not set. Admin features will be disabled.');
      return;
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

// Initialize the app
initializeFirebaseAdmin();

// Export the initialized services
export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;
