import { HTMLAttributes } from 'react';
import { components, cn } from '@/styles/design-system';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info';
}

export function Alert({ className, variant = 'info', children, ...props }: AlertProps) {
  return (
    <div
      className={cn(
        components.alert.base,
        components.alert.variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}