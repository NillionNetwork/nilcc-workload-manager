import { HTMLAttributes } from 'react';
import { components, cn } from '@/styles/design-system';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn(components.card, className)} {...props}>
      {children}
    </div>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn(components.cardPadding, className)} {...props}>
      {children}
    </div>
  );
}