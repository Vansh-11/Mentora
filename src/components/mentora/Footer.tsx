import type React from 'react';
import { LifeBuoy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const MentoraFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background py-8 px-4 md:px-8 border-t border-border mt-auto">
      <div className="container mx-auto text-center text-muted-foreground">
        <div className="flex items-center justify-center mb-4">
          <LifeBuoy className="h-5 w-5 mr-2 text-destructive" />
          <p className="text-sm">
            <strong>Emergency Resources:</strong> If you are in immediate distress, please reach out to emergency services or your school's designated mental health support. 
            <a href="#" className="underline hover:text-accent-foreground ml-1">Click here for school resources (placeholder)</a>.
          </p>
        </div>
        <Separator className="my-4" />
        <p className="text-sm">
          &copy; {currentYear} Mentora Hub. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Mentora Hub is a student support tool and not a replacement for professional medical or psychological advice.
        </p>
      </div>
    </footer>
  );
};

export default MentoraFooter;
