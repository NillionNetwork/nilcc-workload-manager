import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, type = 'submit', ...props }, ref) => {
    const variantClasses = {
      primary: '',
      secondary: 'nillion-button-secondary',
      danger: '',
      ghost: 'nillion-button-ghost',
      outline: 'nillion-button-outline',
    };

    const sizeClasses = {
      sm: 'nillion-small',
      md: '',
      lg: 'nillion-large',
    };

    return (
      <button
        className={[
          variantClasses[variant],
          sizeClasses[size],
          className
        ].filter(Boolean).join(' ')}
        disabled={disabled || loading}
        ref={ref}
        type={variant === 'secondary' ? 'button' : type}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';