import { HTMLAttributes } from 'react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Alert({ className, variant: _variant = 'info', children, ...props }: AlertProps) {
  return (
    <div
      className={`nillion-card ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}