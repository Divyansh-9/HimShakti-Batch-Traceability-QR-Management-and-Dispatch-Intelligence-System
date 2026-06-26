import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function InvitePage() {
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const token             = searchParams.get('token');

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [activated,   setActivated]   = useState(false);
  const [username,    setUsername]    = useState('');

  // Guard — no token in URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center p-8">
          <p className="text-red-400 text-lg font-semibold mb-2">Invalid invite link</p>
          <p className="text-white/40 text-sm mb-6">This link is missing a token. Ask the admin for a new invite.</p>
          <Link to="/login" className="text-brand hover:underline text-sm">Back to Sign In</Link>
        </div>
      </div>
    );
  }

  async function handleActivate(e) {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const data = await client('/auth/activate', {
        method:          'POST',
        body:            JSON.stringify({ token, password }),
        skipAuthRedirect: true,
      });
      setUsername(data.username);
      setActivated(true);
      toast.success('Account activated! You can now sign in.');
    } catch (err) {
      toast.error(err.message || 'Activation failed. Link may be expired or already used.');
    } finally {
      setLoading(false);
    }
  }

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
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-brand/20 border border-brand/30 rounded-xl flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-brand" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Activate Account</h1>
            </div>
            <p className="text-white/50 text-sm mt-1 pl-12">Set your password to complete account setup.</p>
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            {activated ? (
              /* ── Success state ── */
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">You're all set!</h3>
                <p className="text-white/60 text-sm mb-1">Your username is:</p>
                <p className="text-brand font-bold text-xl mb-5 tracking-wide">{username}</p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-brand/30"
                >
                  Sign In Now
                </button>
              </div>
            ) : (
              /* ── Set password form ── */
              <form className="space-y-5" onSubmit={handleActivate}>
                {/* Password */}
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
                  {/* Strength indicator */}
                  <div className="flex gap-1 mt-2">
                    {[8, 12, 16].map((min, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= min ? 'bg-brand' : 'bg-white/10'
                      }`} />
                    ))}
                  </div>
                  <p className="text-white/30 text-[10px] mt-1">
                    {password.length < 8 ? 'Too short' : password.length < 12 ? 'Okay' : password.length < 16 ? 'Good' : 'Strong'}
                  </p>
                </div>

                {/* Confirm */}
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

                <button type="submit" disabled={loading || (confirm && confirm !== password)}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed mt-1">
                  {loading ? 'Activating…' : 'Activate Account'}
                </button>
              </form>
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
