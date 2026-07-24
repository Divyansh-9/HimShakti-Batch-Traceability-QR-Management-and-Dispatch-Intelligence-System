import { Link } from 'react-router-dom';
import { ArrowRight, Package, QrCode, Bot, BarChart3 } from 'lucide-react';

const STATS = [
  { value: '8',    label: 'Active Batches' },
  { value: 'FEFO', label: 'Dispatch Logic' },
  { value: 'AI',   label: 'Powered Audit' },
  { value: '100%', label: 'Traceable' },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">

      {/* ── Full-bleed background ── */}
      <div className="absolute inset-0">
        <img
          src="/home-hero.png"
          alt="Himalayan terraced farmland — origin of HimShakti products"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32">
        <div className="max-w-2xl">

          {/* Eyebrow badge — upgraded glass specular */}
          <div
            className="glass-card inline-flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 glass-shimmer-hover relative overflow-hidden"
            style={{ animation: 'heroFadeUp 0.6s ease both' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            HimShakti Food Processing
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight"
            style={{ animation: 'heroFadeUp 0.6s ease 0.1s both' }}
          >
            Intelligent Batch{' '}
            <span className="text-brand">Traceability</span>
          </h1>

          {/* Sub */}
          <p
            className="mt-5 text-base sm:text-lg text-white/70 leading-relaxed max-w-lg"
            style={{ animation: 'heroFadeUp 0.6s ease 0.2s both' }}
          >
            End-to-end transparency for HimShakti food processing. Track product origins, manage QR codes, and monitor dispatch readiness with AI-powered insights.
          </p>

          {/* CTAs */}
          <div
            className="mt-8 flex flex-col sm:flex-row gap-3"
            style={{ animation: 'heroFadeUp 0.6s ease 0.3s both' }}
          >
            {/* Primary CTA — brand glass with glow */}
            <Link
              to="/dashboard"
              className="glass-btn-primary glass-shimmer-hover relative inline-flex items-center justify-center gap-2 px-8 py-3.5 text-white font-bold rounded-xl overflow-hidden"
            >
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Secondary CTA — true liquid glass pill */}
            <Link
              to="/about"
              className="glass-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 text-white font-semibold rounded-xl"
            >
              Learn More
            </Link>
          </div>

          {/* Mini stats — wrapped in a glass strip */}
          <div
            className="mt-12 glass-card inline-flex flex-wrap gap-6 px-6 py-4 rounded-2xl"
            style={{ animation: 'heroFadeUp 0.6s ease 0.4s both' }}
          >
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col">
                <span className="text-2xl font-extrabold text-white">{s.value}</span>
                <span className="text-xs text-white/50 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sourced badge — glass-card ── */}
      <div className="glass-card absolute bottom-10 right-8 rounded-xl px-4 py-3">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-0.5">Sourced from</p>
        <p className="text-white font-bold text-sm">Uttarakhand, India 🏔</p>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
