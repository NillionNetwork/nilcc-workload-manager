import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ className: _className, error: _error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ className: _className, error: _error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';