import React from 'react';

/**
 * Loader Component
 * 
 * @param {Object} props
 * @param {"sm" | "md" | "lg"} [props.size="md"]
 * @param {boolean} [props.fullPage=false]
 * @param {boolean} [props.skeleton=false]
 */
const Loader = ({ size = 'md', fullPage = false, skeleton = false }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  if (skeleton) {
    return (
      <div className="w-full animate-pulse space-y-4">
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  const spinner = (
    <svg 
      className={`animate-spin text-blue-600 dark:text-blue-500 ${sizes[size]}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  if (fullPage) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white/80 dark:bg-gray-900/80 absolute inset-0 z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      {spinner}
    </div>
  );
};

export default Loader;
