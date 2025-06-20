
"use client";

import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/mentora/Header';
import Footer from '@/components/mentora/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight, MessageSquareHeart, MessageCircle } from 'lucide-react';
import Image from 'next/image';

const ACTIVITIES_AGENT_ID = "75e34229-81d6-48dc-a566-837752d63132";
const DIALOGFLOW_SCRIPT_URL = "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
const DF_SCRIPT_ID = "dialogflow-bootstrap-script-activities"; 

export default function ActivitiesPage() {
  const [isClient, setIsClient] = useState(false);
  const [renderMessenger, setRenderMessenger] = useState(false);
  const messengerRef = useRef<HTMLElement | null>(null);
  const [isMessengerComponentReady, setIsMessengerComponentReady] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const messengerSelector = `df-messenger[agent-id="${ACTIVITIES_AGENT_ID}"]`;
    
    const handleMessengerLoaded = () => {
      console.log(`ActivitiesPage: df-messenger-loaded event received for agent ${ACTIVITIES_AGENT_ID}.`);
      setIsMessengerComponentReady(true);
    };
    
    const messengerElement = document.querySelector(messengerSelector);
    if (messengerElement) {
      messengerElement.addEventListener('df-messenger-loaded', handleMessengerLoaded);
      messengerRef.current = messengerElement as HTMLElement;
    }


    const loadAndInitializeMessenger = () => {
      if (document.querySelector(messengerSelector)) {
        console.log("ActivitiesPage: Dialogflow Messenger for this agent already in DOM.");
        messengerRef.current = document.querySelector(messengerSelector);
        if (messengerRef.current) {
            messengerRef.current.addEventListener('df-messenger-loaded', handleMessengerLoaded);
        }
        setRenderMessenger(true);
        return;
      }

      if ((window as any).dfMessengerBootstrapLoaded) {
        console.log("ActivitiesPage: Dialogflow bootstrap script already loaded globally.");
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
          console.log("ActivitiesPage: Dialogflow bootstrap.js loaded.");
          (window as any).dfMessengerBootstrapLoaded = true; 
          setRenderMessenger(true);
        };
        script.onerror = () => {
          console.error("ActivitiesPage: Failed to load Dialogflow bootstrap.js.");
        };
      } else {
        const handleExistingScriptLoad = () => {
          if (!(window as any).dfMessengerBootstrapLoaded) {
            console.log("ActivitiesPage: Dialogflow bootstrap.js (existing tag) loaded.");
            (window as any).dfMessengerBootstrapLoaded = true;
          }
          setRenderMessenger(true);
        };

        if ((window as any).dfMessengerBootstrapLoaded) { 
            handleExistingScriptLoad();
        } else {
            script.addEventListener('load', handleExistingScriptLoad);
            script.addEventListener('error', () => console.error("ActivitiesPage: Failed to load Dialogflow bootstrap.js (existing tag)."));
        }
      }
    };

    loadAndInitializeMessenger();

    return () => {
      const existingMessenger = document.querySelector(messengerSelector);
      if (existingMessenger) {
        console.log("ActivitiesPage: Removing Dialogflow Messenger for this agent on unmount.");
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

    const dfMessengerElement = document.querySelector(`df-messenger[agent-id="${ACTIVITIES_AGENT_ID}"]`);
    const handleDfMessengerLoadedEvent = () => {
      console.log(`ActivitiesPage: df-messenger-loaded event received for agent ${ACTIVITIES_AGENT_ID} (useEffect).`);
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
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${ACTIVITIES_AGENT_ID}"]`) as HTMLElement | null;
    if (!dfMessenger) return false;
    const shadowRoot = dfMessenger.shadowRoot;
    if (!shadowRoot) return false;
    const chatWrapper = shadowRoot.querySelector('#dialogflow-chat-wrapper');
    return chatWrapper ? getComputedStyle(chatWrapper).getPropertyValue('display') !== 'none' : false;
  };

  const openChatWidgetIfNotOpen = () => {
    if (!isClient) {
      console.warn('ActivitiesPage: Attempted to open chat before client hydration.');
      return;
    }
    
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${ACTIVITIES_AGENT_ID}"]`) as any;

    if (!dfMessenger) {
      console.warn(`ActivitiesPage: df-messenger with agent-id ${ACTIVITIES_AGENT_ID} not found when trying to open.`);
      return;
    }
    
    if (!dfMessenger.shadowRoot) {
        console.warn("ActivitiesPage: df-messenger shadowRoot NOT FOUND when trying to open. Attempting to wait for it.");
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
      console.log("ActivitiesPage: #widgetIcon FOUND. Clicking to open.");
      widgetIcon.click();
    } else if (isChatVisiblyOpen()) {
      console.log("ActivitiesPage: Chat already open.");
    } else {
      console.warn("ActivitiesPage: #widgetIcon NOT FOUND in shadow DOM when trying to open. isMessengerComponentReady:", isMessengerComponentReady);
    }
  };

  const handleAskButtonClick = () => {
    openChatWidgetIfNotOpen();
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header
        title="🗓️ Activities Assistant"
        subtitle="Your Guide to School Events"
        description="Learn how to ask the chatbot about upcoming and past school activities, and how to register for them."
        showChatbotIcon={false} 
        isHomePage={false}
      />
      <main className="flex-grow container mx-auto py-8 md:py-12">
        <section className="grid md:grid-cols-2 gap-8 items-center mb-12 md:mb-16">
          <Card className="w-full shadow-lg rounded-xl h-full">
            <CardHeader className="text-center items-center pt-6 pb-4">
              <MessageSquareHeart size={36} className="text-primary-foreground mb-3" />
              <CardTitle className="font-headline text-2xl text-primary-foreground">
                Welcome to the Activities Assistant!
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 md:px-8 md:pb-8 text-left">
              <p className="text-foreground/90 mb-6 text-center md:text-left">
                I can help you with details about past school events or guide you to register for upcoming ones. Just type things like:
              </p>
              
              <div className="space-y-3 mb-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
                <h3 className="text-md font-semibold text-primary-foreground flex items-center mb-3">
                  <Sparkles size={18} className="mr-2 text-accent flex-shrink-0" /> 
                  Example Questions:
                </h3>
                <ul className="list-none space-y-2 text-foreground/80 pl-2">
                  <li className="flex items-start">
                    <ChevronRight size={16} className="mr-2 mt-1 text-accent flex-shrink-0" />
                    <span>“List the events that already took place.”</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight size={16} className="mr-2 mt-1 text-accent flex-shrink-0" />
                    <span>“Are there any activities lined up?”</span>
                  </li>
                </ul>
              </div>

              <p className="text-center text-lg text-foreground/90 mt-8 mb-6">
                I’m here to make sure you never miss out on what’s happening at school! 😊
              </p>

              <div className="flex justify-center mt-8">
                <Button 
                  size="lg" 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={handleAskButtonClick}
                  aria-label="Ask about activities"
                >
                  <MessageCircle size={20} className="mr-2" />
                  Ask About Activities
                </Button>
              </div>
            </CardContent>
          </Card>
          <div>
            <Image 
              src="https://placehold.co/600x450.png" 
              alt="Illustration of school events or calendar"
              data-ai-hint="school events calendar"
              width={600} 
              height={450} 
              className="rounded-lg shadow-xl mx-auto" 
            />
          </div>
        </section>

        <section className="bg-primary/10 p-6 md:p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-3">
            Stay Informed!
          </h2>
          <p className="text-md md:text-lg text-foreground/85 max-w-2xl mx-auto">
            Use the Activities Assistant to easily find out about all school happenings, from club meetings to sports events and special workshops.
          </p>
        </section>
      </main>
      <Footer />
      {isClient && renderMessenger && (
        <df-messenger
          intent="WELCOME"
          chat-title="Event"
          agent-id={ACTIVITIES_AGENT_ID}
          language-code="en"
        >
          <df-messenger-chat-bubble></df-messenger-chat-bubble>
        </df-messenger>
      )}
    </div>
  );
}
