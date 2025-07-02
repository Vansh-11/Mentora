
import DashboardClient from './DashboardClient';
import type { Metadata } from 'next';
import { db } from '@/lib/firebase-admin';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Mentora Hub',
};

async function fetchCollection(collectionName: string) {
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
    if (!db) {
        console.warn('Firestore not initialized, cannot fetch users.');
        return [];
    }
    try {
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any[];
    } catch(error) {
        console.error(`Error fetching users:`, error);
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
