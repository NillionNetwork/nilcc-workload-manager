import { HTMLAttributes } from 'react';
import { components, cn } from '@/styles/design-system';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        components.badge.base,
        components.badge.variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}