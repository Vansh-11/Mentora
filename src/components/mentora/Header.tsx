
'use client';

import type { ReactNode } from 'react';
import { BotMessageSquare, Home as HomeIcon, LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  showChatbotIcon?: boolean;
  isHomePage?: boolean;
}

export default function Header({
  title = "👋 Welcome to Mentora Hub",
  subtitle = "Your All-in-One Student Support Companion",
  description = "Navigate through our services for mental well-being, academic assistance, and exploring your school environment. Mentora is here to help you thrive.",
  showChatbotIcon = true,
  isHomePage = false,
}: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleHomeClick = () => {
    if (typeof window !== 'undefined') {
      console.log("Header: Dispatching mentora:navigatingHome event.");
      window.dispatchEvent(new CustomEvent('mentora:navigatingHome'));
    }
  };

  return (
    <header className="py-12 md:py-16 bg-primary/30">
      <div className="container mx-auto px-4 relative">
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex gap-2">
            {user ? (
                 <Button variant="outline" onClick={handleLogout} aria-label="Logout">
                    <LogOut className="h-5 w-5 mr-2" /> Logout
                </Button>
            ) : (
                <Link href="/login">
                    <Button variant="outline" aria-label="Go to login page">
                        <LogIn className="h-5 w-5 mr-2" /> Login
                    </Button>
                </Link>
            )}
        </div>
        
        {!isHomePage && (
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
            <Link href="/home" onClick={handleHomeClick}>
              <Button variant="outline" size="icon" aria-label="Go to homepage" className="bg-card hover:bg-card/90">
                <HomeIcon className="h-5 w-5 text-card-foreground" />
              </Button>
            </Link>
          </div>
        )}

        <div className="text-center">
          {showChatbotIcon && (
            <div className="flex justify-center items-center mb-6">
              <BotMessageSquare size={48} className="text-primary-foreground mr-3" />
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary-foreground">
                {title}
              </h1>
            </div>
          )}
          {!showChatbotIcon && title && (
             <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary-foreground mb-6">
                {title}
              </h1>
          )}
          {subtitle && (
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4 font-headline">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="text-md md:text-lg text-foreground max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
