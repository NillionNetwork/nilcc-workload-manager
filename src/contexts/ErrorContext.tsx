'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ErrorInfo {
  id: string;
  message: string;
  status?: number;
  timestamp: number;
}

interface ErrorContextType {
  errors: ErrorInfo[];
  addError: (message: string, status?: number) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const addError = useCallback((message: string, status?: number) => {
    const newError: ErrorInfo = {
      id: Date.now().toString(),
      message,
      status,
      timestamp: Date.now(),
    };
    setErrors((prev) => [...prev, newError]);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};