'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useError } from '../contexts/ErrorContext';

export const ErrorBanner: React.FC = () => {
  const { errors, removeError } = useError();
  const pathname = usePathname();
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // Auto-dismiss errors after 10 seconds
  useEffect(() => {
    errors.forEach((error) => {
      const timer = setTimeout(() => {
        removeError(error.id);
      }, 10000);

      return () => clearTimeout(timer);
    });
  }, [errors, removeError]);

  // Monitor scroll position to determine if navbar is visible
  useEffect(() => {
    const handleScroll = () => {
      // Navbar height is 4rem (64px)
      setIsNavbarVisible(window.scrollY < 64);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't show error banner on /workloads page
  if (pathname === '/workloads') {
    return null;
  }

  if (errors.length === 0) return null;

  return (
    <div
      className="fixed left-0 right-0 z-50"
      style={{
        top: isNavbarVisible ? '64px' : '0',
        transition: 'top 0.3s ease',
      }}
    >
      {errors
        .filter((error) => error.status !== 404)
        .map((error) => (
          <div
            key={error.id}
            className="bg-red-600 text-white px-4 py-3 shadow-lg animate-slide-down"
          >
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex-1">
                <p className="font-medium">
                  Error {error.status && `[${error.status}]`}
                </p>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
              <button
                onClick={() => removeError(error.id)}
                className="ml-4 p-1 rounded hover:bg-red-700 transition-colors"
                aria-label="Dismiss error"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
    </div>
  );
};
