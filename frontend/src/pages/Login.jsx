import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Leaf, ArrowLeft } from 'lucide-react';

// ── Glass Input ───────────────────────────────────────────────
function GlassInput({ id, label, type = 'text', value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-white/80 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all pr-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Role Selector ────────────────────────────────────────────
const ROLES = [
  {
    value: 'factory-manager',
    label: 'Factory Manager',
    icon: '🏭',
    desc: 'Create batches, run dispatch, manage inventory',
  },
  {
    value: 'quality-inspector',
    label: 'Quality Inspector',
    icon: '🔍',
    desc: 'Monitor quality flags, audit compliance records',
  },
  {
    value: 'dispatch-coordinator',
    label: 'Dispatch Coordinator',
    icon: '🚚',
    desc: 'Manage FEFO queues and outbound shipments',
  },
  {
    value: 'admin',
    label: 'Administrator',
    icon: '⚙️',
    desc: 'Full system access, user and role management',
  },
];

function RoleSelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-2">Your Role</label>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map(r => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200 ${
              value === r.value
                ? 'bg-white/20 border-white/50 shadow-md'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25'
            }`}
          >
            {value === r.value && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-brand rounded-full flex items-center justify-center text-[9px] text-white font-bold">✓</span>
            )}
            <span className="text-lg leading-none">{r.icon}</span>
            <span className="text-white text-xs font-semibold leading-tight">{r.label}</span>
            <span className="text-white/40 text-[10px] leading-tight">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Request Access Form ───────────────────────────────────────
function RequestAccessForm() {
  const [form, setForm]         = useState({ name: '', email: '', role: 'factory-manager' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    toast.success('Request submitted!');
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Request Received</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          The admin team will review your request and send credentials to{' '}
          <strong className="text-white/80">{form.email}</strong> within 1–2 business days.
        </p>
        <button onClick={() => setSubmitted(false)} className="mt-5 text-sm text-white/60 hover:text-white underline">
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <GlassInput id="req-name" label="Full Name" value={form.name} onChange={e => onChange({ target: { name: 'name', value: e.target.value } })} placeholder="e.g. Ramesh Kumar" required />
      <GlassInput id="req-email" label="Work Email" type="email" value={form.email} onChange={e => onChange({ target: { name: 'email', value: e.target.value } })} placeholder="you@himshakti.com" required />
      <RoleSelector value={form.role} onChange={role => setForm(p => ({ ...p, role }))} />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {loading ? 'Submitting…' : 'Submit Access Request'}
      </button>
      <p className="text-xs text-white/40 text-center">Credentials will be sent to your email within 1–2 business days.</p>
    </form>
  );
}

// ── Main Login Page ───────────────────────────────────────────
export default function Login() {
  const [tab,      setTab]      = useState('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(error || 'Invalid credentials. Contact your administrator.');
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">

      {/* ── Full-bleed background ── */}
      <div className="absolute inset-0">
        <img
          src="/login-panel.png"
          alt="HimShakti artisan products"
          className="w-full h-full object-cover object-center"
        />
        {/* Multi-layer overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/40" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* ── Glassmorphism card ── */}
      <div className="relative w-full max-w-md mx-4 z-10">
        <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden">

          {/* Card header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/10">
            <Link
              to="/"
              title="Back to Home"
              className="flex items-center gap-3 mb-6 group w-fit"
            >
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm group-hover:underline underline-offset-2 transition-all">HimShakti</p>
                <p className="text-white/50 text-xs">Traceability Platform</p>
              </div>
            </Link>

            <h1 className="text-2xl font-extrabold text-white">
              {tab === 'signin' ? 'Welcome back' : 'Request Access'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {tab === 'signin'
                ? 'Sign in to your secure operations dashboard.'
                : 'New to the system? Request credentials from the admin team.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="px-8 pt-5">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
              {[
                { id: 'signin',  label: 'Sign In' },
                { id: 'request', label: 'Request Access' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    tab === t.id
                      ? 'bg-white/15 text-white shadow-sm border border-white/15'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form area */}
          <div className="px-8 pb-8">

            {/* Sign In */}
            {tab === 'signin' && (
              <form className="space-y-4" onSubmit={handleLogin}>
                <GlassInput
                  id="username"
                  label="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Your username"
                  required
                />
                <GlassInput
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-white/10 text-brand focus:ring-brand/50 focus:ring-offset-0" />
                    <span className="text-sm text-white/60">Remember me</span>
                  </label>
                  <button type="button" onClick={() => setTab('request')} className="text-sm text-white/60 hover:text-white transition-colors">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-brand/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Signing in…' : 'Sign in to Dashboard'}
                </button>

                <div className="relative pt-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs text-white/40">
                    <span className="px-3" style={{ background: 'transparent' }}>Don't have access?</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTab('request')}
                  className="w-full py-2.5 border border-white/15 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  Request Access →
                </button>
              </form>
            )}

            {/* Request Access */}
            {tab === 'request' && <RequestAccessForm />}
          </div>
        </div>

        {/* Below card — back link + copyright */}
        <div className="flex flex-col items-center gap-3 mt-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/80 text-sm font-medium transition-all duration-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to Home
          </Link>
          <p className="text-white/20 text-xs">
            © 2026 HimShakti Food Processing, Uttarakhand
          </p>
        </div>
      </div>

      {/* Bottom-right product caption */}
      <div className="absolute bottom-8 right-8 max-w-xs">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-1">What you're protecting</p>
          <p className="text-white font-semibold text-sm leading-snug">
            "Every jar represents a farmer, a harvest, and a promise."
          </p>
          <p className="text-white/30 text-xs mt-1.5">— HimShakti Food Processing, Uttarakhand</p>
        </div>
      </div>
    </div>
  );
}
