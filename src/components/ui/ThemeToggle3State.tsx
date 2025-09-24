'use client';

import { Monitor, Sun, Moon } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export function ThemeToggle3State() {
  const { themeMode, cycleTheme } = useSettings();

  const getIcon = () => {
    switch (themeMode) {
      case 'system':
        return <Monitor style={{ width: '1rem', height: '1rem' }} />;
      case 'light':
        return <Sun style={{ width: '1rem', height: '1rem' }} />;
      case 'dark':
        return <Moon style={{ width: '1rem', height: '1rem' }} />;
    }
  };

  const getLabel = () => {
    switch (themeMode) {
      case 'system':
        return 'System';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="nillion-button-outline"
      aria-label={`Current theme: ${getLabel()}. Click to change theme.`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        padding: '0.5rem 1rem',
      }}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </button>
  );
}