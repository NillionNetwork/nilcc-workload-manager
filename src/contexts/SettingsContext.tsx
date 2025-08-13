'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NilccClient } from '@/lib/nilcc-client';

interface SettingsContextType {
  apiKey: string | null;
  apiBaseUrl: string;
  client: NilccClient | null;
  setApiKey: (key: string) => void;
  setApiBaseUrl: (url: string) => void;
  clearApiKey: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_API_BASE_URL = 'https://nilcc-api.sandbox.app-cluster.sandbox.nilogy.xyz';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(DEFAULT_API_BASE_URL);
  const [client, setClient] = useState<NilccClient | null>(null);

  useEffect(() => {
    // Load settings from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem('nilcc-api-key');
      const savedApiBaseUrl = localStorage.getItem('nilcc-api-base-url') || DEFAULT_API_BASE_URL;
      
      setApiBaseUrlState(savedApiBaseUrl);
      
      if (savedApiKey) {
        setApiKeyState(savedApiKey);
        setClient(new NilccClient(savedApiKey, '/api', savedApiBaseUrl));
      }
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    setClient(new NilccClient(key, '/api', apiBaseUrl));
    if (typeof window !== 'undefined') {
      localStorage.setItem('nilcc-api-key', key);
    }
  };

  const setApiBaseUrl = (url: string) => {
    setApiBaseUrlState(url);
    // Recreate client with new base URL if we have an API key
    if (apiKey) {
      setClient(new NilccClient(apiKey, '/api', url));
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('nilcc-api-base-url', url);
    }
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    setClient(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nilcc-api-key');
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      apiKey, 
      apiBaseUrl, 
      client, 
      setApiKey, 
      setApiBaseUrl, 
      clearApiKey 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}