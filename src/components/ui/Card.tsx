import { HTMLAttributes } from 'react';
import { components, cn } from '@/styles/design-system';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn(components.card, className)} {...props}>
      {children}
    </div>
  );
}

type CardContentProps = HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn(components.cardPadding, className)} {...props}>
      {children}
    </div>
  );
}