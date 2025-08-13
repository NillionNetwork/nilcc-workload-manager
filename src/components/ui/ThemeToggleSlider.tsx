'use client';

import { Sun, Moon } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export function ThemeToggleSlider() {
  const { theme, toggleTheme } = useSettings();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleTheme}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${isDark ? 'bg-muted' : 'bg-gray-700'}
        `}
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <span
          className={`
            pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${isDark ? 'translate-x-5' : 'translate-x-0'}
          `}
        >
          <span
            className={`
              absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in-out
              ${isDark ? 'opacity-0' : 'opacity-100'}
            `}
            aria-hidden="true"
          >
            <Sun className="h-3 w-3 text-gray-600" />
          </span>
          <span
            className={`
              absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in-out
              ${isDark ? 'opacity-100' : 'opacity-0'}
            `}
            aria-hidden="true"
          >
            <Moon className="h-3 w-3 text-gray-600" />
          </span>
        </span>
      </button>
    </div>
  );
}