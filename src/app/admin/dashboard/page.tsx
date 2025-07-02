
import * as admin from 'firebase-admin';
import DashboardClient from './DashboardClient';

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
    console.error('Firebase Admin SDK initialization error on dashboard page:', error.stack);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

async function fetchCollection(collectionName: string) {
  if (!db) {
    console.warn(`Firestore not initialized, cannot fetch ${collectionName}.`);
    return [];
  }
  const snapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Firestore Timestamp to a serializable format (ISO string)
      timestamp: data.timestamp.toDate().toISOString(),
    };
  });
}

export default async function AdminDashboardPage() {
  const registrations = await fetchCollection('registrations');
  const bullyingReports = await fetchCollection('bullyingReports');
  const cyberSecurityReports = await fetchCollection('cyberSecurityReports');

  return (
    <DashboardClient
      initialRegistrations={registrations}
      initialBullyingReports={bullyingReports}
      initialCyberSecurityReports={cyberSecurityReports}
    />
  );
}
