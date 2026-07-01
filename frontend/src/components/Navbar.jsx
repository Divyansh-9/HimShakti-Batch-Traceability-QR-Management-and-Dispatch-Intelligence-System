import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Menu, X, LayoutDashboard, LogIn, LogOut, ChevronDown, User, Settings, Shield, Link2, LinkIcon, Unlink } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import toast from 'react-hot-toast';

// Official Google multi-color SVG logo (brand-compliant)
const GoogleSVG = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
  </svg>
);

// Pages where the navbar starts transparent and transitions on scroll
const HERO_ROUTES = ['/', '/about', '/login'];

// Role display config
const ROLE_META = {
  admin:                  { label: 'Administrator', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  manager:                { label: 'Manager',       color: 'bg-brand/15 text-brand border-brand/30' },
  'factory-manager':      { label: 'Factory Mgr',  color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  'quality-inspector':    { label: 'QA Inspector', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  'dispatch-coordinator': { label: 'Dispatch',     color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
};

function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch { return false; }
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Navbar() {
  const [isOpen,       setIsOpen]       = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const userMenuRef = useRef(null);

  const isHeroPage  = HERO_ROUTES.includes(location.pathname);
  const transparent = isHeroPage && !scrolled;
  const isDashboard = location.pathname === '/dashboard';

  // Auth — uses hs_token + hs_user (matching useAuth.js)
  const token      = localStorage.getItem('hs_token');
  const isLoggedIn = token && isTokenValid(token);
  const user       = (() => {
    try { return JSON.parse(localStorage.getItem('hs_user') || 'null'); }
    catch { return null; }
  })();

  // Google link state — persisted in localStorage so it survives nav
  const [googleEmail,    setGoogleEmail]    = useState(() => localStorage.getItem('hs_google_email') || '');
  const [googleLinking,  setGoogleLinking]  = useState(false); // loading state
  const [showGoogleForm, setShowGoogleForm] = useState(false); // inline form visible
  const [googleInput,    setGoogleInput]    = useState('');    // controlled input value

  async function handleGoogleLink() {
    if (!googleInput.trim()) return;
    setGoogleLinking(true);
    try {
      const data = await client('/auth/me/google-link', {
        method: 'PATCH',
        body:   JSON.stringify({ googleEmail: googleInput.trim() }),
      });
      localStorage.setItem('hs_google_email', data.googleEmail);
      setGoogleEmail(data.googleEmail);
      setShowGoogleForm(false);
      setGoogleInput('');
      toast.success('Google account linked successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to link Google account');
    } finally {
      setGoogleLinking(false);
    }
  }

  async function handleGoogleUnlink() {
    setGoogleLinking(true);
    try {
      await client('/auth/me/google-link', {
        method: 'PATCH',
        body:   JSON.stringify({ googleEmail: null }),
      });
      localStorage.removeItem('hs_google_email');
      setGoogleEmail('');
      toast.success('Google account unlinked.');
    } catch (err) {
      toast.error(err.message || 'Failed to unlink');
    } finally {
      setGoogleLinking(false);
    }
  }

  const isActive = (path) => location.pathname === path;
  const roleMeta = ROLE_META[user?.role] || ROLE_META['manager'];

  // Scroll listener
  useEffect(() => {
    if (!isHeroPage) { setScrolled(true); return; }
    setScrolled(window.scrollY > 70);
    const onScroll = () => setScrolled(window.scrollY > 70);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHeroPage]);

  // Close user menu on outside click
  useEffect(() => {
    function onClickOut(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, []);

  function handleLogout() {
    localStorage.removeItem('hs_token');
    localStorage.removeItem('hs_user');
    navigate('/login');
    setIsOpen(false);
    setUserMenuOpen(false);
  }

  const publicLinks = [
    { name: 'Home',  path: '/' },
    { name: 'About', path: '/about' },
  ];

  // ── Style tokens ────────────────────────────────────────────
  const navBg = transparent
    ? 'bg-transparent border-transparent'
    : 'bg-surface/95 backdrop-blur-md border-b border-border shadow-sm';
  const logoTxt  = transparent ? 'text-white' : 'text-brand';
  const logoSub  = transparent ? 'text-white/80' : 'text-text-primary';
  const linkBase = transparent
    ? 'border-transparent text-white/80 hover:text-white hover:border-white/40'
    : 'border-transparent text-text-muted hover:border-border hover:text-text-primary';
  const linkActive = transparent ? 'border-white text-white' : 'border-brand text-brand';

  // ── Dashboard-specific: slim app bar with user context ──────
  if (isDashboard && isLoggedIn) {
    return (
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border shadow-sm"
        style={{ height: 72 }}
      >
        <div className="flex items-center justify-between h-full px-4 sm:px-6">

          {/* Left: Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-white text-xs font-black">HS</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-text-primary leading-none">HimShakti</p>
              <p className="text-[10px] text-text-muted leading-none mt-0.5">Traceability Platform</p>
            </div>
          </Link>

          {/* Centre: Page crumb */}
          <div className="hidden md:flex items-center gap-2 text-sm text-text-muted">
            <LayoutDashboard className="w-3.5 h-3.5 text-brand" />
            <span className="text-text-primary font-medium">Dashboard</span>
            <span className="text-text-muted/40 text-xs">/ Operations</span>
          </div>

          {/* Right: Theme + User dropdown */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* User avatar + dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-2 transition-colors border border-transparent hover:border-border group"
              >
                {/* Avatar circle */}
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white text-xs font-bold">{getInitials(user?.name)}</span>
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-sm font-semibold text-text-primary leading-none truncate max-w-[120px]">
                    {user?.name || user?.username || 'User'}
                  </p>
                  <span className={`inline-block mt-0.5 px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wider border ${roleMeta.color}`}>
                    {roleMeta.label}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-72 bg-surface border border-border rounded-2xl shadow-2xl shadow-black/20 overflow-hidden z-50 animate-[fadeSlideIn_0.15s_ease]">
                  {/* User info header */}
                  <div className="px-4 pt-4 pb-3 border-b border-border bg-surface-2/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-white text-sm font-bold">{getInitials(user?.name)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text-primary text-sm truncate">{user?.name || 'User'}</p>
                        <p className="text-text-muted text-xs truncate">@{user?.username || ''}</p>
                        <span className={`inline-block mt-1 px-2 py-px rounded-full text-[9px] font-bold uppercase tracking-wider border ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5">
                    <Link
                      to="/"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Back to Home
                    </Link>
                    {user?.role === 'admin' && (
                      <button
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors"
                        onClick={() => { navigate('/dashboard?tab=admin'); setUserMenuOpen(false); }}
                      >
                        <Shield className="w-4 h-4 text-rose-400" />
                        Admin Panel
                      </button>
                    )}
                  </div>

                  {/* ── Link Google Account section ── */}
                  <div className="px-3 py-2.5 border-t border-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Google Account</p>

                    {googleEmail ? (
                      // Already linked — show email + unlink option
                      <div className="bg-surface-2 rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <GoogleSVG />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-text-muted font-medium">Linked</p>
                          <p className="text-xs text-text-primary font-semibold truncate">{googleEmail}</p>
                        </div>
                        <button
                          onClick={handleGoogleUnlink}
                          disabled={googleLinking}
                          title="Unlink Google account"
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : showGoogleForm ? (
                      // Inline input — no window.prompt
                      <div className="space-y-2">
                        <input
                          type="email"
                          value={googleInput}
                          onChange={e => setGoogleInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleGoogleLink()}
                          placeholder="your@gmail.com"
                          autoFocus
                          className="w-full px-3 py-2 text-xs bg-surface-2 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleGoogleLink}
                            disabled={googleLinking || !googleInput.trim()}
                            className="flex-1 py-1.5 bg-brand hover:bg-brand-hover text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-40"
                          >
                            {googleLinking ? 'Linking…' : 'Link Account'}
                          </button>
                          <button
                            onClick={() => { setShowGoogleForm(false); setGoogleInput(''); }}
                            className="px-2.5 py-1.5 text-text-muted text-[11px] border border-border rounded-lg hover:bg-surface-2 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Unlinked state — invite to link
                      <button
                        onClick={() => setShowGoogleForm(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors border border-dashed border-border"
                      >
                        <GoogleSVG />
                        Link Google account
                      </button>
                    )}
                  </div>

                  {/* Sign out */}
                  <div className="p-1.5 border-t border-border">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // ── Default Navbar (Home / About / Login public pages) ──────
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
