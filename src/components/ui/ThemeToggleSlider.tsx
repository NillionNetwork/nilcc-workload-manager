'use client';

import { Sun, Moon } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export function ThemeToggleSlider() {
  const { theme, toggleTheme } = useSettings();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.75rem',
        height: '1.5rem',
        padding: '0.125rem',
        backgroundColor: isDark ? 'var(--nillion-primary)' : 'var(--nillion-grey)',
        border: 'none',
        borderRadius: '9999px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        outline: 'none'
      }}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span
        style={{
          position: 'absolute',
          left: isDark ? 'calc(100% - 1.25rem - 0.125rem)' : '0.125rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.25rem',
          height: '1.25rem',
          backgroundColor: 'white',
          borderRadius: '50%',
          boxShadow: 'var(--nillion-shadow)',
          transition: 'all 200ms ease',
          pointerEvents: 'none'
        }}
      >
        {isDark ? (
          <Moon style={{ width: '0.75rem', height: '0.75rem', color: 'var(--nillion-primary)' }} />
        ) : (
          <Sun style={{ width: '0.75rem', height: '0.75rem', color: 'var(--nillion-grey-dark)' }} />
        )}
      </span>
    </button>
  );
}