import React from 'react';

/**
 * Button Component
 * 
 * @param {Object} props
 * @param {"primary" | "secondary" | "outline" | "danger"} [props.variant="primary"]
 * @param {"sm" | "md" | "lg"} [props.size="md"]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false]
 * @param {Function} [props.onClick]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900 focus-visible:ring-gray-500 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 dark:bg-red-500 dark:hover:bg-red-600',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  return (
    <button
      type="button"
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
