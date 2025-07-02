
"use client";

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LogOut, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { role, loading, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.replace('/login');
      } else if (role !== 'admin') {
        // Logged in but not an admin, redirect to home
        router.replace('/');
      }
    }
  }, [user, role, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || role !== 'admin') {
    // Show a loading skeleton while verifying auth/role
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-1/4 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                    <ShieldCheck className="h-6 w-6" />
                    <span className="">Admin Dashboard</span>
                </Link>
            </nav>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <div className="ml-auto">
                    <Button onClick={handleLogout} variant="outline" size="sm">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
        </main>
    </div>
  );
}
