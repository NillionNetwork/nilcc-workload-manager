'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NilccClient } from '@/lib/nilcc-client';

type Theme = 'light' | 'dark';

interface SettingsContextType {
  apiKey: string | null;
  apiBaseUrl: string;
  client: NilccClient | null;
  theme: Theme;
  setApiKey: (key: string) => void;
  setApiBaseUrl: (url: string) => void;
  clearApiKey: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_API_BASE_URL = 'https://nilcc-api.sandbox.app-cluster.sandbox.nilogy.xyz';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(DEFAULT_API_BASE_URL);
  const [client, setClient] = useState<NilccClient | null>(null);
  const [theme, setThemeState] = useState<Theme>('light');

  // Effect to handle initial load
  useEffect(() => {
    // Load settings from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem('nilcc-api-key');
      const savedApiBaseUrl = localStorage.getItem('nilcc-api-base-url') || DEFAULT_API_BASE_URL;
      
      // Get saved theme or use browser preference as default
      let savedTheme = localStorage.getItem('nilcc-theme') as Theme;
      if (!savedTheme) {
        // Use browser preference for first visit
        savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      setApiBaseUrlState(savedApiBaseUrl);
      setThemeState(savedTheme);
      
      if (savedApiKey) {
        setApiKeyState(savedApiKey);
        setClient(new NilccClient(savedApiKey, '/api', savedApiBaseUrl));
      }
    }
  }, []);

  // Effect to apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  }, [theme]);

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

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nilcc-theme', newTheme);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <SettingsContext.Provider value={{ 
      apiKey, 
      apiBaseUrl, 
      client, 
      theme,
      setApiKey, 
      setApiBaseUrl, 
      clearApiKey,
      setTheme,
      toggleTheme
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