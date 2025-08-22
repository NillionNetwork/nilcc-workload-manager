import { HTMLAttributes } from 'react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info';
}

export function Alert({ className, variant = 'info', children, ...props }: AlertProps) {
  return (
    <div
      className={`nillion-card ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}