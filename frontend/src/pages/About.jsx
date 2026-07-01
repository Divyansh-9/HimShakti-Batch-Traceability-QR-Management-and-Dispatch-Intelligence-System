import { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Package, MapPin, Users, FileText, Leaf,
  Factory, Store, UserCheck, Sprout,
  Eye, Bot, Clock, Scan, BadgeCheck, BarChart3,
  QrCode, Truck, ChevronDown
} from 'lucide-react';


// ─── Hooks ───────────────────────────────────────────────────

/** Fires callback once when element enters viewport */
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/** Counts from 0 to target when triggered */
function useCountUp(target, duration = 1400, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const isFloat = String(target).includes('.');
    const numTarget = parseFloat(target);
    const step = numTarget / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, numTarget);
      setCount(isFloat ? start.toFixed(1) : Math.floor(start));
      if (start >= numTarget) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return count;
}

// ─── Animated Section Wrapper ─────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Stat Counter Card ────────────────────────────────────────
function StatCard({ icon: Icon, value, suffix = '', label, color, active }) {
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  const count = useCountUp(numericValue, 1200, active);
  const displayValue = typeof value === 'string' && value.includes('+')
    ? `${count}+` : value.includes('%') ? `${count}%` : count;

  return (
    <div className={`bg-surface border border-border rounded-2xl p-4 sm:p-6 flex flex-col gap-2 sm:gap-3 hover:shadow-md transition-shadow duration-300`}>
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      {/* text-2xl on 320px prevents "Uttarakhand" overflowing card bounds */}
      <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tabular-nums break-words leading-tight">
        {active ? displayValue : '—'}
      </p>
      <p className="text-xs sm:text-sm text-text-muted leading-tight">{label}</p>
    </div>
  );
}

// ─── Supply Chain ─────────────────────────────────────────────
const SUPPLY_CHAIN = [
  { icon: Sprout, label: 'Farm',       sub: 'Farmers harvest raw produce',          color: 'bg-green-500',  border: 'border-green-500/30' },
  { icon: Factory, label: 'Processing', sub: 'HimShakti packs and codes each batch', color: 'bg-brand',      border: 'border-brand/30' },
  { icon: QrCode,  label: 'QR & Track', sub: 'Expiry calculated, AI advisory runs',  color: 'bg-blue-500',   border: 'border-blue-500/30' },
  { icon: Truck,   label: 'Dispatch',   sub: 'FEFO queue dictates dispatch order',   color: 'bg-amber-500',  border: 'border-amber-500/30' },
  { icon: Store,   label: 'Retail',     sub: 'Buyer scans QR — origin verified',     color: 'bg-purple-500', border: 'border-purple-500/30' },
];

// ─── Who We Serve — Tab Design ─────────────────────────────────
const PERSONAS = [
  {
    id: 'manager',
    icon: Factory,
    color: 'text-brand',
    bg: 'bg-brand/10',
    activeBg: 'bg-brand',
    role: 'Factory Managers',
    headline: 'Command your warehouse with intelligence',
    description: 'The primary users of this platform. Managers create and track every batch from production to dispatch, run AI-powered audits, and download QR codes — all from a single, live dashboard.',
    gets: [
      'Live batch dashboard with 60s auto-refresh',
      'Gemini AI dispatch recommendations',
      'FEFO priority queue sorted by expiry urgency',
      'One-click QR code generation and download',
      'Scan analytics per batch',
    ],
  },
  {
    id: 'buyer',
    icon: Store,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    activeBg: 'bg-blue-500',
    role: 'Buyers & Retailers',
    headline: 'Verify what you receive before it hits the shelf',
    description: 'Distributors and retail partners who receive HimShakti shipments can scan the QR on any batch to instantly see the full origin story — no app download, no login required.',
    gets: [
      'Instant QR scan — no app needed',
      'Pack date, expiry, and freshness status',
      'Farmer name and village of origin',
      'Authenticity verification at point of receipt',
    ],
  },
  {
    id: 'farmer',
    icon: Sprout,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    activeBg: 'bg-green-500',
    role: 'Farmer Partners',
    headline: 'Your harvest, your identity — preserved forever',
    description: 'HimShakti partners with 15+ farming families across Uttarakhand. Every batch they contribute to permanently carries their name, village, and harvest details — right to the consumer.',
    gets: [
      'Name and village embedded in every batch',
      'Identity visible to every buyer who scans',
      'Transparent, fair attribution in the supply chain',
      'Digital record of harvest and yield',
    ],
  },
  {
    id: 'compliance',
    icon: UserCheck,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    activeBg: 'bg-amber-500',
    role: 'Compliance Teams',
    headline: 'FSSAI audits in minutes, not days',
    description: 'Quality inspectors and FSSAI auditors get an immutable, date-stamped record of every batch — its status, dispatch date, buyer, and traceability trail — always ready for review.',
    gets: [
      'Immutable batch creation and dispatch logs',
      'Expiry and status audit trail',
      'Batch-level traceability at a glance',
      'No manual records to compile or reconcile',
    ],
  },
];

// ─── Value Props ──────────────────────────────────────────────
const VALUE_PROPS = [
  { icon: Eye,       title: 'Full Visibility',        desc: 'Know exactly where every batch is — warehouse, in transit, or approaching expiry — without spreadsheets or guesswork.' },
  { icon: Bot,       title: 'AI-Powered Decisions',   desc: 'Google Gemini 2.5 Flash analyses live inventory and tells you which batch to dispatch next and why — every single day.' },
  { icon: Clock,     title: 'Zero Waste Philosophy',  desc: 'FEFO logic ensures the right batch always leaves first. Products reach buyers fresher, reducing returns and losses.' },
  { icon: Scan,      title: 'Consumer Trust at Scan', desc: 'Every QR gives buyers verified facts — not marketing. Farmer name, pack date, expiry — one scan, full transparency.' },
  { icon: BadgeCheck, title: 'Audit-Ready Always',    desc: 'Every batch event is timestamped and logged. FSSAI inspections become a 5-minute exercise, not a 5-day scramble.' },
  { icon: BarChart3,  title: 'Intelligent Operations', desc: 'Real-time KPIs, scan analytics, and AI reports replace manual stocktaking and gut-feel dispatch decisions.' },
];

// ─── Main Page ────────────────────────────────────────────────
export default function About() {
  const [activePersona, setActivePersona] = useState('manager');
  const [statsRef, statsInView] = useInView();
  const [chainRef, chainInView] = useInView();

  const persona = PERSONAS.find(p => p.id === activePersona);
  const PersonaIcon = persona.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Navbar />

      {/* overflow-x-hidden prevents any negative-margin or transform bleed on Android Chrome */}
      <main className="flex-grow w-full overflow-x-hidden">

        {/* ══════════════════════════════════════════
            HERO — Full bleed image with parallax feel
        ══════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src="/about-hero.png"
              alt="HimShakti farmer with organic produce in Uttarakhand"
              className="w-full h-full object-cover object-center scale-105"
              style={{ willChange: 'transform' }}
            />
            {/* Dark gradient overlay — heavier on left for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 border border-white/20">
                <Leaf className="w-3.5 h-3.5 text-green-400" />
                About HimShakti Traceability
              </div>
            </Reveal>
            <Reveal delay={100}>
              {/* text-3xl on 320px Galaxy S8 → text-4xl 390px → text-5xl sm → text-6xl lg */}
              {/* break-words prevents long words overflowing past padding on any viewport */}
              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-3xl break-words">
                Bringing trust and transparency to every
                <span className="text-brand"> Himalayan harvest</span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
                Every jar that leaves HimShakti carries a verifiable identity — from the farmer's name to the pack date. This platform makes that traceability possible, auditable, and automatic.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-brand/30">
                  Access the Platform <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#mission" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-sm">
                  Learn More <ChevronDown className="w-4 h-4" />
                </a>
              </div>
            </Reveal>
          </div>

          {/* Bottom fade into page background */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* ══════════════════════════════════════════
            MISSION
        ══════════════════════════════════════════ */}
        <section id="mission" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div>
                <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-3">Our Mission</p>
                <h2 className="text-3xl font-extrabold text-text-primary mb-5 leading-tight">
                  Closing the trust gap between the farm and the consumer
                </h2>
                <p className="text-text-muted leading-relaxed mb-4">
                  India's organic food sector faces a critical credibility problem. Buyers cannot verify what they're purchasing is truly organic, traceable, or safe. Farmers go unrecognised even when their produce reaches premium retail shelves.
                </p>
                <p className="text-text-muted leading-relaxed">
                  HimShakti Traceability fixes this at the source. Every batch carries the farmer's name, the village, pack date, processed quantity, and calculated shelf life. That data travels with the product — and is accessible to anyone with a QR scanner.
                </p>
              </div>
            </Reveal>

            {/* Animated stat cards */}
            <div ref={statsRef} className="grid grid-cols-2 gap-4">
              {[
                { icon: MapPin,   color: 'bg-brand/10 text-brand',          value: 'Uttarakhand', label: 'Region of Operation'  },
                { icon: Users,    color: 'bg-green-500/10 text-green-500',  value: '15+',         label: 'Farmer Partners'      },
                { icon: Package,  color: 'bg-blue-500/10 text-blue-500',    value: '8',           label: 'Product Categories'   },
                { icon: FileText, color: 'bg-amber-500/10 text-amber-500',  value: '100%',        label: 'Batches Traceable'    },
              ].map((s, i) => (
                <Reveal key={s.label} delay={i * 80}>
                  {/* text-2xl on mobile prevents 320px overflow for long strings like "Uttarakhand" */}
                  <StatCard {...s} active={statsInView} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SUPPLY CHAIN — animated on scroll
        ══════════════════════════════════════════ */}
        <section className="border-t border-b border-border bg-surface py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-12">
              <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">The Chain</p>
              <h2 className="text-2xl font-extrabold text-text-primary">Our Role in the Supply Chain</h2>
              <p className="mt-2 text-text-muted max-w-xl mx-auto text-sm">Every step tracked, timestamped, and traceable.</p>
            </Reveal>

            {/* On mobile: vertical stack with ChevronDown between steps
                On sm+:   horizontal row with ArrowRight between steps */}
            <div ref={chainRef} className="flex flex-col sm:flex-row items-stretch gap-0">
              {SUPPLY_CHAIN.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex sm:items-center flex-col sm:flex-row flex-1">
                    <div
                      className={`flex-1 bg-background border ${s.border} rounded-2xl p-4 sm:p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default`}
                      style={{
                        opacity: chainInView ? 1 : 0,
                        transform: chainInView ? 'translateY(0)' : 'translateY(20px)',
                        transition: `opacity 0.5s ease ${idx * 120}ms, transform 0.5s ease ${idx * 120}ms, box-shadow 0.2s, translate 0.2s`,
                      }}
                    >
                      <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${s.color} inline-block mb-1`}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <p className="font-bold text-text-primary text-sm">{s.label}</p>
                        <p className="text-xs text-text-muted leading-relaxed mt-1">{s.sub}</p>
                      </div>
                    </div>
                    {idx < SUPPLY_CHAIN.length - 1 && (
                      <div
                        className="flex-shrink-0 flex sm:px-2 sm:py-0 py-2 justify-center"
                        style={{
                          opacity: chainInView ? 1 : 0,
                          transition: `opacity 0.4s ease ${idx * 120 + 200}ms`,
                        }}
                      >
                        {/* ArrowRight on desktop, ChevronDown on mobile (vertical stack) */}
                        <ArrowRight className="hidden sm:block w-4 h-4 text-text-muted opacity-40" />
                        <ChevronDown className="block sm:hidden w-4 h-4 text-text-muted opacity-40" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            WHO WE SERVE — Interactive tabs
        ══════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">Stakeholders</p>
            <h2 className="text-3xl font-extrabold text-text-primary">Who We Serve</h2>
            <p className="mt-3 text-text-muted max-w-xl mx-auto">
              Click a stakeholder to see their specific role and what they gain from this platform.
            </p>
          </Reveal>

          <Reveal>
            {/* Tab selector — min-h-[44px] ensures WCAG 2.5.5 touch target on mobile */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {PERSONAS.map(p => {
                const Icon = p.icon;
                const isActive = p.id === activePersona;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePersona(p.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                      isActive
                        ? `${p.activeBg} text-white border-transparent shadow-md`
                        : `bg-surface border-border text-text-muted hover:text-text-primary hover:border-border`
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="leading-tight">{p.role}</span>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            <div
              key={activePersona}
              className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm"
              style={{ animation: 'fadeSlideIn 0.3s ease' }}
            >
              <style>{`
                @keyframes fadeSlideIn {
                  from { opacity: 0; transform: translateY(12px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left — responsive padding: tight on 320px, comfortable on desktop */}
                <div className="p-5 sm:p-8 lg:p-10">
                  <div className={`w-12 h-12 ${persona.bg} rounded-2xl flex items-center justify-center mb-5`}>
                    <PersonaIcon className={`w-6 h-6 ${persona.color}`} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary mb-2">{persona.role}</h3>
                  <p className={`text-sm font-semibold mb-4 ${persona.color}`}>{persona.headline}</p>
                  <p className="text-text-muted leading-relaxed">{persona.description}</p>
                </div>

                {/* Right — what they get */}
                <div className={`p-5 sm:p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-border ${persona.bg} bg-opacity-30`}>
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5">What they get</p>
                  <ul className="space-y-3">
                    {persona.gets.map((g, i) => (
                      <li
                        key={g}
                        className="flex items-start gap-3 text-sm text-text-muted"
                        style={{ animation: `fadeSlideIn 0.3s ease ${i * 60}ms both` }}
                      >
                        <span className={`w-5 h-5 rounded-full ${persona.activeBg} text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold`}>
                          {i + 1}
                        </span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══════════════════════════════════════════
            WHAT YOU GET — Staggered cards
        ══════════════════════════════════════════ */}
        <section className="border-t border-border bg-surface py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-12">
              <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">Value Delivered</p>
              <h2 className="text-3xl font-extrabold text-text-primary">What You Get Out of It</h2>
              <p className="mt-3 text-text-muted max-w-xl mx-auto">Concrete, measurable outcomes — not just a feature list.</p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {VALUE_PROPS.map((v, i) => {
                const Icon = v.icon;
                return (
                  <Reveal key={v.title} delay={i * 70}>
                    <div className="group bg-background border border-border rounded-2xl p-6 hover:border-brand/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full cursor-default">
                      <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-text-primary mb-2">{v.title}</h3>
                      <p className="text-sm text-text-muted leading-relaxed">{v.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            CTA BANNER
        ══════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Reveal>
            <div className="relative bg-brand rounded-3xl px-6 py-12 sm:px-14 sm:py-14 flex flex-col sm:flex-row items-center justify-between gap-8 overflow-hidden">
              {/* Decorative bg circles */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
              <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />

              <div className="relative text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to get started?</h2>
                <p className="text-white/70 mt-2 max-w-md">
                  Sign in to manage batches, generate QR codes, and run AI-powered dispatch audits for HimShakti's organic supply chain.
                </p>
              </div>
              {/* w-full on mobile so buttons don't fight flex-shrink-0 in column mode */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-shrink-0 relative">
                <Link to="/login" className="inline-flex items-center justify-center px-7 py-3.5 min-h-[44px] bg-white text-brand font-bold rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg hover:-translate-y-0.5 w-full sm:w-auto">
                  Sign In
                </Link>
                <Link to="/" className="inline-flex items-center justify-center px-7 py-3.5 min-h-[44px] bg-white/15 text-white font-semibold rounded-xl hover:bg-white/25 transition-all duration-200 border border-white/20 w-full sm:w-auto">
                  Back to Home
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

      </main>

      <Footer />
    </div>
  );
}
