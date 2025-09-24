'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './Button';
import { useSettings } from '@/contexts/SettingsContext';

export function ThemeToggle() {
  const { themeMode, cycleTheme } = useSettings();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      aria-label={`Current theme: ${themeMode}. Click to change theme.`}
      title={`Theme: ${themeMode}`}
    >
      {themeMode === 'system' ? (
        <Monitor className="h-4 w-4" />
      ) : themeMode === 'light' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}