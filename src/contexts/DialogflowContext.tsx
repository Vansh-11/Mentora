"use client";
import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    dfMessenger: any; 
  }
}

export interface DialogflowConfig {
  agentId: string;
  intent: string;
  chatTitle: string;
  chatSubtitle?: string;
  languageCode?: string; 
}

interface DialogflowContextType {
  setConfig: (config: DialogflowConfig | null) => void;
  openChat: () => void;
  isScriptLoaded: boolean;
  isChatConfigured: boolean; 
}

const DialogflowContext = createContext<DialogflowContextType | undefined>(undefined);

export const DialogflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentConfig, setCurrentConfig] = useState<DialogflowConfig | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const dfMessengerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (window.dfMessenger) {
      setIsScriptLoaded(true);
      return;
    }
    const scriptId = 'df-messenger-script';
    if (document.getElementById(scriptId)) {
      const interval = setInterval(() => {
        if (window.dfMessenger) {
          setIsScriptLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1';
    script.async = true;
    script.onload = () => {
       // Wait a bit for dfMessenger to be fully initialized after script load
       setTimeout(() => setIsScriptLoaded(true), 100);
    };
    script.onerror = () => {
      console.error("Failed to load Dialogflow Messenger script.");
    };
    document.body.appendChild(script);

  }, []);

  useEffect(() => {
    if (isScriptLoaded) {
      let messengerEl = document.querySelector('df-messenger') as HTMLElement;
      if (!messengerEl) {
        messengerEl = document.createElement('df-messenger');
        document.body.appendChild(messengerEl);
      }
      dfMessengerRef.current = messengerEl;
      messengerEl.style.display = 'none'; // Initially hidden
    }
  }, [isScriptLoaded]);


  useEffect(() => {
    const messenger = dfMessengerRef.current;
    if (messenger && isScriptLoaded) {
      if (currentConfig) {
        messenger.setAttribute('agent-id', currentConfig.agentId);
        messenger.setAttribute('intent', currentConfig.intent);
        messenger.setAttribute('chat-title', currentConfig.chatTitle);
        if (currentConfig.chatSubtitle) {
          messenger.setAttribute('chat-subtitle', currentConfig.chatSubtitle);
        } else {
          messenger.removeAttribute('chat-subtitle');
        }
        messenger.setAttribute('language-code', currentConfig.languageCode || 'en');
        messenger.style.display = 'block';
      } else {
        messenger.removeAttribute('agent-id');
        messenger.removeAttribute('intent');
        messenger.removeAttribute('chat-title');
        messenger.removeAttribute('chat-subtitle');
        messenger.style.display = 'none';
      }
    }
  }, [currentConfig, isScriptLoaded]);

  const setConfig = useCallback((config: DialogflowConfig | null) => {
    setCurrentConfig(config);
  }, []);

  const openChat = useCallback(() => {
    if (isScriptLoaded && window.dfMessenger && dfMessengerRef.current && currentConfig) {
        dfMessengerRef.current.style.display = 'block';
        // Ensure attributes are set before opening
        // This is implicitly handled by currentConfig dependency in the useEffect above
        window.dfMessenger.open();
    } else {
        console.warn("Dialogflow chat cannot be opened: Not loaded, no config, or messenger element not ready.");
    }
  }, [isScriptLoaded, currentConfig]);

  return (
    <DialogflowContext.Provider value={{ setConfig, openChat, isScriptLoaded, isChatConfigured: !!currentConfig }}>
      {children}
    </DialogflowContext.Provider>
  );
};

export const useDialogflow = () => {
  const context = useContext(DialogflowContext);
  if (context === undefined) {
    throw new Error('useDialogflow must be used within a DialogflowProvider');
  }
  return context;
};
