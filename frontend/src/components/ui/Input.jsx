import React from 'react';

/**
 * Input Component
 * 
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.placeholder]
 * @param {string} [props.type="text"]
 * @param {string|number} [props.value]
 * @param {Function} [props.onChange]
 * @param {string} [props.error]
 * @param {string} [props.className]
 */
const Input = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  className = '',
  ...props
}) => {
  const baseInputStyles = 'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:focus:ring-offset-gray-900';
  const normalStyles = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:focus:border-blue-400 dark:focus:ring-blue-400';
  const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-400';

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`${baseInputStyles} ${error ? errorStyles : normalStyles}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
