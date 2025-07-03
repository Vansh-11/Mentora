
"use client";

import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/mentora/Header';
import Footer from '@/components/mentora/Footer';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import Image from 'next/image';

const MENTAL_HEALTH_AGENT_ID = "f1d56207-6f14-457c-b432-416d9a804919";
const DIALOGFLOW_SCRIPT_URL = "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
const DF_SCRIPT_ID = "dialogflow-bootstrap-script"; 

export default function MentalHealthPage() {
  const [isClient, setIsClient] = useState(false);
  const [renderMessenger, setRenderMessenger] = useState(false);
  const messengerRef = useRef<HTMLElement | null>(null);
  const [isMessengerComponentReady, setIsMessengerComponentReady] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const messengerSelector = `df-messenger[agent-id="${MENTAL_HEALTH_AGENT_ID}"]`;
    
    const handleMessengerLoaded = () => {
      console.log(`MentalHealthPage: df-messenger-loaded event received for agent ${MENTAL_HEALTH_AGENT_ID}.`);
      setIsMessengerComponentReady(true);
    };
    
    const messengerElement = document.querySelector(messengerSelector);
    if (messengerElement) {
      messengerElement.addEventListener('df-messenger-loaded', handleMessengerLoaded);
      messengerRef.current = messengerElement as HTMLElement;
    }


    const loadAndInitializeMessenger = () => {
      if (document.querySelector(messengerSelector)) {
        console.log("MentalHealthPage: Dialogflow Messenger for this agent already in DOM.");
        messengerRef.current = document.querySelector(messengerSelector);
        if(messengerRef.current) {
            messengerRef.current.addEventListener('df-messenger-loaded', handleMessengerLoaded);
        }
        setRenderMessenger(true);
        return;
      }

      if ((window as any).dfMessengerBootstrapLoaded) {
        console.log("MentalHealthPage: Dialogflow bootstrap script already loaded globally.");
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
          console.log("MentalHealthPage: Dialogflow bootstrap.js loaded.");
          (window as any).dfMessengerBootstrapLoaded = true;
          setRenderMessenger(true);
        };
        script.onerror = () => {
          console.error("MentalHealthPage: Failed to load Dialogflow bootstrap.js.");
        };
      } else {
        const handleExistingScriptLoad = () => {
          if (!(window as any).dfMessengerBootstrapLoaded) {
            console.log("MentalHealthPage: Dialogflow bootstrap.js (existing tag) loaded.");
            (window as any).dfMessengerBootstrapLoaded = true;
          }
          setRenderMessenger(true);
        };
        if ((window as any).dfMessengerBootstrapLoaded) {
            handleExistingScriptLoad();
        } else {
            script.addEventListener('load', handleExistingScriptLoad);
            script.addEventListener('error', () => console.error("MentalHealthPage: Failed to load Dialogflow bootstrap.js (existing tag)."));
        }
      }
    };

    loadAndInitializeMessenger();

    return () => {
      const existingMessenger = document.querySelector(messengerSelector);
      if (existingMessenger) {
        console.log("MentalHealthPage: Removing Dialogflow Messenger for this agent on unmount.");
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

    const dfMessengerElement = document.querySelector(`df-messenger[agent-id="${MENTAL_HEALTH_AGENT_ID}"]`);
    const handleDfMessengerLoadedEvent = () => {
      console.log(`MentalHealthPage: df-messenger-loaded event received for agent ${MENTAL_HEALTH_AGENT_ID} (useEffect).`);
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
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${MENTAL_HEALTH_AGENT_ID}"]`) as HTMLElement | null;
    if (!dfMessenger) return false;
    const shadowRoot = dfMessenger.shadowRoot;
    if (!shadowRoot) return false;
    const chatWrapper = shadowRoot.querySelector('#dialogflow-chat-wrapper');
    return chatWrapper ? getComputedStyle(chatWrapper).getPropertyValue('display') !== 'none' : false;
  };

  const openChatWidgetIfNotOpen = () => {
     if (!isClient) {
      console.warn('MentalHealthPage: Attempted to open chat before client hydration.');
      return;
    }
    
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${MENTAL_HEALTH_AGENT_ID}"]`) as any;

    if (!dfMessenger) {
      console.warn(`MentalHealthPage: df-messenger with agent-id ${MENTAL_HEALTH_AGENT_ID} not found when trying to open.`);
      return;
    }
    
    if (!dfMessenger.shadowRoot) {
        console.warn("MentalHealthPage: df-messenger shadowRoot NOT FOUND when trying to open.");
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
      console.log("MentalHealthPage: #widgetIcon FOUND. Clicking to open.");
      widgetIcon.click();
    } else if (isChatVisiblyOpen()) {
      console.log("MentalHealthPage: Chat already open.");
    } else {
      console.warn("MentalHealthPage: #widgetIcon NOT FOUND in shadow DOM when trying to open. isMessengerComponentReady:", isMessengerComponentReady);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        title="Mental Health Support"
        subtitle="Your Safe Space to Talk and Reflect"
        description="Mentora provides a confidential environment to discuss your feelings, manage stress, and explore well-being strategies. We're here to listen without judgment."
        showChatbotIcon={false}
        isHomePage={false}
      />

      <main className="flex-grow container mx-auto py-8 md:py-12">
        <section className="grid md:grid-cols-2 gap-8 items-center mb-12 md:mb-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-4">
              How Mentora Can Help Your Well-being
            </h2>
            <p className="text-lg text-foreground/85 mb-6">
              Navigating student life can be challenging. Mentora offers a supportive ear and resources for:
            </p>
            <ul className="space-y-3 text-foreground/80 list-disc list-inside mb-6">
              <li>Managing stress from exams, assignments, or social pressures.</li>
              <li>Coping with feelings of anxiety, sadness, or loneliness.</li>
              <li>Finding healthy ways to deal with difficult emotions.</li>
              <li>Getting tips for mindfulness and relaxation.</li>
              <li>Understanding when and how to seek further help.</li>
            </ul>
            <p className="text-lg text-foreground/85 mb-6">
              Remember, your conversations with Mentora are private. Click the button below or the chat icon to start.
            </p>
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={openChatWidgetIfNotOpen}
              aria-label="Talk to Mentora about mental health"
            >
              <MessageCircle size={20} className="mr-2" />
              Talk to Mentora Now
            </Button>
          </div>
          <div>
            <Image 
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&h=450&fit=crop" 
              alt="Calm illustration representing mental well-being"
              width={600} 
              height={450} 
              className="rounded-lg shadow-xl mx-auto" 
            />
          </div>
        </section>

        <section className="bg-primary/10 p-6 md:p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-3">
            Using the Chat for Support
          </h2>
          <p className="text-md md:text-lg text-foreground/85 max-w-2xl mx-auto">
            When you open the chat by clicking the button above, you can start by saying "Hi", "I want to talk about how I'm feeling", or simply type what's on your mind.
            Mentora is programmed to listen, provide supportive responses, and guide you to helpful resources if needed.
          </p>
        </section>
      </main>

      <Footer />
      {isClient && renderMessenger && (
        <df-messenger
          project-id="mentora-project"
          agent-id={MENTAL_HEALTH_AGENT_ID}
          language-code="en"
          intent="Welcome"
          chat-title="Mental"
          chat-subtitle="Here to support you"
          chat-title-icon="https://firebasestorage.googleapis.com/v0/b/kitchx-iris.appspot.com/o/default_avatar.jpeg?alt=media&token=f5ed6ea6-eb74-4cb1-b341-945314321716"
          chat-width="360px"
          chat-height="500px"
        >
          <df-messenger-chat-bubble></df-messenger-chat-bubble>
        </df-messenger>
      )}
    </div>
  );
}
