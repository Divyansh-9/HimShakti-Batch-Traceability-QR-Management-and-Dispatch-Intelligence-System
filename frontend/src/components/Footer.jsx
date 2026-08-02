import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const GITHUB_URL = 'https://github.com/Divyansh-9/HimShakti-Batch-Traceability-QR-Management-and-Dispatch-Intelligence-System';
const LIVE_URL   = 'https://himshakti2026-bb904.web.app';
const API_URL    = 'https://him-shakti-batch-traceability-qr-ma.vercel.app';
const EMAIL      = 'divyanshuniyal05@gmail.com';

/* ── Icon components ──────────────────────────────────── */
function GitHubIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}
function MailIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function ExternalIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M6.22 8.72a.75.75 0 001.06 1.06l5.22-5.22v1.69a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75h-3.5a.75.75 0 000 1.5h1.69L6.22 8.72z" />
      <path d="M3.5 6.75A.75.75 0 014.25 6H6a.75.75 0 000-1.5H4.25A2.25 2.25 0 002 6.75v6A2.25 2.25 0 004.25 15h6A2.25 2.25 0 0012.5 13v-1.75a.75.75 0 00-1.5 0V13a.75.75 0 01-.75.75h-6A.75.75 0 013.5 12.75v-6z" />
    </svg>
  );
}
function LeafIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21H5.71C8 16 10 12 17 10V8zM2 8.33L3 10c5-2.25 9.53-1.91 12 0C17 8 18.5 6 20 5c-4.5-.5-12 .67-18 3.33z" />
    </svg>
  );
}

/* ── Nav groups ─────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Platform',
    links: [
      { label: 'Home', to: '/', internal: true },
      { label: 'About', to: '/about', internal: true },
      { label: 'Sign In', to: '/login', internal: true },
      { label: 'Live App', href: LIVE_URL, badge: 'Live' },
    ],
  },
  {
    label: 'System',
    links: [
      { label: 'API Docs', href: `${API_URL}/health`, badge: 'Health' },
      { label: 'GitHub Repo', href: GITHUB_URL },
      { label: 'Request Access', to: '/login', internal: true },
    ],
  },
  {
    label: 'Documentation',
    links: [
      { label: 'Batch Management', href: `${GITHUB_URL}/blob/main/docs/BATCH_MANAGEMENT.md` },
      { label: 'Database Design', href: `${GITHUB_URL}/blob/main/docs/DATABASE.md` },
      { label: 'Changelog', href: `${GITHUB_URL}/blob/main/CHANGELOG.md` },
    ],
  },
];

/* ══════════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════════ */
/* ── Live API status widget ──────────────────────────────── */
function ApiStatusBadge() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'degraded' | 'offline'
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      const t0 = performance.now();
      try {
        const res = await fetch(`${API_URL}/health`, {
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        });
        if (cancelled) return;
        const ms = Math.round(performance.now() - t0);
        setLatency(ms);
        setStatus(res.ok ? (ms < 800 ? 'online' : 'degraded') : 'offline');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    }
    ping();
    return () => { cancelled = true; };
  }, []);

  const map = {
    checking: { label: 'Checking API…', dot: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', pulse: false },
    online:   { label: 'API Operational', dot: '#4ade80', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  pulse: true  },
    degraded: { label: 'API Slow',        dot: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', pulse: true  },
    offline:  { label: 'API Unreachable', dot: '#f87171', bg: 'rgba(248,113,113,0.08)',border: 'rgba(248,113,113,0.25)',pulse: false },
  };
  const { label, dot, bg, border, pulse } = map[status];

  return (
    <div
      className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-xs font-semibold border"
      style={{ background: bg, borderColor: border, color: dot }}
      title={latency ? `Response: ${latency}ms` : undefined}
    >
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {pulse && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: dot }}
          />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: dot }} />
      </span>
      {label}
      {latency && status !== 'checking' && (
        <span className="opacity-60 font-normal">{latency}ms</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════════ */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative mt-auto border-t border-border overflow-hidden"
      style={{ background: 'linear-gradient(180deg, var(--surface) 0%, #0f1420 100%)' }}
    >
      {/* subtle grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Top section ─────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="md:col-span-2 flex flex-col gap-5">
            {/* Logo mark */}
            <div className="flex items-center gap-2.5">
              <span
                className="flex items-center justify-center w-9 h-9 rounded-xl text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg,#ea580c,#b45309)' }}
              >
                <LeafIcon className="w-5 h-5" />
              </span>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                HimShakti
                <span className="block text-xs font-medium tracking-widest text-text-muted uppercase -mt-0.5">
                  Traceability System
                </span>
              </span>
            </div>

            <p className="text-sm text-text-muted leading-relaxed max-w-xs">
              Farm-to-shelf batch traceability for HimShakti Food Processing, Uttarakhand.
              Wild berries · Himalayan salts · Fruit preserves.
            </p>

            {/* Live API status */}
            <ApiStatusBadge />

            {/* Contact */}
            <div className="flex flex-col gap-2">
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand transition-colors group"
              >
                <MailIcon className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                {EMAIL}
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
              >
                <GitHubIcon className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>Divyansh-9 / HimShakti</span>
                <ExternalIcon className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                {group.label}
              </h3>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.internal ? (
                      <Link
                        to={link.to}
                        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand transition-colors"
                      >
                        {link.label}
                        {link.badge && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(234,88,12,0.15)', color: '#ea580c' }}
                          >
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand transition-colors group"
                      >
                        {link.label}
                        {link.badge ? (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}
                          >
                            {link.badge}
                          </span>
                        ) : (
                          <ExternalIcon className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
                        )}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-border" />
      </div>

      {/* ── Bottom bar ──────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Copyright */}
          <p className="text-xs text-text-muted text-center sm:text-left">
            &copy; {year}{' '}
            <span className="font-semibold text-text-primary">HimShakti Food Processing</span>
            {' '}· Built by{' '}
            <a
              href={`mailto:${EMAIL}`}
              className="text-brand hover:underline underline-offset-2 font-medium"
            >
              Divyansh Uniyal
            </a>
            {' '}· TBI-GEU Summer Internship 2026
          </p>

          {/* Tech stack pills */}
          <div className="flex items-center flex-wrap justify-center gap-2">
            {['React 18', 'Node.js', 'MongoDB', 'Gemini AI', 'Firebase'].map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-semibold px-2 py-1 rounded-md border"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
