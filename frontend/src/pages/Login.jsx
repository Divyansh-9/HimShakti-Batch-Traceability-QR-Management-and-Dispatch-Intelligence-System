import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import client from '../api/client';
import { Eye, EyeOff, LogIn, Leaf, ArrowLeft, ArrowRight, X, AlertTriangle, Mail, KeyRound, ShieldCheck, RotateCcw } from 'lucide-react';


// ── Google Brand-Compliant Button ─────────────────────────────
// Matches Google's Sign-In button brand guidelines:
// Roboto font, 14px, 0.25px letter-spacing, official multi-color SVG logo,
// white background, gray-300 border, 44px min touch target
const GoogleSVG = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
  </svg>
);

function GoogleButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{ fontFamily: "'Roboto', 'Inter', sans-serif", fontSize: '14px', letterSpacing: '0.25px' }}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 font-medium text-gray-700"
    >
      <GoogleSVG />
      {label}
    </button>
  );
}

// ── OR Divider ────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="relative flex items-center my-5">
      <div className="flex-grow border-t border-white/15" />
      <span className="mx-3 text-xs text-white/40 font-medium tracking-wide uppercase">or</span>
      <div className="flex-grow border-t border-white/15" />
    </div>
  );
}

// ── Glass Input ───────────────────────────────────────────────
function GlassInput({ id, label, type = 'text', value, onChange, placeholder, required, autoFocus }) {
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
          autoFocus={autoFocus}
          className="w-full px-4 py-3 min-h-[44px] bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all pr-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Role Selector ─────────────────────────────────────────────
const ROLES = [
  { value: 'factory-manager',      label: 'Factory Manager',       icon: '🏭', desc: 'Create batches, run dispatch, manage inventory' },
  { value: 'quality-inspector',    label: 'Quality Inspector',     icon: '🔍', desc: 'Monitor quality flags, audit compliance records' },
  { value: 'dispatch-coordinator', label: 'Dispatch Coordinator',  icon: '🚚', desc: 'Manage FEFO queues and outbound shipments' },
  { value: 'admin',                label: 'Administrator',         icon: '⚙️', desc: 'Full system access, user and role management' },
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
            className={`relative flex flex-col items-start gap-1 p-3 min-h-[44px] rounded-xl border text-left transition-all duration-200 ${
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

// ── Request Access Form ────────────────────────────────────────
function RequestAccessForm({ prefillName = '', prefillEmail = '' }) {
  const { requestAccess, loading } = useAuth();
  const [form, setForm]           = useState({ name: prefillName, email: prefillEmail, role: 'factory-manager' });
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!form.name.trim() || !form.email.trim()) { toast.error('Please fill all fields'); return; }

    const result = await requestAccess(form);
    if (result.success) {
      setSubmitted(true);
      toast.success('Request submitted! The admin team will review within 1–2 business days.');
    } else {
      setServerError(result.error || 'Something went wrong. Please try again.');
    }
  }

  // ── Google pre-fill for Request Access ───────────────────────
  // Opens an inline mini-form instead of window.prompt (which looks like phishing).
  // The user still submits the same /auth/request-access endpoint — no OAuth needed.
  const [showGooglePrefill, setShowGooglePrefill] = useState(false);
  const [googleEmail, setGoogleEmail]             = useState('');

  function applyGooglePrefill() {
    if (!googleEmail.trim()) return;
    // Derive a friendly display name from the email prefix
    const guessedName = googleEmail.split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    setForm(p => ({ ...p, email: googleEmail.trim(), name: guessedName }));
    setShowGooglePrefill(false);
    toast.success('Email pre-filled — confirm your details and select a role.');
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
        <button
          onClick={() => { setSubmitted(false); setForm({ name: prefillName, email: prefillEmail, role: 'factory-manager' }); }}
          className="mt-5 text-sm text-white/60 hover:text-white underline"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>

      {/* Google pre-fill CTA */}
      {!showGooglePrefill ? (
        <GoogleButton
          label="Pre-fill with Google account"
          onClick={() => setShowGooglePrefill(true)}
        />
      ) : (
        // Inline mini-form — no window.prompt, no phishing appearance
        <div className="bg-white/8 border border-white/20 rounded-xl p-4 space-y-3">
          <p className="text-white/80 text-xs font-semibold">Enter your Google email to pre-fill</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={googleEmail}
              onChange={e => setGoogleEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyGooglePrefill())}
              placeholder="you@gmail.com"
              autoFocus
              className="flex-1 px-3 py-2 min-h-[40px] bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="button"
              onClick={applyGooglePrefill}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all duration-200"
            >
              Apply
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowGooglePrefill(false)}
            className="text-xs text-white/40 hover:text-white/60"
          >
            Cancel
          </button>
        </div>
      )}

      <OrDivider />

      <GlassInput id="req-name" label="Full Name" value={form.name}
        onChange={e => onChange({ target: { name: 'name', value: e.target.value } })}
        placeholder="e.g. Ramesh Kumar" required />
      <GlassInput id="req-email" label="Work Email" type="email" value={form.email}
        onChange={e => onChange({ target: { name: 'email', value: e.target.value } })}
        placeholder="you@himshakti.com" required />
      <RoleSelector value={form.role} onChange={role => setForm(p => ({ ...p, role }))} />

      {serverError && (
        <p className="text-red-300 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-3 min-h-[44px] bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed mt-1">
        {loading ? 'Submitting…' : 'Submit Access Request'}
      </button>
      <p className="text-xs text-white/40 text-center">Credentials will be sent to your email within 1–2 business days.</p>
    </form>
  );
}

// ── Forgot Password Panel ──────────────────────────────────────
// 3-step inline panel: identify → OTP → new password
function ForgotPasswordPanel({ onClose }) {
  const [step,          setStep]          = useState(1);
  const [identifier,    setIdentifier]    = useState('');
  const [maskedEmail,   setMaskedEmail]   = useState('');
  const [otp,           setOtp]           = useState(['', '', '', '', '', '']);
  const [resetToken,    setResetToken]    = useState('');
  const [newPass,       setNewPass]       = useState('');
  const [confirmPass,   setConfirmPass]   = useState('');
  const [showPass,      setShowPass]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [resendTimer,   setResendTimer]   = useState(0);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Password strength
  function getStrength(p) {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)  s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }
  const strength = getStrength(newPass);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'][strength];

  // Step 1 — send OTP
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!identifier.trim()) { setError('Please enter your username or email.'); return; }
    setLoading(true); setError('');
    try {
      const data = await client('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      setMaskedEmail(data.maskedEmail || '');
      setStep(2);
      setResendTimer(60);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch (err) {
      if (err.code === 'NO_EMAIL' || err.status === 422) {
        setError('This account has no email linked. Contact your administrator to reset your password.');
      } else {
        // Generic — do not reveal whether account exists
        setMaskedEmail('your registered email');
        setStep(2);
        setResendTimer(60);
      }
    } finally { setLoading(false); }
  }

  // Step 1 — resend (called from step 2 too)
  async function handleResend() {
    if (resendTimer > 0) return;
    setLoading(true); setError('');
    try {
      await client('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
      toast.success('New OTP sent!');
    } catch { toast.error('Failed to resend. Try again.'); }
    finally { setLoading(false); }
  }

  // Step 2 — verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true); setError('');
    try {
      const data = await client('/auth/verify-reset-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim(), otp: code }),
      });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) { setError(err.message || 'Incorrect OTP. Please try again.'); }
    finally { setLoading(false); }
  }

  // Step 3 — reset password
  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await client('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ resetToken, newPassword: newPass }),
      });
      toast.success('Password reset! Sign in with your new password.');
      onClose();
    } catch (err) { setError(err.message || 'Reset failed. Please start over.'); }
    finally { setLoading(false); }
  }

  // OTP input handling
  function handleOtpChange(idx, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
  }
  function handleOtpKey(idx, e) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  }
  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs[5].current?.focus();
    }
  }

  const stepTitles = ['', 'Reset Password', 'Enter OTP Code', 'Set New Password'];
  const stepIcons  = [null, KeyRound, ShieldCheck, KeyRound];
  const StepIcon   = stepIcons[step];

  return (
    <>
      <style>{`
        @keyframes fpFadeIn  { from { opacity:0; }              to { opacity:1; } }
        @keyframes fpSlideUp { from { transform:translateY(24px) scale(0.97); opacity:0; }
                               to   { transform:translateY(0)    scale(1);    opacity:1; } }
        .fp-scrim  { animation: fpFadeIn  0.22s ease forwards; }
        .fp-card   { animation: fpSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* ── Full-screen scrim ── */}
      <div
        className="fp-scrim fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(18px)' }}
        onClick={onClose}
      >
        {/* ── Floating glass card ── */}
        <div
          className="fp-card relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
          style={{
            background: 'linear-gradient(160deg, rgba(40,40,40,0.97) 0%, rgba(18,18,18,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Subtle top glow accent */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(232,99,42,0.6), transparent)',
          }} />

          {/* ── Step progress bar ── */}
          <div className="h-0.5 bg-white/5">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${(step / 3) * 100}%`,
                background: 'linear-gradient(90deg, #e8632a, #f59e0b)',
              }}
            />
          </div>

          {/* ── Card header ── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={() => { setStep(s => s - 1); setError(''); }}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(232,99,42,0.15)', border: '1px solid rgba(232,99,42,0.25)' }}
              >
                {StepIcon && <StepIcon className="w-4 h-4 text-brand" />}
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">{stepTitles[step]}</p>
                <p className="text-white/35 text-[10px] mt-0.5">Step {step} of 3 · HimShakti</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Card body ── */}
          <div className="px-6 py-5">

            {/* Step 1 — Identify */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(232,99,42,0.12)', border: '1px solid rgba(232,99,42,0.2)' }}>
                      <KeyRound className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Forgot your password?</p>
                      <p className="text-white/45 text-xs">We'll send a one-time code to your email</p>
                    </div>
                  </div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setError(''); }}
                    placeholder="e.g. manager or you@himshakti.com"
                    autoFocus
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(232,99,42,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,99,42,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs leading-relaxed">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 min-h-[44px] rounded-xl text-white font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #e8632a, #d4521f)', boxShadow: '0 4px 20px rgba(232,99,42,0.35)' }}>
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Sending OTP…</span></>
                    : <><Mail className="w-4 h-4" /><span>Send OTP</span></>}
                </button>

                <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Remembered it?{' '}
                  <button type="button" onClick={onClose}
                    className="text-brand hover:text-orange-400 font-semibold transition-colors">
                    Back to Sign In
                  </button>
                </p>
              </form>
            )}

            {/* Step 2 — OTP Entry */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center py-1">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(232,99,42,0.12)', border: '1px solid rgba(232,99,42,0.22)' }}>
                    <Mail className="w-7 h-7 text-brand" />
                  </div>
                  <p className="text-white font-bold text-sm">Check your inbox</p>
                  <p className="text-white/45 text-xs mt-1 leading-relaxed">
                    6-digit code sent to<br />
                    <span className="text-white/75 font-semibold font-mono">{maskedEmail}</span>
                  </p>
                  <p className="text-white/25 text-[10px] mt-1">Expires in 5 minutes</p>
                </div>

                {/* 6-digit boxes */}
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKey(idx, e)}
                      className="w-11 h-14 text-center text-xl font-black rounded-xl text-white focus:outline-none transition-all duration-200"
                      style={{
                        background: digit ? 'rgba(232,99,42,0.12)' : 'rgba(255,255,255,0.06)',
                        border: digit ? '1.5px solid rgba(232,99,42,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                        boxShadow: digit ? '0 0 0 3px rgba(232,99,42,0.1)' : 'none',
                        letterSpacing: '0.05em',
                      }}
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs leading-relaxed">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading || otp.join('').length < 6}
                  className="w-full py-3 min-h-[44px] rounded-xl text-white font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #e8632a, #d4521f)', boxShadow: '0 4px 20px rgba(232,99,42,0.35)' }}>
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Verifying…</span></>
                    : <><ShieldCheck className="w-4 h-4" /><span>Verify OTP</span></>}
                </button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Resend available in <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{resendTimer}s</span>
                    </p>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={loading}
                      className="text-xs text-brand hover:text-orange-400 font-semibold flex items-center gap-1.5 mx-auto transition-colors disabled:opacity-50">
                      <RotateCcw className="w-3 h-3" /> Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Step 3 — New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl mb-1"
                  style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.12)' }}>
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-400 font-bold text-xs">Identity Verified</p>
                    <p className="text-white/40 text-[10px]">Set your new password below</p>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPass}
                      onChange={e => { setNewPass(e.target.value); setError(''); }}
                      placeholder="Min. 8 characters"
                      autoFocus
                      className="w-full px-4 py-3 pr-10 min-h-[44px] rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(232,99,42,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,99,42,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {newPass && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-white/8'}`} />
                        ))}
                      </div>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Strength: <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight:600 }}>{strengthLabel}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={e => { setConfirmPass(e.target.value); setError(''); }}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none transition-all"
                    style={{
                      background: confirmPass && confirmPass !== newPass ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.06)',
                      border: confirmPass && confirmPass !== newPass ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.12)',
                    }}
                    onFocus={e => { if (!e.target.value || confirmPass === newPass) { e.target.style.borderColor = 'rgba(232,99,42,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,99,42,0.12)'; } }}
                    onBlur={e => { if (!e.target.value || confirmPass === newPass) { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; } }}
                  />
                  {confirmPass && confirmPass !== newPass && (
                    <p className="text-red-400 text-[10px] mt-1">Passwords do not match</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs leading-relaxed">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading || !newPass || !confirmPass || newPass !== confirmPass}
                  className="w-full py-3 min-h-[44px] rounded-xl text-white font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #e8632a, #d4521f)', boxShadow: '0 4px 20px rgba(232,99,42,0.35)' }}>
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Resetting…</span></>
                    : <><KeyRound className="w-4 h-4" /><span>Reset Password</span></>}
                </button>
              </form>
            )}

          </div>

          {/* Bottom brand strip */}
          <div className="px-6 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              🔒 Secured by HimShakti Traceability Platform
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


// ── Main Login Page ────────────────────────────────────────────
export default function Login() {
  const [tab,           setTab]           = useState('signin');
  const [username,      setUsername]      = useState('');
  const [password,      setPassword]      = useState('');
  const [showForgot,    setShowForgot]    = useState(false);
  // null = idle | 'loading' = verifying with backend | { code, message } = error state
  const [googleState, setGoogleState] = useState(null);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  // ── Username/password login ────────────────────────────────────
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

  // ── Real Google OAuth (useGoogleLogin from @react-oauth/google) ─
  // Triggers the native Google account picker — same flow as YouTube/Gmail.
  // The access_token is verified server-side via Google's /userinfo endpoint.
  // Falls back gracefully when VITE_GOOGLE_CLIENT_ID is not configured.
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleState('loading');
      try {
        const data = await client('/auth/google/token', {
          method: 'POST',
          body: JSON.stringify({ credential: tokenResponse.access_token }),
        });
        localStorage.setItem('hs_token', data.token);
        localStorage.setItem('hs_user',  JSON.stringify(data.user));
        toast.success(`Welcome, ${data.user.name.split(' ')[0]}!`);
        navigate('/dashboard');
      } catch (err) {
        setGoogleState({ code: err.code || 'ERROR', message: err.message || 'Sign-in failed. Try again.' });
      }
    },
    onError: () => {
      setGoogleState({ code: 'POPUP_CLOSED', message: 'Sign-in was cancelled.' });
    },
    flow: 'implicit',
  });

  function handleGoogleClick() {
    if (!hasGoogleClientId) {
      setGoogleState({
        code:    'NOT_CONFIGURED',
        message: 'Google Sign-In is not yet configured. Sign in with your username and password below.',
      });
      return;
    }
    setGoogleState(null);
    googleLogin();
  }

  return (
    <>
      {showForgot && <ForgotPasswordPanel onClose={() => setShowForgot(false)} />}
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
          <div className="px-6 sm:px-8 pt-7 sm:pt-8 pb-5 sm:pb-6 border-b border-white/10">
            <Link
              to="/"
              title="Back to Home"
              className="flex items-center gap-3 mb-5 sm:mb-6 group w-fit"
            >
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm group-hover:underline underline-offset-2 transition-all">HimShakti</p>
                <p className="text-white/50 text-xs">Traceability Platform</p>
              </div>
            </Link>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {tab === 'signin' ? 'Welcome back' : 'Request Access'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {tab === 'signin'
                ? 'Sign in to your secure operations dashboard.'
                : 'New to the system? Request credentials from the admin team.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="px-6 sm:px-8 pt-5">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-5">
              {[
                { id: 'signin',  label: 'Sign In' },
                { id: 'request', label: 'Request Access' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-2 min-h-[40px] text-sm font-semibold rounded-lg transition-all duration-200 ${
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
          <div className="px-6 sm:px-8 pb-7 sm:pb-8">

            {/* ── Sign In ── */}
            {tab === 'signin' && (
              <form className="space-y-4" onSubmit={handleLogin}>

                {/* ── Google Sign-In — REAL OAuth via @react-oauth/google ── */}

                <div>
                  {/* Loading state replaces the button while waiting for backend */}
                  {googleState === 'loading' ? (
                    <div className="w-full flex items-center justify-center gap-3 px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-xl shadow-sm">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      <span style={{ fontFamily: "'Roboto','Inter',sans-serif", fontSize: '14px' }} className="font-medium text-gray-600">Signing you in…</span>
                    </div>
                  ) : (
                    <GoogleButton
                      label="Continue with Google"
                      onClick={handleGoogleClick}
                    />
                  )}

                  {/* ── Contextual error panel (only appears on failure, not on click) ── */}
                  <div
                    style={{
                      maxHeight: googleState && googleState !== 'loading' ? '260px' : '0',
                      opacity:   googleState && googleState !== 'loading' ? 1 : 0,
                      overflow:  'hidden',
                      transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
                    }}
                  >
                    {googleState && googleState !== 'loading' && (
                      <div className="mt-3 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-sm overflow-hidden">
                        {/* Panel header — icon changes by error type */}
                        <div className="flex items-start justify-between px-4 pt-4 pb-3 gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              googleState.code === 'NOT_LINKED' ? 'bg-amber-500/15' : 'bg-red-500/15'
                            }`}>
                              {googleState.code === 'NOT_LINKED'
                                ? <Mail className="w-4 h-4 text-amber-400" />
                                : <AlertTriangle className="w-4 h-4 text-red-400" />}
                            </div>
                            <div>
                              <p className="text-white text-sm font-semibold leading-tight">
                                {googleState.code === 'NOT_LINKED' ? 'Google account not linked' :
                                 googleState.code === 'ACCOUNT_DISABLED' ? 'Account disabled' :
                                 googleState.code === 'POPUP_CLOSED' ? 'Sign-in cancelled' :
                                 'Sign-in failed'}
                              </p>
                              <p className="text-white/50 text-xs mt-0.5 leading-snug max-w-[240px]">
                                {googleState.message}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGoogleState(null)}
                            className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 p-0.5"
                            aria-label="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Context-aware action paths */}
                        <div className="px-4 pb-4 flex flex-col gap-2">
                          {googleState.code === 'NOT_LINKED' ? (
                            // Not linked — guide them to sign in first, then link from dashboard
                            <>
                              <button
                                type="button"
                                onClick={() => { setGoogleState(null); setTimeout(() => document.getElementById('username')?.focus(), 50); }}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-brand/20 hover:bg-brand/30 border border-brand/30 transition-all duration-200 group"
                              >
                                <div className="text-left">
                                  <p className="text-white text-xs font-semibold">Sign in with credentials first</p>
                                  <p className="text-white/50 text-[10px] mt-0.5">Then link your Google account from the dashboard</p>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-brand group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                              </button>
                              <button
                                type="button"
                                onClick={() => { setGoogleState(null); setTab('request'); }}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 group"
                              >
                                <div className="text-left">
                                  <p className="text-white text-xs font-semibold">New user? Request access</p>
                                  <p className="text-white/50 text-[10px] mt-0.5">Admin will approve and link your account</p>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                              </button>
                            </>
                          ) : (
                            // Generic error — retry
                            <button
                              type="button"
                              onClick={() => { setGoogleState(null); handleGoogleClick(); }}
                              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all duration-200 text-white text-xs font-semibold"
                            >
                              Try again with Google
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <OrDivider />

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
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-white/10 text-brand focus:ring-brand/50 focus:ring-offset-0" />
                    <span className="text-sm text-white/60">Remember me</span>
                  </label>
                  <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-white/60 hover:text-white transition-colors min-h-[44px] px-1">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 min-h-[44px] bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-brand/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Signing in…' : 'Sign in to Dashboard'}
                </button>

                <div className="relative pt-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs text-white/40">
                    <span className="px-3 bg-transparent">Don't have access?</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTab('request')}
                  className="w-full py-2.5 min-h-[44px] border border-white/15 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  Request Access →
                </button>
              </form>
            )}

            {/* ── Request Access ── */}
            {tab === 'request' && <RequestAccessForm />}
          </div>
        </div>

        {/* Below card — back link + copyright */}
        <div className="flex flex-col items-center gap-3 mt-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/80 text-sm font-medium transition-all duration-200 group min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to Home
          </Link>
          <p className="text-white/20 text-xs">
            © 2026 HimShakti Food Processing, Uttarakhand
          </p>
        </div>
      </div>

      {/* Bottom-right product caption — hidden on very small screens to avoid overlap */}
      <div className="absolute bottom-8 right-8 max-w-xs hidden sm:block">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-1">What you're protecting</p>
          <p className="text-white font-semibold text-sm leading-snug">
            "Every jar represents a farmer, a harvest, and a promise."
          </p>
          <p className="text-white/30 text-xs mt-1.5">— HimShakti Food Processing, Uttarakhand</p>
        </div>
      </div>
    </div>
    </>
  );

}
