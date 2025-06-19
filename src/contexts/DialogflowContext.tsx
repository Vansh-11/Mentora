
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
  const [isMessengerReadyForCommands, setIsMessengerReadyForCommands] = useState(false);
  const dfMessengerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (window.dfMessenger) {
      setIsScriptLoaded(true);
      return;
    }
    const scriptId = 'df-messenger-script';
    if (document.getElementById(scriptId)) {
      // Script tag exists, wait for window.dfMessenger to be populated
      const interval = setInterval(() => {
        if (window.dfMessenger) {
          setIsScriptLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1';
    script.async = true;
    script.onload = () => {
      // window.dfMessenger should be available now or very shortly after
      // Set isScriptLoaded, and the next effect will handle messenger element creation
      setIsScriptLoaded(true);
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
        // Important: Append to body so it's part of the document flow
        // and can receive events / be processed by the DF library.
        document.body.appendChild(messengerEl);
      }
      dfMessengerRef.current = messengerEl;

      const handleMessengerLoaded = () => {
        setIsMessengerReadyForCommands(true);
      };
      
      // Ensure listener is added only once or correctly re-added if messengerEl changes.
      // Given messengerEl is selected or created and then stored in ref, this should be fine.
      messengerEl.removeEventListener('df-messenger-loaded', handleMessengerLoaded);
      messengerEl.addEventListener('df-messenger-loaded', handleMessengerLoaded);
      
      // If messenger is already loaded (e.g. fast load from cache, or re-render after load)
      // The event 'df-messenger-loaded' might have already fired.
      // Accessing internal properties like _isLoaded is not ideal but can be a fallback.
      // The event listener is the primary mechanism.
      if (window.dfMessenger && (messengerEl as any)._isLoaded) {
          setIsMessengerReadyForCommands(true);
      }

      // Ensure it's hidden initially. Actual display 'block' will be handled when 
      // config is applied AND messenger is ready.
      messengerEl.style.display = 'none';

      return () => {
        // Cleanup listener when provider unmounts or script re-evaluates
        if (messengerEl) {
          messengerEl.removeEventListener('df-messenger-loaded', handleMessengerLoaded);
        }
      };
    }
  }, [isScriptLoaded]);


  useEffect(() => {
    const messenger = dfMessengerRef.current;
    if (messenger && isScriptLoaded) { // Basic checks for element and script
      if (currentConfig && isMessengerReadyForCommands) { // Ensure messenger is ready for attribute changes
        messenger.setAttribute('agent-id', currentConfig.agentId);
        messenger.setAttribute('intent', currentConfig.intent);
        messenger.setAttribute('chat-title', currentConfig.chatTitle);
        if (currentConfig.chatSubtitle) {
          messenger.setAttribute('chat-subtitle', currentConfig.chatSubtitle);
        } else {
          messenger.removeAttribute('chat-subtitle');
        }
        messenger.setAttribute('language-code', currentConfig.languageCode || 'en');
        // Ensure the df-messenger HTML element itself is visible in the DOM,
        // so that the Dialogflow library can control the chat bubble visibility.
        messenger.style.display = 'block'; 
      } else if (!currentConfig) { // No config, ensure it's hidden and attributes are cleared
        messenger.removeAttribute('agent-id');
        messenger.removeAttribute('intent');
        messenger.removeAttribute('chat-title');
        messenger.removeAttribute('chat-subtitle');
        messenger.removeAttribute('language-code');
        messenger.style.display = 'none';
      } else if (currentConfig && !isMessengerReadyForCommands) {
        // Config is present, script loaded, but messenger not ready (df-messenger-loaded event hasn't fired)
        // Keep it hidden and wait for isMessengerReadyForCommands to become true.
        messenger.style.display = 'none';
      }
    }
  }, [currentConfig, isScriptLoaded, isMessengerReadyForCommands]);

  const setConfig = useCallback((config: DialogflowConfig | null) => {
    // If config is being set to null, or to a new agent, it's good to ensure
    // isMessengerReadyForCommands might need to be re-evaluated if the agent instance changes significantly.
    // However, the `df-messenger-loaded` event is for the component's initial load.
    // Attribute changes are generally dynamic.
    // If config becomes null, we hide and clear attributes.
    // If config changes, the attributes are updated in the useEffect above.
    // We don't reset isMessengerReadyForCommands here as the script is still loaded and element exists.
    setCurrentConfig(config);
  }, []);

  const openChat = useCallback(() => {
    if (isScriptLoaded && window.dfMessenger && dfMessengerRef.current && currentConfig && isMessengerReadyForCommands) {
        // Ensure the df-messenger element itself is displayed, then open.
        // The Dialogflow library itself handles the visibility of the chat bubble/window.
        dfMessengerRef.current.style.display = 'block'; 
        window.dfMessenger.open();
    } else {
        let reason = "";
        if (!isScriptLoaded) reason += "Script not loaded. ";
        if (!window.dfMessenger) reason += "window.dfMessenger not available. ";
        if (!dfMessengerRef.current) reason += "dfMessengerRef not set. ";
        if (!currentConfig) reason += "No currentConfig. ";
        if (!isMessengerReadyForCommands) reason += "Messenger component not ready (df-messenger-loaded event pending or failed).";
        console.warn(`Dialogflow chat cannot be opened: ${reason.trim()}`);
    }
  }, [isScriptLoaded, currentConfig, isMessengerReadyForCommands]);

  return (
    <DialogflowContext.Provider value={{ setConfig, openChat, isScriptLoaded, isChatConfigured: !!currentConfig && isMessengerReadyForCommands }}>
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
