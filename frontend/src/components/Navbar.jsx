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

const HERO_ROUTES = ['/', '/about', '/login'];

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

  const token      = localStorage.getItem('hs_token');
  const isLoggedIn = token && isTokenValid(token);
  const user       = (() => {
    try { return JSON.parse(localStorage.getItem('hs_user') || 'null'); }
    catch { return null; }
  })();

  const [googleEmail,    setGoogleEmail]    = useState(() => localStorage.getItem('hs_google_email') || '');
  const [googleLinking,  setGoogleLinking]  = useState(false);
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [googleInput,    setGoogleInput]    = useState('');

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

  useEffect(() => {
    if (!isHeroPage) { setScrolled(true); return; }
    setScrolled(window.scrollY > 70);
    const onScroll = () => setScrolled(window.scrollY > 70);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHeroPage]);

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

  // ── Dashboard navbar: glass full-width bar ──────────────────
  if (isDashboard && isLoggedIn) {
    return (
      <nav
        className="glass-nav fixed top-0 left-0 right-0 z-50"
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

            <div className="relative" ref={userMenuRef}>
              {/* Avatar button — glass pill */}
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="glass-btn relative flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl overflow-hidden glass-shimmer-hover"
              >
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white text-xs font-bold">{getInitials(user?.name)}</span>
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-sm font-semibold text-white leading-none truncate max-w-[120px]">
                    {user?.name || user?.username || 'User'}
                  </p>
                  <span className={`inline-block mt-0.5 px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wider border ${roleMeta.color}`}>
                    {roleMeta.label}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown — glass-dropdown */}
              {userMenuOpen && (
                <div className="glass-dropdown glass-appear absolute right-0 top-[calc(100%+8px)] w-72 rounded-2xl overflow-hidden z-50">
                  {/* User info header */}
                  <div className="px-4 pt-4 pb-3 border-b border-white/10">
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
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Back to Home
                    </Link>
                    {user?.role === 'admin' && (
                      <button
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors"
                        onClick={() => { navigate('/dashboard?tab=admin'); setUserMenuOpen(false); }}
                      >
                        <Shield className="w-4 h-4 text-rose-400" />
                        Admin Panel
                      </button>
                    )}
                  </div>

                  {/* Google account section */}
                  <div className="px-3 py-2.5 border-t border-white/10">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Google Account</p>
                    {googleEmail ? (
                      <div className="bg-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <GoogleSVG />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-text-muted font-medium">Linked</p>
                          <p className="text-xs text-text-primary font-semibold truncate">{googleEmail}</p>
                        </div>
                        <button
                          onClick={handleGoogleUnlink}
                          disabled={googleLinking}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : showGoogleForm ? (
                      <div className="space-y-2">
                        <input
                          type="email"
                          value={googleInput}
                          onChange={e => setGoogleInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleGoogleLink()}
                          placeholder="your@gmail.com"
                          autoFocus
                          className="w-full px-3 py-2 text-xs bg-white/10 border border-white/20 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleGoogleLink}
                            disabled={googleLinking || !googleInput.trim()}
                            className="flex-1 py-1.5 glass-btn-primary text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-40"
                          >
                            {googleLinking ? 'Linking…' : 'Link Account'}
                          </button>
                          <button
                            onClick={() => { setShowGoogleForm(false); setGoogleInput(''); }}
                            className="px-2.5 py-1.5 text-text-muted text-[11px] border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowGoogleForm(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors border border-dashed border-white/15"
                      >
                        <GoogleSVG />
                        Link Google account
                      </button>
                    )}
                  </div>

                  {/* Sign out */}
                  <div className="p-1.5 border-t border-white/10">
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

  // ── Public navbar: pill (transparent) → full-width glass (scrolled) ──
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{ height: 72 }}
    >
      {/* The bar itself — pill before scroll, full-width after */}
      <div
        className={`transition-all duration-300 ease-out ${
          transparent
            ? 'glass-pill-nav absolute left-1/2 -translate-x-1/2 top-3 w-[min(860px,calc(100%-32px))] flex items-center justify-between px-5 h-[52px]'
            : 'glass-nav absolute inset-x-0 top-0 flex items-center justify-between px-4 sm:px-8 h-full'
        }`}
      >
        {/* Brand */}
        <Link to="/" className="flex items-center gap-0">
          <span className="text-2xl font-bold tracking-tight text-white">
            HimShakti
          </span>
          <span className="text-lg font-medium ml-2 text-white/80">
            Traceability
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {publicLinks.map(link => (
            <Link
              key={link.name}
              to={link.path}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive(link.path)
                  ? 'bg-white/20 text-white'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive('/dashboard')
                  ? 'bg-white/20 text-white'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="glass-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-white/80"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="glass-btn-primary glass-shimmer-hover relative inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold text-white overflow-hidden"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile toggle — always visible outside the pill/bar */}
      <div className="flex items-center md:hidden absolute right-4 top-1/2 -translate-y-1/2 space-x-2">
        <ThemeToggle />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer — glass panel */}
      {isOpen && (
        <div className="md:hidden glass-nav glass-appear absolute inset-x-0 top-[72px] pb-4">
          <div className="pt-2 space-y-1">
            {publicLinks.map(link => (
              <Link
                key={link.name}
                to={link.path}
                className={`block pl-4 pr-4 py-3 text-base font-medium rounded-xl mx-2 ${
                  isActive(link.path)
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                to="/dashboard"
                className={`block pl-4 pr-4 py-3 text-base font-medium rounded-xl mx-2 ${
                  isActive('/dashboard') ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <div className="pt-4 pb-2 border-t border-white/10 px-4">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2 glass-btn rounded-full text-base font-medium text-red-400"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="w-full flex justify-center items-center px-4 py-2 glass-btn-primary rounded-full text-base font-bold text-white"
                  onClick={() => setIsOpen(false)}
                >
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
