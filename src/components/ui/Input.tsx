import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { components, cn } from '@/styles/design-system';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        className={cn(
          components.input.base,
          error && components.input.error,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          components.input.base,
          error && components.input.error,
          'min-h-[100px] resize-y',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);