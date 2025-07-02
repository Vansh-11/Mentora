
import { unstable_noStore as noStore } from 'next/cache';
import DashboardClient from './DashboardClient';
import type { Metadata } from 'next';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Mentora Hub',
};

async function fetchCollection(collectionName: string) {
  noStore();
  if (!db) {
    console.warn(`Firestore not initialized, cannot fetch ${collectionName}.`);
    return [];
  }
  try {
    const snapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
        };
    });
  } catch(error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

async function fetchUsers() {
    noStore();
    if (!db) {
        console.warn('Firestore not initialized, cannot fetch users.');
        return [];
    }
    try {
        const snapshot = await db.collection('users').where('role', '==', 'admin').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any[];
    } catch(error) {
        console.error(`Error fetching admin users:`, error);
        // Firebase often suggests an index creation URL in the error message.
        // It's helpful to log the full error for debugging.
        console.error("Full error object:", JSON.stringify(error, null, 2));
        return [];
    }
}


export default async function AdminDashboardPage() {
  const [
    registrations, 
    bullyingReports, 
    emotionalHealthReports, 
    schoolIncidentReports, 
    otherConcernsReports,
    users
    ] = await Promise.all([
        fetchCollection('registrations'),
        fetchCollection('bullyingReports'),
        fetchCollection('emotionalHealthReports'),
        fetchCollection('schoolIncidentReports'),
        fetchCollection('otherConcernsReports'),
        fetchUsers()
    ]);
  
  return (
    <DashboardClient
      registrations={registrations}
      bullyingReports={bullyingReports}
      emotionalHealthReports={emotionalHealthReports}
      schoolIncidentReports={schoolIncidentReports}
      otherConcernsReports={otherConcernsReports}
      users={users}
    />
  );
}
