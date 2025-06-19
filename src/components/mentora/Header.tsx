
import type React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  isHomePage?: boolean;
}

const MentoraHeader: React.FC<HeaderProps> = ({ title, subtitle, description, isHomePage = false }) => {
  return (
    <header className="bg-primary/10 py-8 px-4 md:px-8 shadow-sm">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {typeof title === 'string' ? (
              <h1 className="text-4xl font-headline font-bold text-primary-foreground">{title}</h1>
            ) : (
              title
            )}
          </div>
          {!isHomePage && (
            <Link href="/">
              <Button variant="ghost" size="icon" aria-label="Go to Homepage">
                <Home className="h-6 w-6 text-primary-foreground" />
              </Button>
            </Link>
          )}
        </div>
        {subtitle && (typeof subtitle === 'string' ? (
          <p className="text-xl text-muted-foreground font-headline">{subtitle}</p>
        ) : subtitle)}
        <Separator className="my-4 bg-primary/20" />
        {description && (typeof description === 'string' ? (
          <p className="text-md text-foreground/80">{description}</p>
        ) : description)}
      </div>
    </header>
  );
};

export default MentoraHeader;
