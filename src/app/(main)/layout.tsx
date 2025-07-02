
'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BotMessageSquare } from 'lucide-react';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // The AuthProvider already shows a loading skeleton, so this acts as a
  // secondary check specifically for this layout's user requirement.
  if (loading || !user) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-background">
            <div className="flex justify-center items-center mb-4">
               <BotMessageSquare size={48} className="text-primary-foreground animate-pulse" />
            </div>
            <p className="text-muted-foreground">Verifying Access...</p>
        </div>
    );
  }

  // If user is authenticated, render the children (the page)
  return <>{children}</>;
}
