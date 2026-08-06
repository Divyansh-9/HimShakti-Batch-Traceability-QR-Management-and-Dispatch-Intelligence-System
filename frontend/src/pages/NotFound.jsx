/**
 * @fileoverview 404 — the route that did not exist.
 *
 * Previously any unmatched URL rendered a blank page, which is the worst of
 * both worlds: it looks broken and it gives the visitor no way out. A mistyped
 * QR trace link is the likeliest way someone lands here, so the copy speaks to
 * that case rather than making a joke.
 */
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Note: a bad QR link never lands here. `/trace/:batchCode` matches any
  // string, so TracePage owns the "no such batch" case itself. This page is
  // only for routes the app genuinely does not define.

  return (
    <main id="main-content" className="min-h-[100dvh] flex items-center justify-center bg-background px-6 py-16">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] font-black uppercase tracking-widest text-brand mb-3">
          Error 404
        </p>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight text-balance">
          That page isn&apos;t here
        </h1>

        <p className="text-sm text-text-muted mt-3 leading-relaxed text-pretty">
          The link may be out of date, or the address may have a typo in it.
        </p>

        <p className="mt-4 inline-block max-w-full truncate rounded-lg bg-surface-2 border border-border px-3 py-1.5 font-mono text-[11px] text-text-muted">
          {pathname}
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-surface-2 transition-colors active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go back
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors active:scale-[0.98]"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </Link>

        </div>
      </div>
    </main>
  );
}
