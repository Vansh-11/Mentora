
"use client";

import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/mentora/Header';
import Footer from '@/components/mentora/Footer';
import { Button } from '@/components/ui/button';
import { Info, AlertTriangle, Sparkles, MessageCircle } from 'lucide-react';
import Image from 'next/image';

const HOMEWORK_AGENT_ID = "20dce2b7-dfcf-491e-bee9-5d19f6c8837f";
const DIALOGFLOW_SCRIPT_URL = "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
const DF_SCRIPT_ID = "dialogflow-bootstrap-script-homework"; 

export default function HomeworkHelpPage() {
  const [isClient, setIsClient] = useState(false);
  const [renderMessenger, setRenderMessenger] = useState(false);
  const [isMessengerComponentReady, setIsMessengerComponentReady] = useState(false);
  const messengerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const messengerSelector = `df-messenger[agent-id="${HOMEWORK_AGENT_ID}"]`;

    const handleMessengerLoaded = () => {
      console.log(`HomeworkHelpPage: df-messenger-loaded event received for agent ${HOMEWORK_AGENT_ID}.`);
      setIsMessengerComponentReady(true);
    };
    
    const messengerElement = document.querySelector(messengerSelector);
    if (messengerElement) {
      messengerElement.addEventListener('df-messenger-loaded', handleMessengerLoaded);
      messengerRef.current = messengerElement as HTMLElement;
    }

    const loadAndInitializeMessenger = () => {
      if (document.querySelector(messengerSelector)) {
        console.log("HomeworkHelpPage: Dialogflow Messenger for this agent already in DOM.");
        messengerRef.current = document.querySelector(messengerSelector);
        if (messengerRef.current) {
            messengerRef.current.addEventListener('df-messenger-loaded', handleMessengerLoaded);
        }
        setRenderMessenger(true); 
        return;
      }

      if ((window as any).dfMessengerBootstrapLoaded) {
        console.log("HomeworkHelpPage: Dialogflow bootstrap script already loaded globally.");
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
          console.log("HomeworkHelpPage: Dialogflow bootstrap.js loaded.");
          (window as any).dfMessengerBootstrapLoaded = true; 
          setRenderMessenger(true);
        };
        script.onerror = () => {
          console.error("HomeworkHelpPage: Failed to load Dialogflow bootstrap.js.");
        };
      } else {
        const handleExistingScriptLoad = () => {
          if (!(window as any).dfMessengerBootstrapLoaded) {
            console.log("HomeworkHelpPage: Dialogflow bootstrap.js (existing tag) loaded.");
            (window as any).dfMessengerBootstrapLoaded = true;
          }
          setRenderMessenger(true);
        };

        if ((window as any).dfMessengerBootstrapLoaded) { 
            handleExistingScriptLoad();
        } else {
            script.addEventListener('load', handleExistingScriptLoad);
            script.addEventListener('error', () => console.error("HomeworkHelpPage: Failed to load Dialogflow bootstrap.js (existing tag)."));
        }
      }
    };

    loadAndInitializeMessenger();

    return () => {
      const existingMessenger = document.querySelector(messengerSelector);
      if (existingMessenger) {
        console.log("HomeworkHelpPage: Removing Dialogflow Messenger for this agent on unmount.");
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

    const dfMessengerElement = document.querySelector(`df-messenger[agent-id="${HOMEWORK_AGENT_ID}"]`);
    const handleDfMessengerLoadedEvent = () => {
      console.log(`HomeworkHelpPage: df-messenger-loaded event received for agent ${HOMEWORK_AGENT_ID} (useEffect).`);
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
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${HOMEWORK_AGENT_ID}"]`) as HTMLElement | null;
    if (!dfMessenger) return false;
    const shadowRoot = dfMessenger.shadowRoot;
    if (!shadowRoot) return false;
    const chatWrapper = shadowRoot.querySelector('#dialogflow-chat-wrapper');
    return chatWrapper ? getComputedStyle(chatWrapper).getPropertyValue('display') !== 'none' : false;
  };

  const openChatWidgetIfNotOpen = () => {
    if (!isClient) {
      console.warn('HomeworkHelpPage: Attempted to open chat before client hydration.');
      return;
    }
    
    const dfMessenger = document.querySelector(`df-messenger[agent-id="${HOMEWORK_AGENT_ID}"]`) as any;

    if (!dfMessenger) {
      console.warn(`HomeworkHelpPage: df-messenger with agent-id ${HOMEWORK_AGENT_ID} not found when trying to open.`);
      return;
    }

    if (!dfMessenger.shadowRoot) {
      console.warn("HomeworkHelpPage: df-messenger shadowRoot NOT FOUND when trying to open.");
      return;
    }
    
    const widgetIcon = dfMessenger.shadowRoot.querySelector('#widgetIcon') as HTMLElement | null;
    
    if (widgetIcon && !isChatVisiblyOpen()) {
      console.log("HomeworkHelpPage: #widgetIcon FOUND. Clicking to open.");
      widgetIcon.click();
    } else if (isChatVisiblyOpen()) {
      console.log("HomeworkHelpPage: Chat already open.");
    } else {
      console.warn("HomeworkHelpPage: #widgetIcon NOT FOUND in shadow DOM when trying to open. isMessengerComponentReady:", isMessengerComponentReady);
    }
  };
  
  const handleAskQuestionClick = () => {
    openChatWidgetIfNotOpen();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header
        title="Homework Helper Bot"
        subtitle="Ask Your Questions Directly!"
        description="Click the button below to ask Mentora about Physics, Chemistry, or English topics. The answers are sourced from our knowledge base."
        showChatbotIcon={false}
        isHomePage={false}
      />
      <main className="flex-grow container mx-auto py-8 md:py-12">
        <section className="grid md:grid-cols-2 gap-8 items-center mb-12 md:mb-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-4">
              Ask Your Homework Question
            </h2>
            <div className="space-y-5 mb-6 text-foreground/90">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <h3 className="text-md font-semibold text-primary-foreground flex items-center mb-2">
                  <Info size={18} className="mr-2 text-accent flex-shrink-0" />
                  How to use the bot:
                </h3>
                <ul className="list-disc list-inside pl-5 space-y-1 text-foreground/80">
                  <li>Type your question in full (avoid just keywords).</li>
                  <li>Ask concept-based or theory questions.</li>
                  <li>The bot currently supports Physics, Chemistry, and English topics.</li>
                </ul>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <h3 className="text-md font-semibold text-primary-foreground flex items-center mb-2">
                  <Sparkles size={18} className="mr-2 text-accent flex-shrink-0" /> Examples:
                </h3>
                <ul className="list-disc list-inside pl-5 space-y-1 text-foreground/80">
                  <li>What is a catalyst?</li>
                  <li>Explain molarity.</li>
                  <li>What is a simile?</li>
                </ul>
              </div>

              <div className="flex items-start p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
                <AlertTriangle size={20} className="mr-3 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Important Note:</p>
                  <p className="text-sm">
                    The bot won’t solve numerical problems or math equations yet.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleAskQuestionClick}
              aria-label="Ask a homework question"
            >
              <MessageCircle size={20} className="mr-2" />
              Ask a Question
            </Button>
          </div>
           <div>
            <Image
              src="/homework-help.jpg"
              alt="Student studying or books and learning materials"
              width={600}
              height={450}
              className="rounded-lg shadow-xl mx-auto"
            />
          </div>
        </section>
        
        <section className="bg-primary/10 p-6 md:p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-3">
            Unlock Knowledge!
          </h2>
          <p className="text-md md:text-lg text-foreground/85 max-w-2xl mx-auto">
            Don't get stuck on homework. Ask the Homework Helper for explanations and information on various subjects.
          </p>
        </section>

      </main>
      <Footer />
      {isClient && renderMessenger && (
        <df-messenger
          intent="WELCOME"
          chat-title="Homework"
          agent-id={HOMEWORK_AGENT_ID}
          language-code="en"
          chat-width="360px"
          chat-height="500px"
        >
          <df-messenger-chat-bubble></df-messenger-chat-bubble>
        </df-messenger>
      )}
    </div>
  );
}
