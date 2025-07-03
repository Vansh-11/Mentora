
import { unstable_noStore as noStore } from 'next/cache';
import DashboardClient from './DashboardClient';
import type { Metadata } from 'next';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Mentora Hub',
};

interface Registration {
  id: string;
  timestamp: string;
  [key: string]: any;
}

interface User {
  uid: string;
  email: string;
  role: "admin" | "student";
}

interface Report {
    id: string;
    timestamp: string;
    category: string;
    name: string;
    classSection: string;
    description: string;
}


async function fetchInitialData() {
  noStore();
  
  let initialRegistrations: Registration[] = [];
  let initialUsers: User[] = [];
  let initialReports: Report[] = [];

  if (db) {
    try {
      // Fetch initial registrations
      const registrationsSnapshot = await db.collection('registrations')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      if (!registrationsSnapshot.empty) {
        initialRegistrations = registrationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() ? 
              data.timestamp.toDate().toISOString() : 
              (data.timestamp || new Date().toISOString()),
          };
        });
      }

      // Fetch initial admin users
      const usersSnapshot = await db.collection('users')
        .where('role', '==', 'admin')
        .get();
      
      if (!usersSnapshot.empty) {
        initialUsers = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            uid: doc.id, 
            email: data.email as string,
            role: data.role as "admin" | "student",
          };
        });
      }

      // Fetch initial reports
      const reportsSnapshot = await db.collection('reports')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      if (!reportsSnapshot.empty) {
        initialReports = reportsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate?.() ? 
                  data.timestamp.toDate().toISOString() : 
                  (data.timestamp || new Date().toISOString()),
                name: data.name || 'Anonymous',
                classSection: data.classSection || 'N/A',
                description: data.description || 'No description provided.',
                category: data.category || 'Other Issues',
            };
        });
      }

      console.log('Initial data loaded:', {
        registrations: initialRegistrations.length,
        users: initialUsers.length,
        reports: initialReports.length,
      });

    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  } else {
    console.warn('Firestore not initialized');
  }

  return {
    registrations: initialRegistrations,
    users: initialUsers,
    reports: initialReports,
  };
}

export default async function AdminDashboardPage() {
  const { registrations, users, reports } = await fetchInitialData();
  
  return (
    <DashboardClient
      registrations={registrations}
      users={users}
      reports={reports}
    />
  );
}
