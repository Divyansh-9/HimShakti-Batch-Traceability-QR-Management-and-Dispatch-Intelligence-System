import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[72px] md:h-[72px] h-[60px] items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-brand tracking-tight">
              HimShakti<span className="text-text-primary text-lg font-medium ml-2">Traceability</span>
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {links.map((link) => (
              <Link 
                key={link.name}
                to={link.path} 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors h-[72px] ${
                  isActive(link.path) 
                    ? 'border-brand text-brand' 
                    : 'border-transparent text-text-muted hover:border-border hover:text-text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center ml-4 space-x-4 pl-4 border-l border-border">
              <ThemeToggle />
              <Link to="/login" className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand px-4 py-2 text-sm bg-brand text-white hover:bg-brand-hover">
                Login
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-4">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-muted hover:bg-surface-2 p-2 rounded-md transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-surface shadow-lg">
          <div className="pt-2 pb-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'border-transparent text-text-muted hover:bg-surface-2 hover:text-text-primary'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 pb-2 border-t border-border px-4">
              <Link to="/login" className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand hover:bg-brand-hover" onClick={() => setIsOpen(false)}>
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
