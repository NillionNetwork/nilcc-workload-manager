'use client';

import { Sun, Moon } from 'lucide-react';
import { Button } from './Button';
import { useSettings } from '@/contexts/SettingsContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useSettings();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`${theme === 'light' ? 'Dark' : 'Light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}