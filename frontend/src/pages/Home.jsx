import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import { Package, QrCode, Truck, Bot, ShieldCheck, Leaf } from 'lucide-react';

// ── How It Works steps ────────────────────────────────────────
const STEPS = [
  {
    number: '01',
    icon: Package,
    title: 'Create a Batch',
    description: 'Log each production batch with farmer details, pack date, quantity, and yield. The system auto-generates a unique batch code and calculates shelf life.',
  },
  {
    number: '02',
    icon: QrCode,
    title: 'Generate QR Code',
    description: 'Every batch instantly gets a scannable QR code. Buyers scan it to see the full origin story — farmer, village, pack date, and expiry — right on their phone.',
  },
  {
    number: '03',
    icon: Bot,
    title: 'Get AI Dispatch Advice',
    description: 'Gemini AI analyses your warehouse daily. It flags batches nearing expiry, surfaces quality concerns, and gives you a prioritised dispatch order — automatically.',
  },
  {
    number: '04',
    icon: Truck,
    title: 'Dispatch with Confidence',
    description: 'The FEFO queue tells your team exactly which batch to dispatch first. Every dispatch is logged, traceable, and tied back to its source farmer.',
  },
];

// ── Trust pillars ─────────────────────────────────────────────
const PILLARS = [
  {
    icon: ShieldCheck,
    color: 'text-brand bg-brand/10',
    title: 'End-to-End Traceability',
    desc: 'Every batch is traceable from the farmer\'s field to the buyer\'s shelf.',
  },
  {
    icon: Bot,
    color: 'text-green-500 bg-green-500/10',
    title: 'AI-Powered Intelligence',
    desc: 'Gemini analyses your warehouse in real time and tells you what to dispatch next.',
  },
  {
    icon: Leaf,
    color: 'text-amber-500 bg-amber-500/10',
    title: 'Organic & Verified',
    desc: 'Built for HimShakti\'s organic supply chain — farmer names, villages, harvest data intact.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Navbar />
      <Hero />

      <main className="flex-grow w-full">

        {/* ── How It Works ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-3">The Workflow</p>
            <h2 className="text-3xl font-extrabold text-text-primary sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-text-muted max-w-xl mx-auto">
              From raw material to retail shelf — every step tracked, every batch verified.
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative group">
                  {/* Connector line between steps */}
                  {idx < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(100%-12px)] w-6 h-px bg-border z-10" />
                  )}
                  <div className="bg-surface border border-border rounded-2xl p-6 h-full hover:border-brand/40 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-3xl font-black text-border select-none">{step.number}</span>
                    </div>
                    <h3 className="text-base font-bold text-text-primary mb-2">{step.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Trust Pillars ── */}
        <section className="border-t border-border bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PILLARS.map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="flex gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${p.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary mb-1">{p.title}</h3>
                      <p className="text-sm text-text-muted leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-brand rounded-3xl px-8 py-12 sm:px-14 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to access the system?</h2>
              <p className="text-white/70 mt-2">Sign in to manage batches, QR codes, and dispatch intelligence.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-7 py-3 bg-white text-brand font-bold rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
              >
                Sign In
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-7 py-3 bg-white/15 text-white font-semibold rounded-xl hover:bg-white/25 transition-all duration-200 border border-white/20"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
