import toast from 'react-hot-toast';

/**
 * Toast helper wrapper over react-hot-toast
 * 
 * Usage:
 * Toast.success('Batch dispatched!')
 * Toast.error('Failed to generate QR')
 */
const Toast = {
  success: (message, duration = 3000) => {
    toast.success(message, {
      duration,
      className: 'dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 shadow-md',
      iconTheme: {
        primary: '#10B981', // emerald-500
        secondary: '#fff',
      },
    });
  },
  
  error: (message, duration = 4000) => {
    toast.error(message, {
      duration,
      className: 'dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 shadow-md',
      iconTheme: {
        primary: '#EF4444', // red-500
        secondary: '#fff',
      },
    });
  },
  
  warning: (message, duration = 3500) => {
    toast(message, {
      duration,
      icon: '⚠️',
      className: 'dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 shadow-md',
    });
  },
  
  info: (message, duration = 3000) => {
    toast(message, {
      duration,
      icon: 'ℹ️',
      className: 'dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 shadow-md',
    });
  }
};

export default Toast;
