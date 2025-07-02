
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import React, { useEffect, useState, useRef } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

// Augment the JSX.IntrinsicElements interface for df-messenger
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'df-messenger': React.HTMLAttributes<HTMLElement> & {
        'project-id'?: string;
        'agent-id'?: string;
        'language-code'?: string;
        'chat-title'?: string;
        'chat-subtitle'?: string;
        'chat-title-icon'?: string;
        'chat-width'?: string;
        'chat-height'?: string;
        'intent'?: string;
        // For session parameters like session-params-subject
        [key: `session-params-${string}`]: string | undefined;
      };
      'df-messenger-chat-bubble': React.HTMLAttributes<HTMLElement>;
    }
  }
  interface Window {
    dfMessengerBootstrapLoaded?: boolean;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    console.log("RootLayout: Client hydrated.");
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Mentora Hub</title>
        <meta name="description" content="Your school’s mental health support chatbot" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            {children}
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
