import type { Metadata } from 'next';
import './globals.css';
// import MentoraHeader from '@/components/mentora/Header'; // Header is per-page
import MentoraFooter from '@/components/mentora/Footer';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Mentora Hub',
  description: 'Your All-in-One Student Support Companion',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
          {/* Header is rendered per-page for more flexibility with props */}
          <main className="flex-grow">
            {children}
          </main>
          <MentoraFooter />
          <Toaster />
      </body>
    </html>
  );
}
