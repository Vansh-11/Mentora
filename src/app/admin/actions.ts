
'use server';

import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// --- Firebase Admin SDK Initialization ---
// This ensures it's initialized only once.
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error in server action:', error.stack);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

// Helper function to check if db is initialized
function ensureDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Check server environment configuration.');
  }
  return db;
}

/**
 * Updates the status of a report in a given collection.
 * @param collectionName The name of the Firestore collection.
 * @param docId The ID of the document to update.
 * @param newStatus The new status to set.
 */
export async function updateReportStatus(collectionName: string, docId: string, newStatus: string) {
  const db = ensureDb();
  try {
    await db.collection(collectionName).doc(docId).update({ status: newStatus });
    revalidatePath('/admin/dashboard');
    return { success: true, message: `Report status updated to ${newStatus}.` };
  } catch (error) {
    console.error(`Failed to update status for doc ${docId} in ${collectionName}:`, error);
    return { success: false, message: 'Failed to update report status.' };
  }
}

/**
 * Deletes a report from a given collection.
 * @param collectionName The name of the Firestore collection.
 * @param docId The ID of the document to delete.
 */
export async function deleteReport(collectionName: string, docId: string) {
  const db = ensureDb();
  try {
    await db.collection(collectionName).doc(docId).delete();
    revalidatePath('/admin/dashboard');
    return { success: true, message: 'Report deleted successfully.' };
  } catch (error) {
    console.error(`Failed to delete doc ${docId} from ${collectionName}:`, error);
    return { success: false, message: 'Failed to delete report.' };
  }
}
