/**
 * SettingsPanel — Phase 2
 * Profile · Customisation (25 palettes, 16 accents, 4 fonts, 3 densities) · Security · Notifications
 */
import { useState, useEffect } from 'react';
import { useAuth }     from '../hooks/useAuth';
import { useSettings, DEFAULTS, FONT_FAMILIES } from '../context/SettingsContext';
import client          from '../api/client';
import toast           from 'react-hot-toast';
import { useQuery }    from '@tanstack/react-query';
import {
  ShieldCheck, Palette, Bell, User as UserIcon,
  RotateCcw, Eye, EyeOff, Sun, Moon, Monitor,
  Globe, CheckCircle2, Lock,
  MapPin, Clock, AlertCircle, Type, Layers,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'profile',       label: 'Profile',       sub: 'Name, contact, role',  Icon: UserIcon    },
  { id: 'customisation', label: 'Customisation',  sub: 'Theme and layout',     Icon: Palette     },
  { id: 'security',      label: 'Security',       sub: 'Password, sign-ins',   Icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications',  sub: 'Alerts and reminders', Icon: Bell        },
];

// All 25 palettes — id, label, stripes [brand, mid, light]
const PALETTES = [
  // Phase 1 (8)
  { id: 'default',     label: 'HimShakti',    stripes: ['#ea580c','#f97316','#fed7aa'] },
  { id: 'midnight',    label: 'Midnight',     stripes: ['#4338ca','#818cf8','#e0e7ff'] },
  { id: 'forest',      label: 'Forest',       stripes: ['#10b981','#34d399','#d1fae5'] },
  { id: 'warmsand',    label: 'Warm Sand',    stripes: ['#d97706','#f59e0b','#fef3c7'] },
  { id: 'copper',      label: 'Copper',       stripes: ['#c2410c','#f97316','#ffedd5'] },
  { id: 'mint',        label: 'Mint',         stripes: ['#0d9488','#14b8a6','#ccfbf1'] },
  { id: 'plum',        label: 'Plum',         stripes: ['#7e22ce','#a855f7','#f3e8ff'] },
  { id: 'nordicfrost', label: 'Nordic Frost', stripes: ['#0284c7','#38bdf8','#e0f2fe'] },
  // Phase 2 (17)
  { id: 'rose',        label: 'Rose',         stripes: ['#e11d48','#fb7185','#ffe4e6'] },
  { id: 'slate',       label: 'Slate',        stripes: ['#334155','#64748b','#e2e8f0'] },
  { id: 'ocean',       label: 'Ocean',        stripes: ['#2563eb','#3b82f6','#dbeafe'] },
  { id: 'crimson',     label: 'Crimson',      stripes: ['#dc2626','#ef4444','#fee2e2'] },
  { id: 'olive',       label: 'Olive',        stripes: ['#65a30d','#84cc16','#ecfccb'] },
  { id: 'lavender',    label: 'Lavender',     stripes: ['#7c3aed','#8b5cf6','#ede9fe'] },
  { id: 'citrus',      label: 'Citrus',       stripes: ['#f59e0b','#fbbf24','#fef3c7'] },
  { id: 'aurora',      label: 'Aurora',       stripes: ['#059669','#22c55e','#dcfce7'] },
  { id: 'dusk',        label: 'Dusk',         stripes: ['#6d28d9','#7c3aed','#ede9fe'] },
  { id: 'sakura',      label: 'Sakura',       stripes: ['#db2777','#ec4899','#fce7f3'] },
  { id: 'espresso',    label: 'Espresso',     stripes: ['#92400e','#b45309','#fdf8f4'] },
  { id: 'cobalt',      label: 'Cobalt',       stripes: ['#1d4ed8','#3b82f6','#dbeafe'] },
  { id: 'jade',        label: 'Jade',         stripes: ['#0f766e','#14b8a6','#ccfbf1'] },
  { id: 'storm',       label: 'Storm',        stripes: ['#475569','#64748b','#e2e8f0'] },
  { id: 'saffron',     label: 'Saffron',      stripes: ['#ca8a04','#eab308','#fefce8'] },
  { id: 'ember',       label: 'Ember',        stripes: ['#ea580c','#f97316','#ffedd5'] },
];

const MODES = [
  { id: 'light',  label: 'Light',  Icon: Sun     },
  { id: 'dark',   label: 'Dark',   Icon: Moon    },
  { id: 'system', label: 'System', Icon: Monitor },
];

// 16 accent swatches + auto
const ACCENTS = [
  { id: 'auto',    label: 'Auto',    color: null }, // uses palette brand
  { id: '#ea580c', label: 'Orange',  color: '#ea580c' },
  { id: '#ef4444', label: 'Red',     color: '#ef4444' },
  { id: '#ec4899', label: 'Pink',    color: '#ec4899' },
  { id: '#8b5cf6', label: 'Violet',  color: '#8b5cf6' },
  { id: '#6366f1', label: 'Indigo',  color: '#6366f1' },
  { id: '#3b82f6', label: 'Blue',    color: '#3b82f6' },
  { id: '#06b6d4', label: 'Cyan',    color: '#06b6d4' },
  { id: '#14b8a6', label: 'Teal',    color: '#14b8a6' },
  { id: '#22c55e', label: 'Green',   color: '#22c55e' },
  { id: '#84cc16', label: 'Lime',    color: '#84cc16' },
  { id: '#eab308', label: 'Yellow',  color: '#eab308' },
  { id: '#f59e0b', label: 'Amber',   color: '#f59e0b' },
  { id: '#f97316', label: 'Amber+',  color: '#f97316' },
  { id: '#db2777', label: 'Fuchsia', color: '#db2777' },
  { id: '#0d9488', label: 'Emerald', color: '#0d9488' },
  { id: '#334155', label: 'Slate',   color: '#334155' },
];

// 4 font options
const FONTS = [
  { id: 'inter',   label: 'Inter',    sample: 'Aa', stack: "'Inter', sans-serif"    },
  { id: 'dmsans',  label: 'DM Sans',  sample: 'Aa', stack: "'DM Sans', sans-serif"  },
  { id: 'outfit',  label: 'Outfit',   sample: 'Aa', stack: "'Outfit', sans-serif"   },
  { id: 'manrope', label: 'Manrope',  sample: 'Aa', stack: "'Manrope', sans-serif"  },
];

// 3 density options
const DENSITIES = [
  { id: 'compact', label: 'Compact', desc: 'More content, smaller spacing' },
  { id: 'normal',  label: 'Normal',  desc: 'Balanced density — default'    },
  { id: 'cozy',    label: 'Cozy',    desc: 'Relaxed spacing, easier to read' },
];

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────

function PasswordField({ id, label, name, value, onChange, showStrength = false, autoComplete }) {
  const [show, setShow] = useState(false);
  function strength(p) {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p))  s++;
    return s;
  }
  const str = showStrength ? strength(value) : 0;
  const strMeta = [null,
    { label: 'Weak',   color: 'bg-red-400' },
    { label: 'Fair',   color: 'bg-amber-400' },
    { label: 'Good',   color: 'bg-blue-400' },
    { label: 'Strong', color: 'bg-green-500' },
  ][str];
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-muted mb-1.5">{label}</label>
      <div className="relative">
        <input id={id} name={name} type={show ? 'text' : 'password'} value={value} onChange={onChange}
          autoComplete={autoComplete}
          className="w-full px-3.5 py-2.5 pr-10 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all" />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2 space-y-1">
          <div className="flex gap-1">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= str ? strMeta.color : 'bg-border'}`} />
            ))}
          </div>
          {strMeta && <p className="text-[11px] text-text-muted">{strMeta.label} password</p>}
        </div>
      )}
    </div>
  );
}

function PaletteCard({ palette, isActive, onClick }) {
  return (
    <button onClick={onClick} aria-label={`Select ${palette.label} palette`} aria-pressed={isActive}
      className={`group relative flex flex-col gap-2 p-2 rounded-xl border transition-all duration-200 text-left w-full ${
        isActive
          ? 'border-brand bg-brand/5 ring-2 ring-brand/25 ring-offset-1 ring-offset-surface shadow-sm'
          : 'border-border bg-surface hover:border-brand/40 hover:bg-surface-2/60'
      }`}>
      <div className="flex gap-0.5 rounded-md overflow-hidden h-5">
        {palette.stripes.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className={`text-[11px] font-medium leading-tight truncate ${isActive ? 'text-brand' : 'text-text-primary'}`}>
          {palette.label}
        </span>
        {isActive && <CheckCircle2 className="w-3 h-3 text-brand flex-shrink-0" />}
      </div>
    </button>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex items-center bg-surface-2 border border-border rounded-lg p-0.5 gap-0.5">
      {options.map(opt => {
        const active = value === opt.id;
        const Icon = opt.Icon;
        return (
          <button key={opt.id} onClick={() => onChange(opt.id)} aria-pressed={active}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              active
                ? 'bg-surface shadow-sm text-text-primary border border-border/60'
                : 'text-text-muted hover:text-text-primary'
            }`}>
            {Icon && <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand' : ''}`} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-4 rounded-full bg-brand flex-shrink-0" aria-hidden="true" />
        {Icon && <Icon className="w-4 h-4 text-text-muted" />}
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function SubSectionLabel({ children, helper }) {
  return (
    <div className="mb-2.5">
      <p className="text-xs font-semibold text-text-primary">{children}</p>
      {helper && <p className="text-[11px] text-text-muted mt-0.5">{helper}</p>}
    </div>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <div className="px-3.5 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-text-muted select-none">{value || '—'}</div>
    </div>
  );
}

function EditField({ id, label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
        className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all" />
    </div>
  );
}

function AvatarCircle({ name = '', size = 'md' }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md`}>
      {initials}
    </div>
  );
}

function LoginHistoryTable() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['login-history'],
    queryFn:  () => client('/auth/me/login-history'),
    retry: false,
  });
  if (isLoading) return (
    <div className="py-6 flex items-center justify-center gap-2 text-text-muted text-sm">
      <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      Loading…
    </div>
  );
  if (isError) return (
    <div className="py-6 flex items-center justify-center gap-2 text-status-error text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load history.
    </div>
  );
  const events = data?.data;
  if (!events?.length) return (
    <div className="py-6 text-center text-sm text-text-muted">No recent sign-ins. History appears after your first login.</div>
  );
  return (
    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
      {events.map((evt, i) => (
        <div key={evt._id ?? i} className="flex items-start gap-3 px-4 py-3 bg-surface hover:bg-surface-2/50 transition-colors">
          <div className="mt-0.5 w-7 h-7 rounded-lg bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
            {evt.method === 'google' ? <Globe className="w-3.5 h-3.5 text-blue-500" /> : <Lock className="w-3.5 h-3.5 text-text-muted" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium text-text-primary capitalize">
                {evt.method === 'google' ? 'Google sign-in' : 'Password sign-in'}
              </span>
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${evt.method === 'google' ? 'bg-blue-500/10 text-blue-500' : 'bg-surface-2 text-text-muted'}`}>
                {evt.method}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-text-muted">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.city || 'Unknown'}, {evt.countryCode || evt.country || '—'}</span>
              <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{evt.browser || '—'} on {evt.os || '—'}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(evt.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="px-4 py-2 bg-surface-2/40 text-center">
        <p className="text-[11px] text-text-muted">Sign-in activity auto-clears after 30 days.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function SettingsPanel() {
  const { getUser }               = useAuth();
  const user                      = getUser();
  const { prefs, setPref, resetPrefs } = useSettings();

  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving]           = useState(false);
  const [profileForm, setProfileForm]     = useState({ name: '', phone: '' });
  const [pwForm, setPwForm]               = useState({ current: '', newPw: '', confirm: '' });

  const { data: dbUser } = useQuery({
    queryKey: ['me'],
    queryFn:  () => client('/auth/me').then(res => res.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (dbUser) {
      setProfileForm(prev => ({
        name:  prev.name  || dbUser.name  || '',
        phone: prev.phone || dbUser.phone || '',
      }));
    }
  }, [dbUser]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await client('/auth/me', { method: 'PATCH', body: JSON.stringify(profileForm) });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally { setIsSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error("New passwords don't match"); return; }
    if (pwForm.newPw.length < 8)         { toast.error('Minimum 8 characters'); return; }
    setIsSaving(true);
    try {
      await client('/auth/me/change-password', {
        method: 'POST',
        body:   JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      toast.success('Password updated');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally { setIsSaving(false); }
  };

  const displayName = dbUser?.name || user?.name || '';
  const displayRole = dbUser?.role || user?.role || '';

  return (
    <div className="max-w-5xl mx-auto py-5 px-4 sm:px-6 lg:px-8 min-h-full">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-text-primary tracking-tight">Settings</h1>
        <p className="text-xs text-text-muted mt-0.5">Account, appearance, and security.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">

        {/* ── Left settings rail ─── */}
        <aside className="w-full lg:w-48 flex-shrink-0">
          <nav className="flex flex-col gap-0.5" aria-label="Settings navigation">
            {NAV_ITEMS.map(({ id, label, sub, Icon }) => {
              const active = activeSection === id;
              return (
                <button key={id} id={`settings-nav-${id}`} onClick={() => setActiveSection(id)}
                  className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${
                    active
                      ? 'bg-brand/8 border border-brand/20 text-brand'
                      : 'border border-transparent text-text-muted hover:bg-surface-2 hover:text-text-primary'
                  }`}>
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${active ? 'text-brand' : 'text-text-muted group-hover:text-text-primary'}`} />
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold leading-tight ${active ? 'text-brand' : 'text-text-primary'}`}>{label}</div>
                    <div className="text-[10px] text-text-muted/70 mt-0.5 leading-tight">{sub}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ─── */}
        <div className="flex-1 min-w-0">

          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-3.5 px-5 py-4 border-b border-border bg-surface-2/40">
                <AvatarCircle name={displayName} size="lg" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">{displayName || 'Your Name'}</div>
                  <div className="text-xs text-text-muted truncate">{dbUser?.email || user?.email || ''}</div>
                  <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand/10 text-brand border border-brand/20 capitalize">
                    {displayRole || 'User'}
                  </span>
                </div>
              </div>
              <form onSubmit={handleProfileSave} className="px-5 py-5">
                <SectionHeader icon={UserIcon} title="Profile information" />
                <div className="space-y-4">
                  <EditField id="profile-name" label="Full name" value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name" autoComplete="name" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReadonlyField label="Username (read-only)" value={dbUser?.username || user?.username} />
                    <EditField id="profile-phone" label="Mobile number" type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 xxxxxxxx" autoComplete="tel" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReadonlyField label="Email (read-only)"  value={dbUser?.email || user?.email} />
                    <ReadonlyField label="Role (read-only)"   value={displayRole} />
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-border flex justify-end">
                  <button type="submit" disabled={isSaving}
                    className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-60 transition-all active:scale-95">
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CUSTOMISATION */}
          {activeSection === 'customisation' && (
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-5">
                <SectionHeader
                  icon={Palette}
                  title="Appearance"
                  action={
                    <button onClick={resetPrefs}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary bg-surface-2 hover:bg-border rounded-lg transition-colors border border-border">
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  }
                />

                <div className="space-y-6">

                  {/* Mode */}
                  <div>
                    <SubSectionLabel helper="Auto follows your computer's light/dark setting.">Mode</SubSectionLabel>
                    <Segmented options={MODES} value={prefs.mode} onChange={v => setPref('mode', v)} />
                  </div>

                  <div className="border-t border-border" />

                  {/* Palette — 25 cards in a 4-col grid */}
                  <div>
                    <SubSectionLabel helper="25 palettes — each tuned for light and dark.">Theme</SubSectionLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-2">
                      {PALETTES.map(p => (
                        <PaletteCard key={p.id} palette={p} isActive={prefs.palette === p.id} onClick={() => setPref('palette', p.id)} />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Accent */}
                  <div>
                    <SubSectionLabel helper="Buttons, links, and highlights. Auto follows the active theme.">Accent</SubSectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {ACCENTS.map(a => {
                        const active = prefs.accent === a.id;
                        return (
                          <button key={a.id} onClick={() => setPref('accent', a.id)}
                            title={a.label} aria-label={`Accent: ${a.label}`} aria-pressed={active}
                            className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-150 border-2 ${
                              active ? 'border-brand scale-110 shadow-md' : 'border-transparent hover:scale-105 hover:border-border'
                            }`}
                            style={a.color ? { backgroundColor: a.color } : { background: 'conic-gradient(#ea580c, #8b5cf6, #3b82f6, #22c55e, #ea580c)' }}>
                            {active && <CheckCircle2 className="w-3 h-3 text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Font */}
                  <div>
                    <SubSectionLabel helper="Typeface used across the whole interface.">Font</SubSectionLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FONTS.map(f => {
                        const active = prefs.font === f.id;
                        return (
                          <button key={f.id} onClick={() => setPref('font', f.id)} aria-pressed={active}
                            className={`flex flex-col items-start gap-1.5 px-3 py-2.5 rounded-lg border transition-all ${
                              active
                                ? 'border-brand bg-brand/5 ring-1 ring-brand/25 ring-offset-1 ring-offset-surface'
                                : 'border-border bg-surface hover:border-brand/40 hover:bg-surface-2/60'
                            }`}>
                            <span className="text-xl font-semibold text-text-primary" style={{ fontFamily: f.stack }}>{f.sample}</span>
                            <span className={`text-[11px] font-medium ${active ? 'text-brand' : 'text-text-muted'}`}>{f.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Density */}
                  <div>
                    <SubSectionLabel helper="Controls spacing and padding across the interface.">Density</SubSectionLabel>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {DENSITIES.map(d => {
                        const active = prefs.density === d.id;
                        return (
                          <button key={d.id} onClick={() => setPref('density', d.id)} aria-pressed={active}
                            className={`flex-1 flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                              active
                                ? 'border-brand bg-brand/5 ring-1 ring-brand/25 ring-offset-1 ring-offset-surface'
                                : 'border-border bg-surface hover:border-brand/40 hover:bg-surface-2/60'
                            }`}>
                            <span className={`text-xs font-semibold ${active ? 'text-brand' : 'text-text-primary'}`}>{d.label}</span>
                            <span className="text-[11px] text-text-muted">{d.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="mt-5 pt-4 border-t border-border flex items-center gap-1.5 text-[11px] text-text-muted">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                  Preferences saved to your account — applies on every device you sign into.
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-5">
                  <SectionHeader icon={Lock} title="Change password" />
                  <p className="text-xs text-text-muted mb-4 -mt-2">Minimum 8 characters.</p>
                  <form onSubmit={handlePasswordSave} className="space-y-4 max-w-xl">
                    <PasswordField id="sec-current" label="Current password" name="currentPassword"
                      value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                      autoComplete="current-password" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <PasswordField id="sec-new" label="New password" name="newPassword"
                        value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                        autoComplete="new-password" showStrength />
                      <PasswordField id="sec-confirm" label="Confirm new password" name="confirmPassword"
                        value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        autoComplete="new-password" />
                    </div>
                    <div className="pt-1">
                      <button type="submit" disabled={isSaving || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
                        className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-all active:scale-95">
                        {isSaving ? 'Updating…' : 'Update password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-5">
                  <SectionHeader icon={ShieldCheck} title="Recent sign-ins" />
                  <LoginHistoryTable />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-5">
                <SectionHeader icon={Bell} title="Notification events" />
                <p className="text-xs text-text-muted -mt-2 mb-4">
                  Role-targeted push notifications — delivered in real-time via Socket.io and stored for 7 days.
                </p>

                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {[
                    {
                      label:    'Batch created',
                      desc:     'Triggered when a new batch is registered in the system.',
                      roles:    ['factory-manager', 'manager'],
                      active:   true,
                    },
                    {
                      label:    'Batch dispatched',
                      desc:     'Triggered when a batch status is updated to DISPATCHED.',
                      roles:    ['manager', 'factory-manager'],
                      active:   true,
                    },
                    {
                      label:    'Quality inspection',
                      desc:     'Triggered when an inspection record is submitted.',
                      roles:    ['manager', 'admin'],
                      active:   true,
                    },
                    {
                      label:    'Admin: member approved',
                      desc:     'Triggered when an admin approves a new access request.',
                      roles:    ['super-admin'],
                      active:   true,
                    },
                    {
                      label:    'Admin: role changed',
                      desc:     'Triggered when an admin changes a user\'s role.',
                      roles:    ['super-admin'],
                      active:   true,
                    },
                    {
                      label:    'Admin: user removed',
                      desc:     'Triggered when an admin soft-deletes a user account.',
                      roles:    ['super-admin'],
                      active:   true,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 bg-surface hover:bg-surface-2/40 transition-colors">
                      <div className={`flex-shrink-0 mt-0.5 w-2 h-2 rounded-full ${item.active ? 'bg-green-500' : 'bg-border'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">{item.label}</p>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.active
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-surface-2 text-text-muted border border-border'
                          }`}>
                            {item.active ? '● Active' : '○ Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                        {item.note && <p className="text-[11px] text-amber-500/80 mt-0.5">{item.note}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {item.roles.map(r => (
                            <span key={r} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand/8 text-brand border border-brand/15 capitalize">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[11px] text-text-muted leading-relaxed">
                  Notifications are delivered in real-time via Socket.io room targeting and persisted to MongoDB with a 7-day TTL. Bell icon in the header shows live unread count.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
