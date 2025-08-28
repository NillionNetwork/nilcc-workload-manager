import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Badge({ className, variant: _variant = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={`nillion-badge ${className || ''}`}
      {...props}
    >
      {children}
    </span>
  );
}