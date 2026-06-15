import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-orange-600 tracking-tight">
              HimShakti<span className="text-gray-800 text-lg font-medium ml-2">Traceability</span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            <Link to="/" className="border-transparent text-gray-500 hover:border-orange-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
              Home
            </Link>
            <Link to="/about" className="border-transparent text-gray-500 hover:border-orange-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
              About
            </Link>
            <Link to="/dashboard" className="border-transparent text-gray-500 hover:border-orange-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
              Dashboard
            </Link>
            <Link to="/login" className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
