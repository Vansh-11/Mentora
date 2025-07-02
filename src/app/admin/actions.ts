
'use server';

import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// --- Firebase Admin SDK Initialization ---
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
const auth = admin.apps.length ? admin.auth() : null;

// Helper function to check if db is initialized
function ensureDb() {
  if (!db) throw new Error('Firestore is not initialized.');
  return db;
}
function ensureAuth() {
    if (!auth) throw new Error('Firebase Auth is not initialized.');
    return auth;
}

/**
 * Updates the status of a report in a given collection.
 * @param collectionName The name of the Firestore collection.
 * @param docId The ID of the document to update.
 * @param newStatus The new status to set ('New' or 'Reviewed').
 */
export async function updateReportStatus(collectionName: string, docId: string, newStatus: 'New' | 'Reviewed') {
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

/**
 * Sends a password reset email to the given email address.
 * @param email The admin's email address.
 */
export async function sendPasswordReset(email: string) {
    const auth = ensureAuth();
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true, message: `Password reset email sent to ${email}.` };
    } catch (error: any) {
        console.error(`Failed to send password reset email:`, error);
        return { success: false, message: error.message || 'Failed to send password reset email.' };
    }
}


/**
 * Demotes an admin user to a student role.
 * @param uid The UID of the user to demote.
 */
export async function demoteAdmin(uid: string) {
    const db = ensureDb();
    try {
        const userRef = db.collection('users').doc(uid);
        await userRef.update({ role: 'student' });
        revalidatePath('/admin/dashboard');
        return { success: true, message: 'User has been demoted to student.' };
    } catch (error: any) {
        console.error(`Failed to demote user ${uid}:`, error);
        return { success: false, message: 'Failed to update user role.' };
    }
}
