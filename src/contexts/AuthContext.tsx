
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null | undefined;
  role: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, authLoading] = useAuthState(auth);
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setRoleLoading(true);
      return;
    }
    if (user) {
      setRoleLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        } else {
          // Default to student if no role is found
          setRole('student');
        }
        setRoleLoading(false);
      }).catch(() => {
        setRole(null);
        setRoleLoading(false);
      });
    } else {
      setRole(null);
      setRoleLoading(false);
    }
  }, [user, authLoading]);

  const loading = authLoading || roleLoading;

  // This prevents a flash of the old screen before role-based redirects happen
  if (loading) {
     return (
        <div className="w-full h-screen flex flex-col">
            <header className="py-12 md:py-16 bg-primary/30">
                <div className="container mx-auto px-4 relative">
                    <div className="text-center">
                        <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
                        <Skeleton className="h-8 w-1/2 mx-auto" />
                    </div>
                </div>
            </header>
            <main className="flex-grow container mx-auto py-8 md:py-12">
                 <Skeleton className="h-64 w-full" />
            </main>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
