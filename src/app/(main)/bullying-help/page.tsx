
"use client";

import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/mentora/Header';
import Footer from '@/components/mentora/Footer';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import Image from 'next/image';

const BULLYING_AGENT_ID = "b6bf9ff2-a493-42c1-a77d-afe9964eb2ae";
const DIALOGFLOW_SCRIPT_URL = "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
const DF_SCRIPT_ID = "dialogflow-bootstrap-script-bullying"; 

export default function BullyingHelpPage() {
  const [isClient, setIsClient] = useState(false);
  const [renderMessenger, setRenderMessenger] = useState(false);
  const messengerRef = useRef<HTMLElement | null>(null);
  const [isMessengerComponentReady, setIsMessengerComponentReady] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const messengerSelector = `df-messenger[agent-id="${BULLYING_AGENT_ID}"]`;
    
    const handleMessengerLoaded = () => {
      console.log(`BullyingHelpPage: df-messenger-loaded event received for agent ${BULLYING_AGENT_ID}.`);
      setIsMessengerComponentReady(true);
    };
    
    const messengerElement = document.querySelector(messengerSelector);
    if (messengerElement) {
      messengerElement.addEventListener('df-messenger-loaded', handleMessengerLoaded);
      messengerRef.current = messengerElement as HTMLElement;
    }


    const loadAndInitializeMessenger = () => {
      if (document.querySelector(messengerSelector)) {
        console.log("BullyingHelpPage: Dialogflow Messenger for this agent already in DOM.");
        messengerRef.current = document.querySelector(messengerSelector);
        if(messengerRef.current) {
            messengerRef.current.addEventListener('df-messenger-loaded', handleMessengerLoaded);
        }
        setRenderMessenger(true);
        return;
      }

      if ((window as any).dfMessengerBootstrapLoaded) {
        console.log("BullyingHelpPage: Dialogflow bootstrap script already loaded globally.");
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
          console.log("BullyingHelpPage: Dialogflow bootstrap.js loaded.");
          (window as any).dfMessengerBootstrapLoaded = true;
          setRenderMessenger(true);
        };
        script.onerror = () => {
          console.error("BullyingHelpPage: Failed to load Dialogflow bootstrap.js.");
        };
      } else {
        const handleExistingScriptLoad = () => {
          if (!(window as any).dfMessengerBootstrapLoaded) {
            console.log("BullyingHelpPage: Dialogflow bootstrap.js (existing tag) loaded.");
            (window as any).dfMessengerBootstrapLoaded = true;
          }
          setRenderMessenger(true);
        };
        if ((window as any).dfMessengerBootstrapLoaded) {
            handleExistingScriptLoad();
        } else {
            script.addEventListener('load', handleExistingScriptLoad);
            script.addEventListener('error', () => console.error("BullyingHelpPage: Failed to load Dialogflow bootstrap.js (existing tag)."));
        }
      }
    };

    loadAndInitializeMessenger();

    return () => {
      const existingMessenger = document.querySelector(messengerSelector);
      if (existingMessenger) {
        console.log("BullyingHelpPage: Removing Dialogflow Messenger for this agent on unmount.");
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

    const dfMessengerElement = document.querySelector(`df-messenger[agent-id="${BULLYING_AGENT_ID}"]`);
    const handleDfMessengerLoadedEvent = () => {
      console.log(`BullyingHelpPage: df-messenger-loaded event received for agent ${BULLYING_AGENT_ID} (useEffect).`);
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
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${BULLYING_AGENT_ID}"]`) as HTMLElement | null;
    if (!dfMessenger) return false;
    const shadowRoot = dfMessenger.shadowRoot;
    if (!shadowRoot) return false;
    const chatWrapper = shadowRoot.querySelector('#dialogflow-chat-wrapper');
    return chatWrapper ? getComputedStyle(chatWrapper).getPropertyValue('display') !== 'none' : false;
  };

  const openChatWidgetIfNotOpen = () => {
     if (!isClient) {
      console.warn('BullyingHelpPage: Attempted to open chat before client hydration.');
      return;
    }
    
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${BULLYING_AGENT_ID}"]`) as any;

    if (!dfMessenger) {
      console.warn(`BullyingHelpPage: df-messenger with agent-id ${BULLYING_AGENT_ID} not found when trying to open.`);
      return;
    }
    
    if (!dfMessenger.shadowRoot) {
        console.warn("BullyingHelpPage: df-messenger shadowRoot NOT FOUND when trying to open.");
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
      console.log("BullyingHelpPage: #widgetIcon FOUND. Clicking to open.");
      widgetIcon.click();
    } else if (isChatVisiblyOpen()) {
      console.log("BullyingHelpPage: Chat already open.");
    } else {
      console.warn("BullyingHelpPage: #widgetIcon NOT FOUND in shadow DOM when trying to open. isMessengerComponentReady:", isMessengerComponentReady);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        title="Bullying Support"
        subtitle="A Safe Place to Report and Get Help"
        description="If you are experiencing or witnessing bullying, you're not alone. This is a confidential space to talk about it and get support."
        showChatbotIcon={false}
        isHomePage={false}
      />

      <main className="flex-grow container mx-auto py-8 md:py-12">
        <section className="grid md:grid-cols-2 gap-8 items-center mb-12 md:mb-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-4">
              You Are Not Alone
            </h2>
            <p className="text-lg text-foreground/85 mb-6">
              Dealing with bullying can be incredibly difficult. Mentora is here to provide a secure and non-judgmental environment where you can:
            </p>
            <ul className="space-y-3 text-foreground/80 list-disc list-inside mb-6">
              <li>Talk about what's happening without fear of judgment.</li>
              <li>Understand what constitutes bullying and its impact.</li>
              <li>Learn about strategies to cope with the situation.</li>
              <li>Find out about the steps you can take to get help from the school.</li>
            </ul>
            <p className="text-lg text-foreground/85 mb-6">
              Your conversation is private. Click below to start talking to a support agent who can help.
            </p>
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={openChatWidgetIfNotOpen}
              aria-label="Talk to a support agent about bullying"
            >
              <MessageCircle size={20} className="mr-2" />
              Talk to a Support Agent
            </Button>
          </div>
          <div>
            <Image
              src="/bully.png"
              alt="Illustration of a supportive friend comforting another"
              width={600}
              height={450}
              className="rounded-lg shadow-xl mx-auto"
            />
          </div>
        </section>

        <section className="bg-primary/10 p-6 md:p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-3">
            Your Voice Matters
          </h2>
          <p className="text-md md:text-lg text-foreground/85 max-w-2xl mx-auto">
            Speaking up is a brave first step. Use the chat to share your experience. We are here to listen and connect you with the right resources to ensure your safety and well-being.
          </p>
        </section>
      </main>

      <Footer />
      {isClient && renderMessenger && (
        <df-messenger
          intent="WELCOME"
          chat-title="Bullying Help"
          agent-id={BULLYING_AGENT_ID}
          language-code="en"
        >
          <df-messenger-chat-bubble></df-messenger-chat-bubble>
        </df-messenger>
      )}
    </div>
  );
}
