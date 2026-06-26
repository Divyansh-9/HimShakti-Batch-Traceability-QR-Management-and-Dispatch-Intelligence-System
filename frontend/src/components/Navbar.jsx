import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Menu, X, LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

// Pages where the navbar starts transparent and transitions to solid on scroll
const HERO_ROUTES = ['/', '/about', '/login'];

function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch { return false; }
}

export default function Navbar() {
  const [isOpen,   setIsOpen]   = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();

  const isHeroPage  = HERO_ROUTES.includes(location.pathname);
  const transparent = isHeroPage && !scrolled;

  const token      = localStorage.getItem('token');
  const isLoggedIn = token && isTokenValid(token);
  const isActive   = (path) => location.pathname === path;

  useEffect(() => {
    if (!isHeroPage) { setScrolled(true); return; }
    setScrolled(window.scrollY > 70);
    const onScroll = () => setScrolled(window.scrollY > 70);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHeroPage]);

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
    setIsOpen(false);
  }

  const publicLinks = [
    { name: 'Home',  path: '/' },
    { name: 'About', path: '/about' },
  ];

  // ── Style tokens based on transparent / solid state ────────
  const navBg   = transparent
    ? 'bg-transparent border-transparent'
    : 'bg-surface/95 backdrop-blur-md border-b border-border shadow-sm';
  const logoTxt = transparent ? 'text-white' : 'text-brand';
  const logoSub = transparent ? 'text-white/80' : 'text-text-primary';
  const linkBase = transparent
    ? 'border-transparent text-white/80 hover:text-white hover:border-white/40'
    : 'border-transparent text-text-muted hover:border-border hover:text-text-primary';
  const linkActive = transparent ? 'border-white text-white' : 'border-brand text-brand';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
      style={{ height: 72 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-0">
            <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${logoTxt}`}>
              HimShakti
            </span>
            <span className={`text-lg font-medium ml-2 transition-colors duration-300 ${logoSub}`}>
              Traceability
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {publicLinks.map(link => (
              <Link
                key={link.name}
                to={link.path}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 h-[72px] ${
                  isActive(link.path) ? linkActive : linkBase
                }`}
              >
                {link.name}
              </Link>
            ))}

            {isLoggedIn && (
              <Link
                to="/dashboard"
                className={`inline-flex items-center gap-1.5 px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 h-[72px] ${
                  isActive('/dashboard') ? linkActive : linkBase
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            )}

            <div className="flex items-center ml-4 space-x-3 pl-4 border-l border-white/20">
              <ThemeToggle />
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className={`inline-flex items-center gap-1.5 justify-center font-medium rounded-lg transition-all duration-300 px-4 py-2 text-sm border ${
                    transparent
                      ? 'text-white/80 border-white/30 hover:bg-white/10 hover:text-white'
                      : 'text-text-muted border-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className={`inline-flex items-center gap-1.5 justify-center font-semibold rounded-lg transition-all duration-300 px-4 py-2 text-sm ${
                    transparent
                      ? 'bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/30'
                      : 'bg-brand text-white hover:bg-brand-hover'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center md:hidden space-x-3">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-md transition-colors ${transparent ? 'text-white hover:bg-white/10' : 'text-text-muted hover:bg-surface-2'}`}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-md border-b border-border shadow-lg">
          <div className="pt-2 pb-4 space-y-1">
            {publicLinks.map(link => (
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
            {isLoggedIn && (
              <Link to="/dashboard"
                className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium ${
                  isActive('/dashboard') ? 'bg-brand/10 border-brand text-brand' : 'border-transparent text-text-muted hover:bg-surface-2 hover:text-text-primary'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <div className="pt-4 pb-2 border-t border-border px-4">
              {isLoggedIn ? (
                <button onClick={handleLogout}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2 border border-border rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <Link to="/login"
                  className="w-full flex justify-center items-center px-4 py-2 rounded-lg text-base font-medium text-white bg-brand hover:bg-brand-hover"
                  onClick={() => setIsOpen(false)}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
