import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

/**
 * @prop {string} variant - "primary" | "secondary" | "ghost" | "destructive"
 * @prop {string} size - "sm" | "md" | "lg"
 * @prop {boolean} isLoading - Shows spinner, disables click
 * @prop {boolean} disabled - Opacity 50%, no-cursor
 * @prop {ReactNode} leftIcon / rightIcon
 */
const Button = forwardRef(({ 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  disabled = false, 
  leftIcon, 
  rightIcon, 
  children, 
  className = '',
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-hover border border-transparent',
    secondary: 'bg-surface border border-border text-text-primary hover:bg-surface-2',
    ghost: 'bg-transparent text-text-muted hover:bg-surface-2 hover:text-text-primary border border-transparent',
    destructive: 'bg-error text-white hover:bg-error/90 border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      ref={ref}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin mr-2 w-4 h-4" aria-hidden="true" />}
      {!isLoading && leftIcon && <span className="mr-2" aria-hidden="true">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2" aria-hidden="true">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
