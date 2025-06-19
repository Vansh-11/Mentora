import { LifeBuoy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-8 bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <div className="flex items-center justify-center mb-2">
          <LifeBuoy size={20} className="mr-2" />
          <p className="text-sm">
            Need urgent help? Talk to a trusted adult or visit{' '}
            <a 
              href="#" // Replace with actual helpline link
              className="underline hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded"
              aria-label="Link to local helpline site (placeholder)"
            >
              [your local helpline site]
            </a>.
          </p>
        </div>
        <p className="text-xs">&copy; {new Date().getFullYear()} Mentora Hub. All rights reserved.</p>
      </div>
    </footer>
  );
}
