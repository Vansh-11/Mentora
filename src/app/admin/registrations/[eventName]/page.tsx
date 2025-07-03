
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { db } from '@/lib/firebase-admin';
import RegistrationDetailsClient from './RegistrationDetailsClient';

export const dynamic = 'force-dynamic';

interface Registration {
  id: string;
  timestamp: string;
  eventName?: string;
  [key: string]: any;
}

async function fetchRegistrationsForEvent(eventName: string): Promise<Registration[]> {
  noStore();
  if (!db) {
    console.warn(`Firestore not initialized, cannot fetch registrations.`);
    return [];
  }
  try {
    const snapshot = await db.collection('registrations')
                           .where('eventName', '==', eventName)
                           .orderBy('timestamp', 'desc')
                           .get();
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
  } catch (error) {
    console.error(`Error fetching registrations for event ${eventName}:`, error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { eventName: string } }): Promise<Metadata> {
  const eventName = decodeURIComponent(params.eventName);
  return {
    title: `Registrations for ${eventName} | Mentora Hub Admin`,
  };
}

export default async function RegistrationDetailsPage({ params }: { params: { eventName: string } }) {
  const eventName = decodeURIComponent(params.eventName);
  const registrations = await fetchRegistrationsForEvent(eventName);

  return (
    <RegistrationDetailsClient
      eventName={eventName}
      registrations={registrations}
    />
  );
}
