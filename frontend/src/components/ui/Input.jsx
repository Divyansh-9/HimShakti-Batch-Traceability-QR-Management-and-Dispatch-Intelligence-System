import { forwardRef } from 'react';

/**
 * @prop {string} id - Required for label association
 * @prop {string} label - Input label
 * @prop {string} [type] - "text", "email", "password", etc.
 */
const Input = forwardRef(({ id, label, type = 'text', className = '', error, ...props }, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        ref={ref}
        className={`appearance-none block w-full px-3 py-2 border ${error ? 'border-error' : 'border-border'} rounded-md shadow-sm placeholder-text-muted text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm transition-colors`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
