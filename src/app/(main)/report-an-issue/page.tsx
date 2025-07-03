
"use client";

import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/mentora/Header';
import Footer from '@/components/mentora/Footer';
import { Button } from '@/components/ui/button';
import { MessageCircle, ShieldQuestion } from 'lucide-react';
import Image from 'next/image';

const REPORT_AGENT_ID = "8163a933-1cfe-4abd-9924-54926c2902e5";
const DIALOGFLOW_SCRIPT_URL = "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
const DF_SCRIPT_ID = "dialogflow-bootstrap-script-report"; 

export default function ReportAnIssuePage() {
  const [isClient, setIsClient] = useState(false);
  const [renderMessenger, setRenderMessenger] = useState(false);
  const messengerRef = useRef<HTMLElement | null>(null);
  const [isMessengerComponentReady, setIsMessengerComponentReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const messengerSelector = `df-messenger[agent-id="${REPORT_AGENT_ID}"]`;
    
    const handleMessengerLoaded = () => {
      console.log(`ReportAnIssuePage: df-messenger-loaded event received for agent ${REPORT_AGENT_ID}.`);
      setIsMessengerComponentReady(true);
    };
    
    const messengerElement = document.querySelector(messengerSelector);
    if (messengerElement) {
      messengerElement.addEventListener('df-messenger-loaded', handleMessengerLoaded);
      messengerRef.current = messengerElement as HTMLElement;
    }

    const loadAndInitializeMessenger = () => {
      if (document.querySelector(messengerSelector)) {
        console.log("ReportAnIssuePage: Dialogflow Messenger for this agent already in DOM.");
        messengerRef.current = document.querySelector(messengerSelector);
        if(messengerRef.current) {
            messengerRef.current.addEventListener('df-messenger-loaded', handleMessengerLoaded);
        }
        setRenderMessenger(true);
        return;
      }

      if ((window as any).dfMessengerBootstrapLoaded) {
        console.log("ReportAnIssuePage: Dialogflow bootstrap script already loaded globally.");
        setRenderMessenger(true);
        return;
      }
      
      let script = document.getElementById(DF_SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = DF_SCRIPT_ID;
        script.src = DIALOGFLOW_SCRIPT_URL;
        script.async = true;
        document.head.appendChild(script);
        script.onload = () => {
          console.log("ReportAnIssuePage: Dialogflow bootstrap.js loaded.");
          (window as any).dfMessengerBootstrapLoaded = true;
          setRenderMessenger(true);
        };
        script.onerror = () => {
          console.error("ReportAnIssuePage: Failed to load Dialogflow bootstrap.js.");
        };
      } else {
        const handleExistingScriptLoad = () => {
          if (!(window as any).dfMessengerBootstrapLoaded) {
            console.log("ReportAnIssuePage: Dialogflow bootstrap.js (existing tag) loaded.");
            (window as any).dfMessengerBootstrapLoaded = true;
          }
          setRenderMessenger(true);
        };
        if ((window as any).dfMessengerBootstrapLoaded) {
            handleExistingScriptLoad();
        } else {
            script.addEventListener('load', handleExistingScriptLoad);
            script.addEventListener('error', () => console.error("ReportAnIssuePage: Failed to load Dialogflow bootstrap.js (existing tag)."));
        }
      }
    };

    loadAndInitializeMessenger();

    return () => {
      const existingMessenger = document.querySelector(messengerSelector);
      if (existingMessenger) {
        console.log("ReportAnIssuePage: Removing Dialogflow Messenger for this agent on unmount.");
        existingMessenger.removeEventListener('df-messenger-loaded', handleMessengerLoaded);
        existingMessenger.remove();
      }
      setRenderMessenger(false); 
      setIsMessengerComponentReady(false);
      messengerRef.current = null; 
    };
  }, [isClient]);

  useEffect(() => {
    if (!renderMessenger || !isClient) return;

    const dfMessengerElement = document.querySelector(`df-messenger[agent-id="${REPORT_AGENT_ID}"]`);
    const handleDfMessengerLoadedEvent = () => {
      console.log(`ReportAnIssuePage: df-messenger-loaded event received for agent ${REPORT_AGENT_ID} (useEffect).`);
      setIsMessengerComponentReady(true);
    };

    if (dfMessengerElement) {
      dfMessengerElement.addEventListener('df-messenger-loaded', handleDfMessengerLoadedEvent);
      messengerRef.current = dfMessengerElement as HTMLElement;

      if ((dfMessengerElement as any)._instance && (dfMessengerElement as any)._instance.dfMessengerLoaded) {
          setIsMessengerComponentReady(true);
      }
    }
    return () => {
      if (dfMessengerElement) {
        dfMessengerElement.removeEventListener('df-messenger-loaded', handleDfMessengerLoadedEvent);
      }
    };
  }, [renderMessenger, isClient]);

  const isChatVisiblyOpen = (): boolean => {
    if (!isClient) return false;
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${REPORT_AGENT_ID}"]`) as HTMLElement | null;
    if (!dfMessenger) return false;
    const shadowRoot = dfMessenger.shadowRoot;
    if (!shadowRoot) return false;
    const chatWrapper = shadowRoot.querySelector('#dialogflow-chat-wrapper');
    return chatWrapper ? getComputedStyle(chatWrapper).getPropertyValue('display') !== 'none' : false;
  };

  const openChatWidgetIfNotOpen = () => {
     if (!isClient) {
      console.warn('ReportAnIssuePage: Attempted to open chat before client hydration.');
      return;
    }
    
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${REPORT_AGENT_ID}"]`) as any;

    if (!dfMessenger) {
      console.warn(`ReportAnIssuePage: df-messenger with agent-id ${REPORT_AGENT_ID} not found when trying to open.`);
      return;
    }
    
    if (!dfMessenger.shadowRoot) {
        console.warn("ReportAnIssuePage: df-messenger shadowRoot NOT FOUND when trying to open.");
        if (isMessengerComponentReady) {
            const widgetIconRetry = dfMessenger.shadowRoot?.querySelector('#widgetIcon') as HTMLElement | null;
            if (widgetIconRetry && !isChatVisiblyOpen()) {
                widgetIconRetry.click();
            }
        }
        return;
    }
    
    const widgetIcon = dfMessenger.shadowRoot.querySelector('#widgetIcon') as HTMLElement | null;
    
    if (widgetIcon && !isChatVisiblyOpen()) {
      console.log("ReportAnIssuePage: #widgetIcon FOUND. Clicking to open.");
      widgetIcon.click();
    } else if (isChatVisiblyOpen()) {
      console.log("ReportAnIssuePage: Chat already open.");
    } else {
      console.warn("ReportAnIssuePage: #widgetIcon NOT FOUND in shadow DOM when trying to open. isMessengerComponentReady:", isMessengerComponentReady);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        title="Report an Issue"
        subtitle="Speak up safely and confidently. If you're facing or witnessing something wrong, we're here to help."
        description="(All reports are confidential. False submissions may result in action.)"
        showChatbotIcon={false}
        isHomePage={false}
      />

      <main className="flex-grow container mx-auto py-8 md:py-12">
        <section className="grid md:grid-cols-2 gap-8 items-center mb-12 md:mb-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-4">
              Your Confidential Reporting Channel
            </h2>
            <p className="text-lg text-foreground/85 mb-6">
              This is a secure space to report concerns. Use the chat to provide details about:
            </p>
            <ul className="space-y-3 text-foreground/80 list-disc list-inside mb-6">
              <li>Bullying or harassment incidents.</li>
              <li>Mental health struggles you or a friend are facing.</li>
              <li>Other school-related issues or safety concerns.</li>
            </ul>
            <p className="text-lg text-foreground/85 mb-6">
              The chatbot will guide you through the reporting process. Your information will be handled with care and directed to the appropriate school staff.
            </p>
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={openChatWidgetIfNotOpen}
              aria-label="Start a confidential report"
            >
              <MessageCircle size={20} className="mr-2" />
              Start Report
            </Button>
          </div>
          <div>
            <Image 
              src="https://images.unsplash.com/photo-1586953208448-3151cf78393a?q=80&w=600&h=450&fit=crop" 
              alt="Illustration of a confidential letter or secure communication"
              width={600} 
              height={450} 
              className="rounded-lg shadow-xl mx-auto" 
            />
          </div>
        </section>

        <section className="bg-primary/10 p-6 md:p-8 rounded-xl shadow-md text-center">
          <div className="flex items-center justify-center text-primary-foreground mb-3">
             <ShieldQuestion size={32} className="mr-3" />
            <h2 className="text-2xl md:text-3xl font-headline font-semibold">
                How It Works
            </h2>
          </div>
          <p className="text-md md:text-lg text-foreground/85 max-w-2xl mx-auto">
            When you start the chat, the bot will ask you for details about the incident. Please provide as much information as you can. This helps us understand the situation and take appropriate action.
          </p>
        </section>
      </main>

      <Footer />
      {isClient && renderMessenger && (
        <df-messenger
          intent="WELCOME"
          chat-title="Report Help"
          agent-id={REPORT_AGENT_ID}
          language-code="en"
        >
          <df-messenger-chat-bubble></df-messenger-chat-bubble>
        </df-messenger>
      )}
    </div>
  );
}
