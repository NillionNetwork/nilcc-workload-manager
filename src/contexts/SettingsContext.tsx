'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NilccClient } from '@/lib/nilcc-client';
import { DEFAULT_NILCC_API_BASE } from '@/lib/constants';

type ThemeMode = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

interface SettingsContextType {
  apiKey: string | null;
  apiBaseUrl: string;
  client: NilccClient | null;
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setApiKey: (key: string) => void;
  setApiBaseUrl: (url: string) => void;
  clearApiKey: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  cycleTheme: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(DEFAULT_NILCC_API_BASE);
  const [client, setClient] = useState<NilccClient | null>(null);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');

  // Effect to handle initial load
  useEffect(() => {
    // Load settings from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem('nilcc-api-key');
      const savedApiBaseUrl = localStorage.getItem('nilcc-api-base-url') || DEFAULT_NILCC_API_BASE;
      
      // Get saved theme mode, default to 'system'
      const savedThemeMode = (localStorage.getItem('nilcc-theme-mode') as ThemeMode) || 'system';
      
      // Detect system theme preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSystemTheme(prefersDark ? 'dark' : 'light');
      
      setApiBaseUrlState(savedApiBaseUrl);
      setThemeModeState(savedThemeMode);
      
      if (savedApiKey) {
        setApiKeyState(savedApiKey);
        setClient(new NilccClient(savedApiKey, '/api', savedApiBaseUrl));
      }
    }
  }, []);

  // Effect to listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Effect to resolve the actual theme based on mode and system preference
  useEffect(() => {
    const resolved = themeMode === 'system' ? systemTheme : themeMode;
    setResolvedTheme(resolved);
  }, [themeMode, systemTheme]);

  // Effect to apply resolved theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    }
  }, [resolvedTheme]);

  const setApiKey = (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nilcc-api-key', key);
    }
    setApiKeyState(key);
    setClient(new NilccClient(key, '/api', apiBaseUrl));
  };

  const setApiBaseUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nilcc-api-base-url', url);
    }
    setApiBaseUrlState(url);
    // Recreate client with new base URL if we have an API key
    if (apiKey) {
      setClient(new NilccClient(apiKey, '/api', url));
    }
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    setClient(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nilcc-api-key');
    }
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setThemeModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nilcc-theme-mode', newMode);
    }
  };

  const cycleTheme = () => {
    // Cycle through: system -> light -> dark -> system
    const nextMode: ThemeMode =
      themeMode === 'system' ? 'light' :
      themeMode === 'light' ? 'dark' : 'system';
    setThemeMode(nextMode);
  };

  return (
    <SettingsContext.Provider value={{
      apiKey,
      apiBaseUrl,
      client,
      themeMode,
      resolvedTheme,
      setApiKey,
      setApiBaseUrl,
      clearApiKey,
      setThemeMode,
      cycleTheme
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