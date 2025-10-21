import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    iconStart,
    iconEnd,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'bg-[--color-primary] text-white hover:bg-[--color-primary-600] focus:ring-[--color-primary]',
      secondary: 'bg-[--color-secondary] text-white hover:bg-[#0c8dc9] focus:ring-[--color-secondary]',
      ghost: 'bg-transparent text-[--color-text] hover:bg-[--color-surface] focus:ring-gray-400',
      danger: 'bg-[--color-danger] text-white hover:bg-[#b91c1c] focus:ring-[--color-danger]',
    };
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3',
    };
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : iconStart ? (
          iconStart
        ) : null}
        {children}
        {!loading && iconEnd && iconEnd}
      </button>
    );
  }
);

Button.displayName = 'Button';
