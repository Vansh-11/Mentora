'use server';

import { revalidatePath } from 'next/cache';
import { db, auth } from '@/lib/firebase-admin';

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
