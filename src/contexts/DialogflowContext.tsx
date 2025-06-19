
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
      setIsScriptLoaded(true); // Set immediately, window.dfMessenger should be available
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

      const handleMessengerLoaded = () => {
        setIsMessengerReadyForCommands(true);
      };

      messengerEl.removeEventListener('df-messenger-loaded', handleMessengerLoaded);
      messengerEl.addEventListener('df-messenger-loaded', handleMessengerLoaded);
      
      // If messenger is already loaded (e.g. fast load, re-render), set ready state
      // Accessing internal properties like _isLoaded is not ideal but can be a fallback.
      // The event listener is the primary mechanism.
      if (window.dfMessenger && (messengerEl as any)._isLoaded) {
          setIsMessengerReadyForCommands(true);
      }

      // Ensure it's hidden initially or if it becomes unconfigured later.
      // Actual display 'block' will be handled when config is applied and messenger is ready.
      messengerEl.style.display = 'none';

      return () => {
        if (messengerEl) {
          messengerEl.removeEventListener('df-messenger-loaded', handleMessengerLoaded);
        }
      };
    }
  }, [isScriptLoaded]);


  useEffect(() => {
    const messenger = dfMessengerRef.current;
    if (messenger && isScriptLoaded) { // Basic checks
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
        messenger.style.display = 'block'; // Make element visible, DF controls chat UI visibility
      } else if (!currentConfig) { // No config, ensure it's hidden
        messenger.removeAttribute('agent-id');
        messenger.removeAttribute('intent');
        messenger.removeAttribute('chat-title');
        messenger.removeAttribute('chat-subtitle');
        messenger.style.display = 'none';
      } else if (currentConfig && !isMessengerReadyForCommands) {
        // Config is present, script loaded, but messenger not ready -> keep it hidden
        messenger.style.display = 'none';
      }
    }
  }, [currentConfig, isScriptLoaded, isMessengerReadyForCommands]);

  const setConfig = useCallback((config: DialogflowConfig | null) => {
    // If setting a new config, messenger might need to re-initialize for that config
    // We reset isMessengerReadyForCommands only if config actually changes to a new agent or null.
    // If config details change but agentId remains, it might not need full 'df-messenger-loaded' again.
    // However, simplest is to reset if config is set to non-null, assuming df-messenger-loaded will fire again or attributes are dynamic.
    // For now, let's not reset isMessengerReadyForCommands on setConfig, as attributes are dynamic.
    // The `df-messenger-loaded` event is more about the initial load of the component itself.
    setCurrentConfig(config);
  }, []);

  const openChat = useCallback(() => {
    if (isScriptLoaded && window.dfMessenger && dfMessengerRef.current && currentConfig && isMessengerReadyForCommands) {
        dfMessengerRef.current.style.display = 'block'; // Ensure container is visible
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
