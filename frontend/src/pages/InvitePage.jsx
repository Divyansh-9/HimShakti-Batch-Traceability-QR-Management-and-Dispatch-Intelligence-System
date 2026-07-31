import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, KeyRound, CheckCircle, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

// ── Utility: mask email for display  e.g. di*****@gmail.com ──────────────────
function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

// ── OTP Input: 6 individual boxes with auto-advance / backspace / paste ───────
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits  = value.split('').concat(Array(6).fill('')).slice(0, 6);

  function focusNext(idx) {
    if (idx < 5) inputs.current[idx + 1]?.focus();
  }
  function focusPrev(idx) {
    if (idx > 0) inputs.current[idx - 1]?.focus();
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[idx]) {
        // Clear current cell
        const next = [...digits];
        next[idx] = '';
        onChange(next.join(''));
      } else {
        // Move back and clear
        focusPrev(idx);
        if (idx > 0) {
          const next = [...digits];
          next[idx - 1] = '';
          onChange(next.join(''));
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); focusPrev(idx);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); focusNext(idx);
    }
  }

  function handleChange(e, idx) {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const next = [...digits];
    next[idx] = char;
    onChange(next.join(''));
    focusNext(idx);
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted.padEnd(6, '').slice(0, 6).trimEnd());
      const focusIdx = Math.min(pasted.length, 5);
      inputs.current[focusIdx]?.focus();
    }
  }

  return (
    <div className="flex gap-2.5 justify-center">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={el => (inputs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={`
            w-12 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all
            bg-white/10 text-white caret-transparent
            focus:outline-none focus:scale-105
            ${d
              ? 'border-brand bg-brand/15 text-white shadow-lg shadow-brand/20'
              : 'border-white/20 hover:border-white/40'
            }
          `}
          style={{ fontFamily: "'Courier New', monospace" }}
          aria-label={`OTP digit ${idx + 1}`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEP = { PASSWORD: 'password', OTP: 'otp', DONE: 'done' };

export default function InvitePage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get('token');

  // Step state
  const [step,       setStep]       = useState(STEP.PASSWORD);
  const [username,   setUsername]   = useState('');
  const [email,      setEmail]      = useState('');
  const [otpSent,    setOtpSent]    = useState(false);

  // Password form
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [pwLoading,  setPwLoading]  = useState(false);

  // OTP form
  const [otp,        setOtp]        = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Password strength
  const pwStrength = password.length >= 16 ? 3 : password.length >= 12 ? 2 : password.length >= 8 ? 1 : 0;
  const pwLabel    = ['Too short', 'Okay', 'Good', 'Strong'][pwStrength];
  const pwColors   = ['bg-white/10', 'bg-amber-500', 'bg-brand', 'bg-green-500'];

  // Guard — no token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center p-8">
          <p className="text-red-400 text-lg font-semibold mb-2">Invalid invite link</p>
          <p className="text-white/40 text-sm mb-6">This link is missing a token. Ask the admin for a new invite.</p>
          <Link to="/login" className="text-brand hover:underline text-sm">← Back to Sign In</Link>
        </div>
      </div>
    );
  }

  // ── Step 1: Set password ────────────────────────────────────────────────────
  async function handleSetPassword(e) {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setPwLoading(true);
    try {
      const data = await client('/auth/activate', {
        method:           'POST',
        body:             JSON.stringify({ token, password }),
        skipAuthRedirect: true,
      });
      setUsername(data.username);
      setEmail(data.email || '');
      setOtpSent(data.otpSent);
      setStep(STEP.OTP);
      setResendCooldown(60);
      if (data.otpSent) {
        toast.success('Password set! Check your email for the verification code.');
      } else {
        toast('Password set! Email not configured — check with your admin.', { icon: '⚠️' });
      }
    } catch (err) {
      toast.error(err.message || 'Activation failed. Link may be expired or already used.');
    } finally {
      setPwLoading(false);
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (otp.replace(/\D/g, '').length < 6) { toast.error('Please enter all 6 digits'); return; }

    setOtpLoading(true);
    try {
      await client('/auth/verify-otp', {
        method:           'POST',
        body:             JSON.stringify({ username, otp: otp.replace(/\D/g, '') }),
        skipAuthRedirect: true,
      });
      setStep(STEP.DONE);
      toast.success('Email verified! Welcome to HimShakti 🎉');
    } catch (err) {
      toast.error(err.message || 'Incorrect or expired OTP.');
      setOtp('');
    } finally {
      setOtpLoading(false);
    }
  }

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    try {
      await client('/auth/verify-otp/resend', {
        method:           'POST',
        body:             JSON.stringify({ username }),
        skipAuthRedirect: true,
      });
      setResendCooldown(60);
      toast.success('New code sent! Check your email.');
    } catch (err) {
      toast.error(err.message || 'Failed to resend code.');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src="/warehouse-bg.png" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/65 to-black/40" />
      </div>

      <div className="relative w-full max-w-md mx-4 z-10">
        <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3 mb-6 group w-fit">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">HimShakti</p>
                <p className="text-white/50 text-xs">Traceability Platform</p>
              </div>
            </Link>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              {[
                { s: STEP.PASSWORD, label: 'Password', icon: KeyRound },
                { s: STEP.OTP,      label: 'Verify',   icon: Mail      },
                { s: STEP.DONE,     label: 'Done',     icon: CheckCircle },
              ].map(({ s, label, icon: Icon }, i, arr) => {
                const done    = step === STEP.DONE || (step === STEP.OTP && s === STEP.PASSWORD);
                const active  = step === s;
                return (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done   ? 'bg-green-500 text-white' :
                      active ? 'bg-brand text-white shadow-lg shadow-brand/40' :
                               'bg-white/10 text-white/30'
                    }`}>
                      {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-semibold transition-colors ${active ? 'text-white' : 'text-white/40'}`}>{label}</span>
                    {i < arr.length - 1 && (
                      <div className={`flex-1 h-px transition-colors ${done ? 'bg-green-500/40' : 'bg-white/10'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mb-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                step === STEP.DONE
                  ? 'bg-green-500/20 border-green-500/30'
                  : step === STEP.OTP
                  ? 'bg-blue-500/20 border-blue-500/30'
                  : 'bg-brand/20 border-brand/30'
              }`}>
                {step === STEP.DONE
                  ? <CheckCircle className="w-4 h-4 text-green-400" />
                  : step === STEP.OTP
                  ? <ShieldCheck className="w-4 h-4 text-blue-400" />
                  : <KeyRound className="w-4 h-4 text-brand" />}
              </div>
              <h1 className="text-2xl font-extrabold text-white">
                {step === STEP.DONE ? "You're all set!" : step === STEP.OTP ? 'Verify Your Email' : 'Activate Account'}
              </h1>
            </div>
            <p className="text-white/50 text-sm mt-1 pl-12">
              {step === STEP.DONE
                ? 'Your account is fully verified and ready.'
                : step === STEP.OTP
                ? `Enter the 6-digit code sent to ${maskEmail(email)}`
                : 'Set your password to complete account setup.'}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-7">

            {/* ─── STEP 1: Set Password ─────────────────────────────────────── */}
            {step === STEP.PASSWORD && (
              <form className="space-y-5" onSubmit={handleSetPassword}>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      className="w-full px-4 py-3 pr-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${pwStrength >= i ? pwColors[pwStrength] : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <p className="text-white/30 text-[10px] mt-1">{password ? pwLabel : ''}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 transition-all ${
                      confirm && confirm !== password
                        ? 'border-red-400/50 focus:ring-red-400/30'
                        : 'border-white/20 focus:ring-white/30'
                    }`}
                  />
                  {confirm && confirm !== password && (
                    <p className="text-red-300 text-xs mt-1">Passwords don't match</p>
                  )}
                </div>

                <button type="submit" disabled={pwLoading || (confirm && confirm !== password)}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2">
                  {pwLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Setting up…</>
                  ) : (
                    <>Set Password &amp; Continue →</>
                  )}
                </button>
              </form>
            )}

            {/* ─── STEP 2: OTP Verification ─────────────────────────────────── */}
            {step === STEP.OTP && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">

                {/* Email notice */}
                {otpSent ? (
                  <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                    <Mail className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200 leading-relaxed">
                      A 6-digit code was sent to <strong className="text-white">{maskEmail(email)}</strong>.
                      Check your inbox (and spam folder).
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                    <Mail className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200 leading-relaxed">
                      Email delivery is not configured. Contact your admin to get your verification code,
                      or click <strong>Resend Code</strong> once email is set up.
                    </p>
                  </div>
                )}

                {/* 6-digit OTP boxes */}
                <div>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.replace(/\D/g, '').length < 6}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying…</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Verify &amp; Activate</>
                  )}
                </button>

                {/* Resend */}
                <div className="text-center">
                  <p className="text-white/40 text-xs mb-1">Didn't receive a code?</p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-sm font-semibold text-brand hover:text-brand-hover disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>

                {/* Username notice */}
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                  <p className="text-white/40 text-xs">Your username is</p>
                  <p className="text-brand font-bold text-lg tracking-wide mt-0.5">{username}</p>
                  <p className="text-white/30 text-xs mt-0.5">You'll use this to sign in</p>
                </div>
              </form>
            )}

            {/* ─── STEP 3: Done ─────────────────────────────────────────────── */}
            {step === STEP.DONE && (
              <div className="text-center py-2 space-y-5">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping opacity-60" />
                  <div className="relative w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Account Verified!</h3>
                  <p className="text-white/50 text-sm">Welcome to HimShakti Traceability Platform</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/40 text-xs mb-1">Sign in with your username</p>
                  <p className="text-brand font-bold text-xl tracking-wide">{username}</p>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-brand/30 flex items-center justify-center gap-2"
                >
                  Sign In Now →
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-5">
          <Link to="/login" className="text-white/40 hover:text-white/70 text-sm transition-colors">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
