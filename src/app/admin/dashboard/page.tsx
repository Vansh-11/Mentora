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
  eventName?: string;
  fullName?: string;
  contactNumber?: string;
  classSection?: string;
  rollNumber?: string;
  codingExperience?: string;
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
    type: "bullying" | "mental_health" | "incident" | "other";
    category: string;
    name: string;
    classSection: string;
    description: string;
    confirmation: "yes";
}

async function fetchInitialData() {
  noStore();
  
  let initialRegistrations: Registration[] = [];
  let initialUsers: User[] = [];
  let initialReports: Report[] = [];

  if (db) {
    try {
      // Fetch all data concurrently using Promise.all
      const [registrationsSnapshot, usersSnapshot, reportsSnapshot] = await Promise.all([
        // Fetch initial registrations
        db.collection('registrations')
          .orderBy('timestamp', 'desc')
          .limit(50)
          .get(),
        
        // Fetch initial admin users
        db.collection('users')
          .where('role', '==', 'admin')
          .get(),
        
        // Fetch initial reports
        db.collection('reports')
          .orderBy('timestamp', 'desc')
          .limit(100)
          .get()
      ]);
      
      // Process registrations
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

      // Process admin users
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

      // Process reports
      if (!reportsSnapshot.empty) {
        initialReports = reportsSnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Map type to category for UI display
            const typeToCategory = {
              'bullying': 'Bullying Reports',
              'mental_health': 'Mental Health Reports', 
              'incident': 'School Incidents',
              'other': 'Other Issues'
            };
            
            return {
                id: doc.id,
                timestamp: data.timestamp?.toDate?.() ? 
                  data.timestamp.toDate().toISOString() : 
                  (data.timestamp || new Date().toISOString()),
                type: data.type || 'other',
                category: typeToCategory[data.type as keyof typeof typeToCategory] || 'Other Issues',
                name: data.name || 'Anonymous',
                classSection: data.classSection || 'N/A',
                description: data.description || 'No description provided.',
                confirmation: data.confirmation || 'yes',
            } as Report;
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