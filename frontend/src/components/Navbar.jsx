import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-orange-600 dark:text-orange-500 tracking-tight">
              HimShakti<span className="text-gray-800 dark:text-gray-200 text-lg font-medium ml-2">Traceability</span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            <Link to="/" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-gray-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
              Home
            </Link>
            <Link to="/about" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-gray-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
              About
            </Link>
            <Link to="/dashboard" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-gray-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
              Dashboard
            </Link>
            <div className="flex items-center ml-4 space-x-4">
              <button 
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <Link to="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
