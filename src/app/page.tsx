
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BotMessageSquare } from 'lucide-react';

export default function RootRedirectPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is false before attempting to redirect
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        // Default redirect for any other authenticated user (e.g., student)
        router.replace('/home');
      }
    }
  }, [user, loading, role, router]);

  // Show a loading state while authentication is being checked
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex justify-center items-center mb-4">
        <BotMessageSquare size={48} className="text-primary-foreground animate-pulse" />
      </div>
      <p className="text-muted-foreground">Loading Your Experience...</p>
    </div>
  );
}
