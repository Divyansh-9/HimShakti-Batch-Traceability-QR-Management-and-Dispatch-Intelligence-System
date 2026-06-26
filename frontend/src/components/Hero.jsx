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
        {/* Layered overlays: heavy left fade for text, vertical bottom fade into page */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32">
        <div className="max-w-2xl">

          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 border border-white/15"
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
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brand/30 hover:-translate-y-0.5"
            >
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-sm"
            >
              Learn More
            </Link>
          </div>

          {/* Mini stats */}
          <div
            className="mt-12 flex flex-wrap gap-6"
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

      {/* ── Sourced badge ── */}
      <div className="absolute bottom-10 right-8 bg-black/50 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
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
