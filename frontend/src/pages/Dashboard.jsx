import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CreateBatchModal from '../components/CreateBatchModal';
import DispatchModal from '../components/DispatchModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { useBatches } from '../hooks/useBatches';
import { useDispatch } from '../hooks/useDispatch';
import { useAIAudit } from '../hooks/useAIAudit';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';
import client from '../api/client';
import {
  Package, Truck, QrCode, LayoutDashboard, Bot,
  LogOut, Download, AlertTriangle, CheckCircle, Clock, RefreshCw, Menu, Search, Leaf, Plus,
  ShieldCheck, Users, XCircle, Copy, ExternalLink, Zap, TrendingUp, Activity, Info
} from 'lucide-react';


// ── Tab metadata ───────────────────────────────────────────────────
const TAB_META = {
  overview: {
    wash:        'bg-amber-500/[0.03]',
    border:      'border-amber-400/25',
    accentBar:   'bg-amber-500',
    accentText:  'text-amber-600',
    accentLight: 'text-amber-300',
    accentIcon:  'text-amber-400',
    image:       '/home-hero.png',
    icon:        LayoutDashboard,
    eyebrow:     'Operations Centre',
    title:       'Batch Overview',
    desc:        'Live snapshot of all active, dispatched and expiring batches across your inventory.',
    dot:         'bg-amber-500',
    mainTint:    'bg-amber-500/[0.015]',
  },
  batches: {
    wash:        'bg-emerald-500/[0.03]',
    border:      'border-emerald-400/25',
    accentBar:   'bg-emerald-500',
    accentText:  'text-emerald-700',
    accentLight: 'text-emerald-300',
    accentIcon:  'text-emerald-400',
    image:       '/warehouse-bg.png',
    icon:        Package,
    eyebrow:     'Inventory Management',
    title:       'Batch Registry',
    desc:        'Create, track, and manage every batch — wild berry products, natural salts, fruit preserves, and more.',
    dot:         'bg-emerald-500',
    mainTint:    'bg-emerald-500/[0.015]',
  },
  fefo: {
    wash:        'bg-red-500/[0.03]',
    border:      'border-red-400/25',
    accentBar:   'bg-red-500',
    accentText:  'text-red-700',
    accentLight: 'text-red-300',
    accentIcon:  'text-red-400',
    image:       '/fefo-bg.png',
    icon:        Truck,
    eyebrow:     'Dispatch Priority',
    title:       'FEFO Queue',
    desc:        'First Expired, First Out — batches sorted by expiry urgency. The item at the top ships today.',
    dot:         'bg-red-500',
    mainTint:    'bg-red-500/[0.015]',
  },
  qr: {
    wash:        'bg-blue-500/[0.03]',
    border:      'border-blue-400/25',
    accentBar:   'bg-blue-500',
    accentText:  'text-blue-700',
    accentLight: 'text-blue-300',
    accentIcon:  'text-blue-400',
    image:       '/qr-bg.png',
    icon:        QrCode,
    eyebrow:     'Traceability Layer',
    title:       'QR Code Centre',
    desc:        'Auto-generated QR codes link every batch to a consumer-facing trace page. Scannable by any smartphone.',
    dot:         'bg-blue-500',
    mainTint:    'bg-blue-500/[0.015]',
  },
  ai: {
    wash:        'bg-teal-500/[0.03]',
    border:      'border-teal-400/25',
    accentBar:   'bg-teal-500',
    accentText:  'text-teal-700',
    accentLight: 'text-teal-300',
    accentIcon:  'text-teal-400',
    image:       '/about-hero.png',
    icon:        Bot,
    eyebrow:     'Intelligence Layer',
    title:       'AI Dispatch Audit',
    desc:        'Gemini 2.5 Flash analyses live inventory and recommends exact dispatch order, risk flags, and notes. Cached 4 hours.',
    dot:         'bg-teal-500',
    mainTint:    'bg-teal-500/[0.015]',
  },
  admin: {
    wash:        'bg-rose-500/[0.03]',
    border:      'border-rose-400/25',
    accentBar:   'bg-rose-500',
    accentText:  'text-rose-700',
    accentLight: 'text-rose-300',
    accentIcon:  'text-rose-400',
    image:       '/home-hero.png',
    icon:        ShieldCheck,
    eyebrow:     'System Administration',
    title:       'Admin Panel',
    desc:        'User roster, role assignments, and access request management. Full visibility into who can access what.',
    dot:         'bg-rose-500',
    mainTint:    'bg-rose-500/[0.015]',
  },
};

// ── Full-bleed tab hero banner ──────────────────────────────────────
function TabBanner({ tabId, action }) {
  const m = TAB_META[tabId];
  if (!m) return null;
  return (
    // Negative margins break out of main's p-4/p-6 padding — true full-bleed
    <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-6 relative overflow-hidden" style={{ height: 176 }}>
      {/* Photography layer */}
      <img
        src={m.image} alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ opacity: 0.32 }}
      />
      {/* Left-heavy dark gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/15" />
      {/* Top-to-bottom subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      {/* Bottom fade — blends into content area below */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-background/80 to-transparent" />

      {/* Left colored accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${m.accentBar} z-10`} />

      {/* Content — pinned to bottom-left */}
      <div className="absolute inset-0 flex items-end z-10">
        <div className="w-full px-6 sm:px-8 pb-5 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${m.accentBar} animate-pulse`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${m.accentLight}`}>{m.eyebrow}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight drop-shadow-md">{m.title}</h2>
            <p className="text-sm text-white/65 mt-0.5 max-w-md leading-relaxed drop-shadow-sm hidden sm:block">{m.desc}</p>
          </div>
          {action && <div className="flex-shrink-0 ml-6 mb-0.5">{action}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Animated count-up stat ─────────────────────────────────────────
function AnimatedStat({ value }) {
  const num = typeof value === 'number' ? value : NaN;
  const [count, setCount] = useState(isNaN(num) ? value : 0);
  useEffect(() => {
    if (isNaN(num)) { setCount(value); return; }
    setCount(0);
    const start = Date.now();
    const dur = 900;
    function tick() {
      const p = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * num));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [num, value]);
  return <>{count}</>;
}


// ── Status helpers ──────────────────────────────────────────
const STATUS_CONFIG = {
  URGENT:     { label: 'URGENT',     cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
  WARNING:    { label: 'WARNING',    cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  READY:      { label: 'READY',      cls: 'bg-green-500/10 text-green-500 border-green-500/20' },
  DISPATCHED: { label: 'DISPATCHED', cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-surface-2 text-text-muted border-border' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-surface-2 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ── Tab: Overview ───────────────────────────────────────────
function OverviewTab({ batches, loading, onTabSwitch }) {
  const total      = batches.length;
  const dispatched = batches.filter(b => b.status === 'DISPATCHED').length;
  const urgent     = batches.filter(b => b.status === 'URGENT').length;
  const warning    = batches.filter(b => b.status === 'WARNING').length;
  const ready      = batches.filter(b => b.status === 'READY').length;
  const active     = batches.filter(b => b.status !== 'DISPATCHED').length;

  // Main KPI cards
  const kpis = [
    { label: 'Total Batches',  value: total,      icon: Package,       color: 'text-brand',     bg: 'bg-brand/5',      bar: 'bg-brand',      border: 'border-l-4 border-brand',      sub: 'across all product lines' },
    { label: 'Active Stock',   value: active,     icon: Leaf,          color: 'text-green-500', bg: 'bg-green-500/5',  bar: 'bg-green-500',  border: 'border-l-4 border-green-500',  sub: 'batches in warehouse' },
    { label: 'Dispatched',     value: dispatched, icon: Truck,         color: 'text-blue-500',  bg: 'bg-blue-500/5',   bar: 'bg-blue-500',   border: 'border-l-4 border-blue-500',   sub: 'shipments completed' },
    { label: 'Need Attention', value: urgent + warning, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5', bar: 'bg-amber-500', border: 'border-l-4 border-amber-500', sub: 'urgent or warning status' },
  ];

  // Status breakdown — clickable, navigates to filtered batches
  const STATUS_PILLS = [
    { status: 'URGENT',  count: urgent,  label: 'Urgent',  cls: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',    dot: 'bg-red-500' },
    { status: 'WARNING', count: warning, label: 'Warning', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20', dot: 'bg-amber-500' },
    { status: 'READY',   count: ready,   label: 'Ready',   cls: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',  dot: 'bg-green-500' },
    { status: 'DISPATCHED', count: dispatched, label: 'Dispatched', cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20', dot: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-surface border border-border rounded-xl p-5 ${kpi.border} hover:shadow-md transition-all duration-200 cursor-default`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">{kpi.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            {loading
              ? <div className="h-9 w-16 bg-surface-2 rounded animate-pulse" />
              : <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                  <AnimatedStat value={kpi.value} />
                </p>
            }
            <p className="text-xs text-text-muted mt-1.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown — jump to batches filtered by status */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Status Breakdown</p>
          <button onClick={() => onTabSwitch('batches')}
            className="text-xs text-brand hover:text-brand-hover font-semibold transition-colors">View all batches →</button>
        </div>
        {loading ? (
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-surface-2 rounded-lg flex-1 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="flex h-2 rounded-full overflow-hidden mb-3 gap-0.5">
              {STATUS_PILLS.map(p => p.count > 0 && (
                <div key={p.status} className={`${p.dot} transition-all duration-700`}
                  style={{ width: `${(p.count / total) * 100}%`, minWidth: p.count > 0 ? 4 : 0 }} />
              ))}
            </div>
            {/* Clickable pills */}
            <div className="flex flex-wrap gap-2">
              {STATUS_PILLS.map(p => (
                <button key={p.status}
                  onClick={() => onTabSwitch('batches', p.status)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${p.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  {p.label}
                  <span className="font-black ml-0.5">{p.count}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Recent batches table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Recent Batches</h2>
          <button onClick={() => onTabSwitch('batches')}
            className="text-xs text-brand hover:text-brand-hover font-semibold transition-colors">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-2">
              <tr>
                {['Batch Code', 'Product', 'Status', 'Days to Expiry', 'Farmer'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                : batches.slice(0, 8).map(b => (
                  <tr key={b._id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-brand">{b.batchCode}</td>
                    <td className="px-6 py-4 text-sm text-text-muted">{b.productName}</td>
                    <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                    <td className="px-6 py-4 text-sm text-text-muted">{b.daysUntilExpiry ?? '—'} days</td>
                    <td className="px-6 py-4 text-sm text-text-muted">{b.farmerName}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Batches (full table + status filter + sort) ────────
function BatchesTab({ batches, loading, onNewBatch, onDownloadQR, onDispatch, initialFilter = 'all' }) {
  const [scanInfo, setScanInfo]       = useState({});
  const [loadingScans, setLoadingScans] = useState({});
  const [query, setQuery]             = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [sortBy, setSortBy]           = useState('expiry');
  const { getBatchScans }             = useBatches();

  // Sync initialFilter if parent changes it (e.g. clicking from Overview)
  useEffect(() => { setStatusFilter(initialFilter); }, [initialFilter]);

  async function handleViewScans(batchId) {
    if (scanInfo[batchId]) return;
    setLoadingScans(p => ({ ...p, [batchId]: true }));
    try {
      const data = await getBatchScans(batchId);
      setScanInfo(p => ({ ...p, [batchId]: data }));
    } catch { /* silently fail */ } finally {
      setLoadingScans(p => ({ ...p, [batchId]: false }));
    }
  }

  const STATUS_FILTERS = [
    { id: 'all',        label: 'All',        count: batches.length },
    { id: 'URGENT',     label: 'Urgent',     count: batches.filter(b => b.status === 'URGENT').length },
    { id: 'WARNING',    label: 'Warning',    count: batches.filter(b => b.status === 'WARNING').length },
    { id: 'READY',      label: 'Ready',      count: batches.filter(b => b.status === 'READY').length },
    { id: 'DISPATCHED', label: 'Dispatched', count: batches.filter(b => b.status === 'DISPATCHED').length },
  ];

  const FILTER_ACCENT = {
    URGENT:     'text-red-500',
    WARNING:    'text-amber-500',
    READY:      'text-green-500',
    DISPATCHED: 'text-blue-500',
    all:        'text-brand',
  };

  const SORT_OPTIONS = [
    { id: 'expiry',  label: 'Expiry (soonest)' },
    { id: 'code',    label: 'Batch Code (A→Z)' },
    { id: 'product', label: 'Product (A→Z)' },
    { id: 'status',  label: 'Status' },
  ];

  function sortBatches(list) {
    return [...list].sort((a, b) => {
      if (sortBy === 'expiry')  return (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999);
      if (sortBy === 'code')    return (a.batchCode || '').localeCompare(b.batchCode || '');
      if (sortBy === 'product') return (a.productName || '').localeCompare(b.productName || '');
      if (sortBy === 'status')  {
        const ORDER = { URGENT: 0, WARNING: 1, READY: 2, DISPATCHED: 3 };
        return (ORDER[a.status] ?? 4) - (ORDER[b.status] ?? 4);
      }
      return 0;
    });
  }

  const filtered = sortBatches(
    batches.filter(b =>
      (statusFilter === 'all' || b.status === statusFilter) &&
      (!query ||
        b.batchCode?.toLowerCase().includes(query.toLowerCase()) ||
        b.productName?.toLowerCase().includes(query.toLowerCase()) ||
        b.farmerName?.toLowerCase().includes(query.toLowerCase()))
    )
  );

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* ── Command bar ── */}
      <div className="px-4 pt-4 pb-0 border-b border-border">
        {/* Row 1: search + new batch + sort */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by code, product, farmer…"
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="py-2 pl-3 pr-8 bg-surface border border-border rounded-lg text-xs font-medium text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 cursor-pointer appearance-none">
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button onClick={onNewBatch}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Batch
            </button>
          </div>
        </div>

        {/* Row 2: status filter tabs */}
        <div className="flex gap-0 overflow-x-auto">
          {STATUS_FILTERS.map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                statusFilter === f.id
                  ? `border-brand ${FILTER_ACCENT[f.id] || 'text-brand'}`
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
              }`}>
              {f.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                statusFilter === f.id ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-text-muted'
              }`}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-2">
            <tr>
              {['Batch Code', 'Product', 'Status', 'Expiry', 'Farmer / Village', 'Scans', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-text-muted opacity-40" />
                        </div>
                        <p className="text-text-muted text-sm font-medium">
                          {query ? `No batches match "${query}"` : `No ${statusFilter === 'all' ? '' : statusFilter.toLowerCase() + ' '}batches`}
                        </p>
                        {(query || statusFilter !== 'all') && (
                          <button onClick={() => { setQuery(''); setStatusFilter('all'); }}
                            className="text-xs text-brand hover:text-brand-hover font-medium">Clear filters</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
                : filtered.map(b => (
                <tr key={b._id} className="hover:bg-surface-2 transition-colors group" onMouseEnter={() => handleViewScans(b._id)}>
                  <td className="px-4 py-4 text-sm font-mono font-medium text-brand">{b.batchCode}</td>
                  <td className="px-4 py-4 text-sm text-text-muted">{b.productName}</td>
                  <td className="px-4 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-text-muted">{b.daysUntilExpiry ?? '—'} days</span>
                      {b.daysUntilExpiry !== null && b.daysUntilExpiry <= 30 && (
                        <div className="h-1 w-16 bg-surface-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            b.daysUntilExpiry <= 7 ? 'bg-red-500' : 'bg-amber-500'
                          }`} style={{ width: `${Math.min(100, (b.daysUntilExpiry / 30) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-muted">{b.farmerName}, {b.village}</td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {loadingScans[b._id] ? '…' : scanInfo[b._id] ? `${scanInfo[b._id].totalScans} scans` : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onDownloadQR(b._id, b.batchCode)} title="Download QR"
                        className="p-1.5 text-text-muted hover:text-brand hover:bg-brand/10 rounded-md transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      {b.status !== 'DISPATCHED' && (
                        <button onClick={() => onDispatch(b)} title="Mark Dispatched"
                          className="p-1.5 text-text-muted hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors">
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Row count footer */}
      {!loading && filtered.length > 0 && (
        <div className="px-6 py-3 border-t border-border bg-surface-2">
          <p className="text-xs text-text-muted">
            Showing <span className="font-semibold text-text-primary">{filtered.length}</span> of <span className="font-semibold text-text-primary">{batches.length}</span> batches
            {statusFilter !== 'all' && <> · filtered by <span className="font-semibold capitalize">{statusFilter.toLowerCase()}</span></>}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Tab: FEFO Dispatch Queue ─────────────────────────────────
function FEFOTab() {
  const { queue, loading, error, refetch } = useDispatch();
  const [filter, setFilter] = useState('all');

  const FEFO_FILTERS = [
    { id: 'all',     label: 'All',     count: queue.length },
    { id: 'URGENT',  label: 'Urgent',  count: queue.filter(b => b.status === 'URGENT').length },
    { id: 'WARNING', label: 'Warning', count: queue.filter(b => b.status === 'WARNING').length },
    { id: 'READY',   label: 'Ready',   count: queue.filter(b => b.status === 'READY').length },
  ];

  const FILTER_ACCENT = { URGENT: 'text-red-500', WARNING: 'text-amber-500', READY: 'text-green-500', all: 'text-brand' };

  const visible = queue.filter(b => filter === 'all' || b.status === filter);

  // Max days for urgency bar scaling
  const maxDays = Math.max(...queue.map(b => b.daysUntilExpiry ?? 1), 1);

  function urgencyBar(daysLeft) {
    if (daysLeft === null || daysLeft === undefined) return null;
    const pct = Math.max(0, Math.min(100, (daysLeft / maxDays) * 100));
    const color = daysLeft <= 7 ? 'bg-red-500' : daysLeft <= 30 ? 'bg-amber-500' : 'bg-green-500';
    return (
      <div className="w-20 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">FEFO Dispatch Priority Queue</h2>
            <p className="text-xs text-text-muted mt-0.5">First Expired → First Out · Dispatch from top</p>
          </div>
          <button onClick={refetch} className="p-1.5 text-text-muted hover:text-brand rounded-md transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 overflow-x-auto -mb-px">
          {FEFO_FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                filter === f.id
                  ? `border-brand ${FILTER_ACCENT[f.id] || 'text-brand'}`
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}>
              {f.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                filter === f.id ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-text-muted'
              }`}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 text-red-400 text-sm">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-2">
            <tr>
              {['Priority', 'Batch Code', 'Product', 'Status', 'Days Left', 'Urgency', 'Score'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
              : visible.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="w-8 h-8 text-text-muted opacity-30" />
                        <p className="text-sm text-text-muted">No {filter === 'all' ? '' : filter.toLowerCase() + ' '}batches in queue</p>
                        {filter !== 'all' && <button onClick={() => setFilter('all')} className="text-xs text-brand hover:text-brand-hover">Clear filter</button>}
                      </div>
                    </td>
                  </tr>
                )
                : visible.map((b, idx) => (
                <tr key={b._id} className={`hover:bg-surface-2 transition-colors ${
                  b.status === 'URGENT' ? 'bg-red-500/[0.02]' : ''
                }`}>
                  <td className="px-5 py-4">
                    <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-black ${
                      idx === 0 ? 'bg-brand text-white' :
                      idx === 1 ? 'bg-surface-2 text-text-primary' :
                                  'text-text-muted font-bold'
                    }`}>#{idx + 1}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-mono font-medium text-brand">{b.batchCode}</td>
                  <td className="px-5 py-4 text-sm text-text-muted">{b.productName}</td>
                  <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-5 py-4 text-sm font-semibold text-text-primary">{b.daysUntilExpiry ?? '—'}</td>
                  <td className="px-5 py-4">{urgencyBar(b.daysUntilExpiry)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-text-primary">{b.priorityScore?.toFixed(1)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {!loading && visible.length > 0 && (
        <div className="px-6 py-3 border-t border-border bg-surface-2">
          <p className="text-xs text-text-muted">
            {visible.length} batch{visible.length !== 1 ? 'es' : ''} in queue
            {filter !== 'all' && <> · filtered by <span className="font-semibold capitalize">{filter.toLowerCase()}</span></>}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Tab: QR Code Centre — premium redesign ──────────────────────
function QRCard({ batch, onDownloadQR }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError,   setQrError]   = useState(false);
  const [scanCount, setScanCount] = useState(null);
  const [copied,    setCopied]    = useState(false);
  const { getBatchScans } = useBatches();

  const traceUrl = `${window.location.origin}/trace/${batch.batchCode}`;

  // Lazy-load QR on mount using the lightweight /api/batches/:id/qr endpoint
  useEffect(() => {
    let cancelled = false;
    setQrLoading(true);
    client(`/api/batches/${batch._id}/qr`)
      .then(data => {
        if (!cancelled) setQrDataUrl(data.data?.qrCodeDataUrl || null);
      })
      .catch(() => { if (!cancelled) setQrError(true); })
      .finally(() => { if (!cancelled) setQrLoading(false); });

    // Also fetch scan count
    getBatchScans(batch._id)
      .then(data => { if (!cancelled) setScanCount(data?.totalScans ?? 0); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [batch._id]);

  function handleCopy() {
    navigator.clipboard.writeText(traceUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const STATUS_ACCENT = {
    URGENT:  'border-red-500/40 shadow-red-500/10',
    WARNING: 'border-amber-500/40 shadow-amber-500/10',
    READY:   'border-green-500/20',
  };

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 group ${STATUS_ACCENT[batch.status] || 'border-border'}`}>
      {/* QR image area */}
      <div className="relative bg-white flex items-center justify-center" style={{ minHeight: 180 }}>
        {qrLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
          </div>
        )}
        {qrError && !qrLoading && (
          <div className="flex flex-col items-center gap-2 py-8 opacity-50">
            <QrCode className="w-8 h-8 text-text-muted" />
            <p className="text-xs text-text-muted">QR unavailable</p>
          </div>
        )}
        {qrDataUrl && !qrLoading && (
          <img
            src={qrDataUrl}
            alt={`QR code for batch ${batch.batchCode}`}
            className="w-44 h-44 object-contain p-3"
          />
        )}

        {/* Scan count badge */}
        {scanCount !== null && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
            <Activity className="w-3 h-3" />
            {scanCount} scan{scanCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={batch.status} />
        </div>

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={handleCopy}
            title="Copy trace link"
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors text-white"
          >
            {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>
          <button
            onClick={() => window.open(`/trace/${batch.batchCode}`, '_blank')}
            title="Open trace page"
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors text-white"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDownloadQR(batch._id, batch.batchCode)}
            title="Download QR"
            className="w-10 h-10 bg-brand/80 hover:bg-brand rounded-xl flex items-center justify-center transition-colors text-white"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs font-mono font-bold text-text-primary truncate">{batch.batchCode}</p>
        <p className="text-[11px] text-text-muted truncate mt-0.5">{batch.productName}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <p className="text-[10px] text-text-muted/60 truncate flex-1">{batch.farmerName} · {batch.village}</p>
          <button
            onClick={() => onDownloadQR(batch._id, batch.batchCode)}
            className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-brand hover:text-brand-hover transition-colors"
          >
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}

function QRTab({ batches, loading, onDownloadQR }) {
  const [filter, setFilter] = useState('all');

  const FILTERS = [
    { id: 'all',      label: 'All',      count: batches.filter(b => b.status !== 'DISPATCHED').length },
    { id: 'URGENT',   label: 'Urgent',   count: batches.filter(b => b.status === 'URGENT').length },
    { id: 'WARNING',  label: 'Warning',  count: batches.filter(b => b.status === 'WARNING').length },
    { id: 'READY',    label: 'Ready',    count: batches.filter(b => b.status === 'READY').length },
  ];

  const visible = batches.filter(b =>
    b.status !== 'DISPATCHED' &&
    (filter === 'all' || b.status === filter)
  );

  return (
    <div className="space-y-4">
      {/* Filter tabs + print button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-surface-2 border border-border p-1 rounded-xl w-fit">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-surface shadow text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}>
              {f.label}
              {f.count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  filter === f.id ? 'bg-brand/10 text-brand' : 'bg-surface text-text-muted'
                }`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors print:hidden"
        >
          <Download className="w-4 h-4" /> Print Sheet
        </button>
      </div>

      {/* QR grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? [...Array(8)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="bg-surface-2 h-44" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-surface-2 rounded w-3/4" />
                <div className="h-2.5 bg-surface-2 rounded w-1/2" />
              </div>
            </div>
          ))
          : visible.length === 0
            ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                <QrCode className="w-12 h-12 text-text-muted opacity-30" />
                <p className="text-text-muted text-sm font-medium">No batches match this filter</p>
              </div>
            )
            : visible.map(b => (
              <QRCard key={b._id} batch={b} onDownloadQR={onDownloadQR} />
            ))
        }
      </div>
    </div>
  );
}

// ── Tab: AI Audit — structured JSON card layout ──────────────────
function AIAuditTab({ batchCount }) {
  const { report, fromCache, generatedAt, loading, error, runAudit } = useAIAudit();

  const SEVERITY_COLOR = {
    HIGH:   'bg-red-500/10 text-red-500 border-red-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    LOW:    'bg-green-500/10 text-green-500 border-green-500/20',
  };

  function getCacheLabel() {
    if (!fromCache || !generatedAt) return null;
    const elapsed   = (Date.now() - generatedAt.getTime()) / 3600000;
    const remaining = Math.max(0, 4 - elapsed);
    const h = Math.floor(remaining);
    const m = Math.round((remaining - h) * 60);
    return `Cached · refreshes in ${h}h ${m}m`;
  }

  // Guard: require batches before audit
  if (batchCount === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <Bot className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
        <p className="font-semibold text-text-primary">No batches to analyse</p>
        <p className="text-sm text-text-muted mt-1">Add at least one batch before running an AI audit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header card ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">AI Dispatch Audit</h2>
              <p className="text-xs text-text-muted mt-0.5">Gemini 2.5 Flash · structured JSON output · NVIDIA fallback</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report && fromCache && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted bg-surface-2 border border-border px-3 py-1.5 rounded-lg">
                <Clock className="w-3 h-3" />
                {getCacheLabel()}
              </span>
            )}
            <button
              onClick={runAudit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? 'Analysing…' : report ? 'Re-run Audit' : 'Run Audit'}
            </button>
          </div>
        </div>

        {/* Metrics bar — shown after report is ready */}
        {report && !loading && (
          <div className="border-t border-border grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {[
              { label: 'Batches Analysed', value: report.totalAnalyzed ?? batchCount, icon: Activity, color: 'text-brand' },
              { label: 'Urgent Dispatch',  value: report.urgentBatches?.length ?? 0,   icon: AlertTriangle, color: 'text-red-500' },
              { label: 'Quality Flags',    value: report.qualityWarnings?.length ?? 0,  icon: TrendingUp,    color: 'text-amber-500' },
              { label: 'Risk Signals',     value: report.supplyChainRisks?.length ?? 0, icon: Info,          color: 'text-teal-500' },
            ].map(m => (
              <div key={m.label} className="px-5 py-3 flex items-center gap-3">
                <m.icon className={`w-4 h-4 ${m.color} flex-shrink-0`} />
                <div>
                  <p className="text-lg font-extrabold text-text-primary leading-none">{m.value}</p>
                  <p className="text-[10px] text-text-muted font-medium mt-0.5">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-surface-2 rounded w-1/3" />
              <div className="h-3 bg-surface-2 rounded w-full" />
              <div className="h-3 bg-surface-2 rounded w-5/6" />
              <div className="h-3 bg-surface-2 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ── */}
      {error && !loading && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 flex items-start gap-4">
          <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-red-400">Audit Failed</p>
            <p className="text-sm text-text-muted mt-1">{error}</p>
            <button onClick={runAudit} className="mt-3 text-xs text-brand hover:text-brand-hover font-medium">Try again →</button>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!report && !loading && !error && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-teal-500 opacity-60" />
          </div>
          <p className="font-semibold text-text-primary">Ready to analyse {batchCount} batch{batchCount !== 1 ? 'es' : ''}</p>
          <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto">Get AI-powered dispatch recommendations, risk flags, and quality alerts. Results are cached for 4 hours.</p>
          <button onClick={runAudit}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
            <Zap className="w-4 h-4" /> Run AI Audit
          </button>
        </div>
      )}

      {/* ── Report cards ── */}
      {report && !loading && (
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Summary */}
          {report.summary && (
            <div className="sm:col-span-2 bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-teal-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">Executive Summary</h3>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Urgent Batches */}
          <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              </div>
              <h3 className="text-sm font-semibold text-red-500">Urgent Dispatch</h3>
              <span className="ml-auto text-xs font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                {report.urgentBatches?.length ?? 0}
              </span>
            </div>
            {report.urgentBatches?.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <CheckCircle className="w-4 h-4 text-green-500" /> No urgent batches
              </div>
            ) : (
              <ul className="space-y-2">
                {report.urgentBatches.map((b, i) => (
                  <li key={i} className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono font-bold text-red-400">{b.batchCode}</span>
                    <span className="text-xs text-text-muted">{b.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quality Warnings */}
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <h3 className="text-sm font-semibold text-amber-500">Quality Concerns</h3>
              <span className="ml-auto text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                {report.qualityWarnings?.length ?? 0}
              </span>
            </div>
            {report.qualityWarnings?.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <CheckCircle className="w-4 h-4 text-green-500" /> All batches pass quality threshold
              </div>
            ) : (
              <ul className="space-y-2">
                {report.qualityWarnings.map((w, i) => (
                  <li key={i} className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono font-bold text-amber-400">{w.batchCode}</span>
                    <span className="text-xs text-text-muted">{w.concern}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Top 3 Dispatch Priorities */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-brand/10 rounded-lg flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-brand" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Top 3 Dispatch Priorities</h3>
            </div>
            <ol className="space-y-3">
              {(report.top3Priorities || []).map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                    i === 0 ? 'bg-brand text-white' :
                    i === 1 ? 'bg-surface-2 text-text-primary' :
                              'bg-surface-2 text-text-muted'
                  }`}>#{p.rank}</span>
                  <div>
                    <p className="text-xs font-mono font-semibold text-text-primary">{p.batchCode}</p>
                    <p className="text-xs text-text-muted mt-0.5">{p.action}</p>
                    {p.reasoning && <p className="text-[10px] text-text-muted/70 mt-1 italic">{p.reasoning}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Supply Chain Risks */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <Info className="w-3.5 h-3.5 text-teal-500" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Supply Chain Risks</h3>
            </div>
            {(report.supplyChainRisks || []).length === 0 ? (
              <p className="text-sm text-text-muted">No systemic risks flagged.</p>
            ) : (
              <ul className="space-y-3">
                {report.supplyChainRisks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${
                      SEVERITY_COLOR[r.severity] || SEVERITY_COLOR.LOW
                    }`}>{r.severity}</span>
                    <div>
                      <p className="text-xs text-text-primary font-medium">{r.risk}</p>
                      {r.recommendation && <p className="text-[10px] text-text-muted mt-0.5">{r.recommendation}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── Admin Panel Tab (Users + Access Requests) ──────────────────

const ROLE_STYLE = {
  'admin':                  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'manager':                'bg-brand/10 text-brand border-brand/20',
  'factory-manager':        'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'quality-inspector':      'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'dispatch-coordinator':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
};
const ROLE_LABEL = {
  'admin':                  'Administrator',
  'manager':                'Manager',
  'factory-manager':        'Factory Mgr',
  'quality-inspector':      'QA Inspector',
  'dispatch-coordinator':   'Dispatch',
};
const STATUS_BADGE = {
  pending:  'bg-amber-500/10 text-amber-600 border-amber-500/20',
  approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  rejected: 'bg-red-500/10  text-red-500  border-red-500/20',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-text-primary leading-none">{value}</p>
        <p className="text-sm font-medium text-text-primary mt-0.5">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function AdminPanelTab() {
  const [users,       setUsers]       = useState([]);
  const [requests,    setRequests]    = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loadingU,    setLoadingU]    = useState(true);
  const [loadingR,    setLoadingR]    = useState(true);
  const [rejectId,    setRejectId]    = useState(null);
  const [rejectNote,  setRejectNote]  = useState('');
  const [inviteLink,  setInviteLink]  = useState(null);
  const [actionLoad,  setActionLoad]  = useState(null);
  const [togglingId,  setTogglingId]  = useState(null);
  const [activeView,  setActiveView]  = useState('users');

  // Users Roster filters
  const [userSearch,   setUserSearch]   = useState('');
  const [roleFilter,   setRoleFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Access Requests filter
  const [reqFilter,    setReqFilter]    = useState('pending');

  const fetchUsers = useCallback(async () => {
    setLoadingU(true);
    try {
      const data = await client('/auth/users');
      setUsers(data.data || []);
      setStats(data.stats || null);
    } catch { toast.error('Failed to load users'); }
    finally { setLoadingU(false); }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingR(true);
    try {
      const data = await client('/auth/requests');
      setRequests(data.data || []);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoadingR(false); }
  }, []);

  useEffect(() => { fetchUsers(); fetchRequests(); }, [fetchUsers, fetchRequests]);

  async function handleApprove(id, name) {
    setActionLoad(id);
    try {
      const data = await client(`/auth/requests/${id}/approve`, { method: 'POST' });
      setInviteLink({ link: data.inviteLink, name });
      toast.success('Request approved!');
      fetchRequests(); fetchUsers();
    } catch (err) { toast.error(err.message); }
    finally { setActionLoad(null); }
  }

  async function handleReject(id) {
    setActionLoad(id);
    try {
      await client(`/auth/requests/${id}/reject`, {
        method: 'POST',
        body:   JSON.stringify({ note: rejectNote }),
      });
      toast.success('Request rejected.');
      setRejectId(null); setRejectNote('');
      fetchRequests();
    } catch (err) { toast.error(err.message); }
    finally { setActionLoad(null); }
  }

  async function handleToggle(userId) {
    setTogglingId(userId);
    try {
      const data = await client(`/auth/users/${userId}/toggle`, { method: 'PATCH' });
      toast.success(data.message);
      fetchUsers();
    } catch (err) { toast.error(err.message); }
    finally { setTogglingId(null); }
  }

  const pending  = requests.filter(r => r.status === 'pending');
  const approved = requests.filter(r => r.status === 'approved');
  const rejected = requests.filter(r => r.status === 'rejected');

  // Visible requests by filter
  const visibleRequests = requests.filter(r =>
    reqFilter === 'all' ? true : r.status === reqFilter
  );

  // Role distribution
  const allRoles = [...new Set(users.map(u => u.role))];
  const roleCounts = allRoles.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {});
  const ROLE_DOT = {
    'admin':                'bg-rose-400',
    'manager':              'bg-brand',
    'factory-manager':      'bg-amber-400',
    'quality-inspector':    'bg-teal-400',
    'dispatch-coordinator': 'bg-blue-400',
  };

  // User roster filter
  const ROLE_FILTERS = [
    { id: 'all', label: 'All', count: users.length },
    ...allRoles.map(r => ({ id: r, label: ROLE_LABEL[r] || r, count: roleCounts[r] || 0 })),
  ];

  const filteredUsers = users.filter(u => {
    const matchSearch = !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-5">

      {/* ── Invite Link Modal ── */}
      {inviteLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setInviteLink(null)}>
          <div className="bg-surface border border-border rounded-2xl p-7 shadow-2xl max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Invite Link Ready</h3>
                <p className="text-text-muted text-sm">For {inviteLink.name} — expires in 48 hours</p>
              </div>
            </div>
            <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
              <code className="text-xs text-text-muted flex-1 break-all leading-relaxed">{inviteLink.link}</code>
              <button onClick={() => { navigator.clipboard.writeText(inviteLink.link); toast.success('Copied!'); }}
                className="flex-shrink-0 p-2 hover:bg-surface rounded-lg transition-colors text-brand">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { navigator.clipboard.writeText(inviteLink.link); toast.success('Copied!'); }}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" /> Copy Link
              </button>
              <button onClick={() => window.open(inviteLink.link, '_blank')}
                className="flex-1 py-2.5 border border-border text-text-muted hover:text-text-primary text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> Open
              </button>
            </div>
            <button onClick={() => setInviteLink(null)} className="w-full mt-3 text-sm text-text-muted hover:text-text-primary transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* ── KPI Row ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-l-4 border-brand/20 border-l-brand rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Total Users</p>
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Users className="w-4 h-4 text-brand" /></div>
            </div>
            <p className="text-3xl font-extrabold text-text-primary">{stats.totalUsers}</p>
            <p className="text-xs text-text-muted mt-1">{stats.activeUsers} active</p>
          </div>
          <div className="bg-surface border border-l-4 border-amber-500/20 border-l-amber-500 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Pending</p>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center relative">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                {stats.pendingRequests > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full text-[8px] font-black text-white flex items-center justify-center">{stats.pendingRequests}</span>}
              </div>
            </div>
            <p className="text-3xl font-extrabold text-text-primary">{stats.pendingRequests}</p>
            <p className="text-xs text-text-muted mt-1">
              {stats.pendingRequests > 0
                ? <button onClick={() => { setActiveView('requests'); setReqFilter('pending'); }}
                    className="text-amber-500 hover:text-amber-400 font-semibold">Review now →</button>
                : 'all caught up'}
            </p>
          </div>
          <div className="bg-surface border border-l-4 border-green-500/20 border-l-green-500 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Active</p>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-400" /></div>
            </div>
            <p className="text-3xl font-extrabold text-text-primary">{stats.activeUsers}</p>
            <p className="text-xs text-text-muted mt-1">{stats.totalUsers - stats.activeUsers} disabled</p>
          </div>
          <div className="bg-surface border border-l-4 border-blue-500/20 border-l-blue-500 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Roles in Use</p>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Users className="w-4 h-4 text-blue-400" /></div>
            </div>
            <p className="text-3xl font-extrabold text-text-primary">{Object.keys(stats.roleCounts || {}).length}</p>
            <p className="text-xs text-text-muted mt-1 truncate">
              {Object.entries(stats.roleCounts || {}).map(([r, c]) => `${c} ${ROLE_LABEL[r] || r}`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Role Distribution Bar ── */}
      {!loadingU && users.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Role Distribution</p>
            <p className="text-xs text-text-muted">{users.length} total users</p>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden mb-3 gap-0.5">
            {allRoles.map(role => (
              <div key={role} title={`${ROLE_LABEL[role] || role}: ${roleCounts[role]}`}
                className={`${ROLE_DOT[role] || 'bg-surface-2'} transition-all duration-700 cursor-pointer`}
                style={{ width: `${(roleCounts[role] / users.length) * 100}%`, minWidth: 4 }}
                onClick={() => setRoleFilter(role === roleFilter ? 'all' : role)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {allRoles.map(role => (
              <button key={role}
                onClick={() => { setRoleFilter(role === roleFilter ? 'all' : role); setActiveView('users'); }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all ${
                  roleFilter === role
                    ? (ROLE_STYLE[role] || 'bg-surface-2 text-text-muted border-border') + ' shadow-sm'
                    : 'bg-surface border-border text-text-muted hover:text-text-primary'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[role] || 'bg-surface-2'}`} />
                {ROLE_LABEL[role] || role}
                <span className="font-black">{roleCounts[role]}</span>
              </button>
            ))}
            {roleFilter !== 'all' && (
              <button onClick={() => setRoleFilter('all')} className="text-[10px] text-brand hover:text-brand-hover font-semibold">Clear ×</button>
            )}
          </div>
        </div>
      )}

      {/* ── Section Navigation ── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-0 bg-surface-2 border border-border p-1 rounded-xl w-fit">
          {[
            { id: 'users',    label: 'Users Roster', icon: Users,       count: users.length },
            { id: 'requests', label: 'Access Requests', icon: ShieldCheck, count: pending.length, pulse: pending.length > 0 },
          ].map(v => (
            <button key={v.id} onClick={() => setActiveView(v.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeView === v.id ? 'bg-surface shadow text-text-primary' : 'text-text-muted hover:text-text-primary'
              }`}>
              {v.pulse && <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
              <v.icon className="w-3.5 h-3.5" />
              {v.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeView === v.id ? 'bg-brand/10 text-brand' : 'bg-surface text-text-muted'
              }`}>{v.count}</span>
            </button>
          ))}
        </div>
        <button onClick={() => { fetchUsers(); fetchRequests(); }}
          className="p-2 text-text-muted hover:text-brand rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          VIEW: Users Roster
      ══════════════════════════════════════════════════════ */}
      {activeView === 'users' && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Command bar */}
          <div className="px-4 pt-4 pb-0 border-b border-border">
            {/* Row 1: search + status toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, username…"
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors" />
              </div>
              {/* Active/Inactive toggle */}
              <div className="flex gap-1 bg-surface-2 border border-border p-0.5 rounded-lg flex-shrink-0">
                {[
                  { id: 'all',      label: 'All' },
                  { id: 'active',   label: 'Active' },
                  { id: 'inactive', label: 'Inactive' },
                ].map(s => (
                  <button key={s.id} onClick={() => setStatusFilter(s.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      statusFilter === s.id
                        ? s.id === 'active'   ? 'bg-green-500/15 text-green-500 shadow-sm'
                        : s.id === 'inactive' ? 'bg-red-500/15 text-red-400 shadow-sm'
                                              : 'bg-surface text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* Row 2: Role filter tabs */}
            <div className="flex gap-0 overflow-x-auto">
              {ROLE_FILTERS.map(f => (
                <button key={f.id} onClick={() => setRoleFilter(f.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                    roleFilter === f.id
                      ? 'border-brand text-brand'
                      : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
                  }`}>
                  {f.id !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[f.id] || 'bg-surface-2'}`} />}
                  {f.label}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    roleFilter === f.id ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-text-muted'
                  }`}>{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loadingU ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse py-2">
                  <div className="w-9 h-9 rounded-xl bg-surface-2 flex-shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-3 bg-surface-2 rounded w-1/3" /><div className="h-2.5 bg-surface-2 rounded w-1/4" /></div>
                  <div className="h-5 bg-surface-2 rounded w-16" />
                  <div className="h-5 bg-surface-2 rounded w-20" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted text-sm">No users match these filters</p>
              {(userSearch || roleFilter !== 'all' || statusFilter !== 'all') && (
                <button onClick={() => { setUserSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                  className="mt-2 text-xs text-brand hover:text-brand-hover font-semibold">Clear filters</button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-surface-2 border-b border-border text-[10px] font-bold uppercase tracking-widest text-text-muted">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Username</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {filteredUsers.map((u, i) => (
                <div key={u._id}
                  className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-colors hover:bg-surface-2/50 ${
                    i < filteredUsers.length - 1 ? 'border-b border-border' : ''
                  } ${!u.isActive ? 'opacity-60' : ''}`}>

                  {/* Name + email */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                      ROLE_STYLE[u.role] || 'bg-surface-2 text-text-muted border-border'
                    }`}>
                      {u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{u.name}</p>
                      <p className="text-xs text-text-muted truncate">{u.email || '—'}</p>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="col-span-2">
                    <span className="text-xs font-mono text-text-muted bg-surface-2 px-2 py-0.5 rounded">@{u.username}</span>
                  </div>

                  {/* Role badge */}
                  <div className="col-span-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
                      ROLE_STYLE[u.role] || 'bg-surface-2 text-text-muted border-border'
                    }`}>{ROLE_LABEL[u.role] || u.role}</span>
                  </div>

                  {/* Joined */}
                  <div className="col-span-2">
                    <p className="text-xs text-text-muted">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${u.isActive ? 'text-green-500' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-400/60'}`} />
                      {u.isActive ? 'Active' : 'Off'}
                    </span>
                  </div>

                  {/* Toggle */}
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => handleToggle(u._id)} disabled={togglingId === u._id}
                      title={u.isActive ? 'Deactivate user' : 'Activate user'}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-40 ${
                        u.isActive
                          ? 'border-red-400/30 text-red-400 hover:bg-red-500/10'
                          : 'border-green-500/30 text-green-500 hover:bg-green-500/10'
                      }`}>
                      {togglingId === u._id ? '…' : u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-surface-2">
                <p className="text-xs text-text-muted">
                  Showing <span className="font-semibold text-text-primary">{filteredUsers.length}</span> of <span className="font-semibold text-text-primary">{users.length}</span> users
                  {roleFilter !== 'all' && <> · role: <span className="font-semibold">{ROLE_LABEL[roleFilter] || roleFilter}</span></>}
                  {statusFilter !== 'all' && <> · status: <span className="font-semibold capitalize">{statusFilter}</span></>}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW: Access Requests
      ══════════════════════════════════════════════════════ */}
      {activeView === 'requests' && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Request filter tabs */}
          <div className="px-4 pt-0 border-b border-border">
            <div className="flex gap-0 overflow-x-auto">
              {[
                { id: 'pending',  label: 'Pending',  count: pending.length,  pulse: pending.length > 0 },
                { id: 'approved', label: 'Approved', count: approved.length },
                { id: 'rejected', label: 'Rejected', count: rejected.length },
                { id: 'all',      label: 'All',      count: requests.length },
              ].map(f => (
                <button key={f.id} onClick={() => setReqFilter(f.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                    reqFilter === f.id
                      ? f.id === 'pending'  ? 'border-amber-500 text-amber-500'
                      : f.id === 'approved' ? 'border-green-500 text-green-500'
                      : f.id === 'rejected' ? 'border-red-500 text-red-400'
                                            : 'border-brand text-brand'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}>
                  {f.pulse && <span className="absolute top-2 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                  {f.label}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    reqFilter === f.id ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-text-muted'
                  }`}>{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Request Cards */}
          <div className="p-4">
            {loadingR ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => <div key={i} className="bg-surface-2 rounded-xl h-36 animate-pulse" />)}
              </div>
            ) : visibleRequests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-10 h-10 text-green-400/40 mx-auto mb-3" />
                <p className="text-text-muted text-sm font-medium">
                  {reqFilter === 'pending' ? 'All caught up — no pending requests' : `No ${reqFilter} requests`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleRequests.map(r => (
                  <div key={r._id} className={`bg-surface rounded-xl p-5 border border-l-4 ${
                    r.status === 'pending'  ? 'border-amber-400/20 border-l-amber-400' :
                    r.status === 'approved' ? 'border-green-500/20 border-l-green-500' :
                                             'border-red-400/20 border-l-red-400'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary truncate">{r.name}</p>
                        <p className="text-text-muted text-xs truncate">{r.email}</p>
                      </div>
                      <span className={`ml-2 flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${STATUS_BADGE[r.status]}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${ROLE_STYLE[r.role] || 'bg-surface-2 text-text-muted border-border'}`}>
                        {ROLE_LABEL[r.role] || r.role}
                      </span>
                      <span className="text-text-muted text-xs">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {r.approvedBy && <p className="text-text-muted text-[10px] mb-1">By: {r.approvedBy}</p>}
                    {r.note && <p className="text-text-muted text-[10px] italic mb-3">"{r.note}"</p>}

                    {/* Actions — only show for pending */}
                    {r.status === 'pending' && (
                      rejectId === r._id ? (
                        <div className="space-y-2">
                          <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                            placeholder="Reason for rejection (optional)" rows={2}
                            className="w-full px-3 py-2 text-xs bg-surface-2 border border-border rounded-lg text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30" />
                          <div className="flex gap-2">
                            <button onClick={() => handleReject(r._id)} disabled={actionLoad === r._id}
                              className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50">
                              {actionLoad === r._id ? 'Rejecting…' : 'Confirm Reject'}
                            </button>
                            <button onClick={() => { setRejectId(null); setRejectNote(''); }}
                              className="px-3 py-2 border border-border text-text-muted text-xs rounded-lg hover:bg-surface-2 transition-colors">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(r._id, r.name)} disabled={actionLoad === r._id}
                            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {actionLoad === r._id ? 'Approving…' : 'Approve'}
                          </button>
                          <button onClick={() => setRejectId(r._id)}
                            className="flex-1 py-2 border border-red-400/30 text-red-500 hover:bg-red-500/5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {!loadingR && visibleRequests.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-text-muted">
                  {visibleRequests.length} {reqFilter === 'all' ? 'total' : reqFilter} request{visibleRequests.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const NAV_TABS = [
  { id: 'overview',  label: 'Overview',      icon: LayoutDashboard },
  { id: 'batches',   label: 'Batches',       icon: Package },
  { id: 'fefo',      label: 'FEFO Queue',    icon: Truck },
  { id: 'qr',        label: 'QR Codes',      icon: QrCode },
  { id: 'ai',        label: 'AI Audit',      icon: Bot },
  { id: 'admin',     label: 'Admin Panel',   icon: ShieldCheck, adminOnly: true },
];


export default function Dashboard() {
  const { id: tabParam } = Object.fromEntries(new URLSearchParams(window.location.search));
  const [activeTab, setActiveTab]           = useState(tabParam || 'overview');

  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchToDispatch, setBatchToDispatch] = useState(null);
  const [batchesFilter, setBatchesFilter]     = useState('all'); // cross-tab filter from Overview
  const { logout, getUser }                   = useAuth();
  const user                                  = getUser(); // { username, name, role }
  const { batches, loading, createBatch, downloadQR, dispatchBatch } = useBatches();

  // Connect to WebSocket for real-time batch updates across all dashboard tabs
  useSocket();

  // Navigate to a tab, optionally pre-set a filter (e.g. from Overview status pills)
  function handleTabSwitch(tabId, filter = 'all') {
    if (tabId === 'batches') setBatchesFilter(filter);
    setActiveTab(tabId);
  }

  // Filter NAV_TABS — admin tab only visible to admin role
  const visibleTabs = NAV_TABS.filter(t => !t.adminOnly || user?.role === 'admin');



  async function handleCreateBatch(payload) {
    await createBatch(payload);
  }

  async function handleDownloadQR(batchId, batchCode) {
    try {
      await downloadQR(batchId, batchCode);
      toast.success(`QR downloaded: ${batchCode}-QR.png`);
    } catch (err) {
      toast.error(err.message || 'Failed to download QR');
    }
  }

  // Called from BatchesTab — receives the full batch object
  function handleDispatch(batch) {
    setBatchToDispatch(batch);
  }

  // Called from DispatchModal on confirm
  async function handleConfirmDispatch(batchId, buyerName) {
    try {
      await dispatchBatch(batchId, buyerName);
      toast.success('Batch marked as DISPATCHED');
      setBatchToDispatch(null);
    } catch (err) {
      toast.error(err.message || 'Dispatch failed');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pt-[72px]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-72px)]">
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Sidebar — FIXED: use top-[72px] + bottom-0 for mobile, relative+top-0 for desktop */}
        <aside className={`
          fixed top-[72px] left-0 bottom-0 z-30 w-56 flex-shrink-0 transition-transform duration-300
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          border-r border-white/5
          md:relative md:top-0 md:bottom-auto md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Mountain watermark */}
          <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="white">
              <polygon points="100,20 180,160 20,160" opacity="0.4"/>
              <polygon points="60,60 130,160 0,160" opacity="0.3"/>
              <polygon points="140,50 200,160 90,160" opacity="0.3"/>
            </svg>
          </div>

          <div className="h-full flex flex-col pt-4 pb-6 overflow-y-auto relative">
            {/* Brand mark */}
            <div className="px-4 mb-6">
              <div className="flex items-center gap-2 px-2">
                <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold leading-tight">HimShakti</p>
                  <p className="text-white/30 text-[9px] leading-tight">Operations</p>
                </div>
              </div>
              <div className="mt-3 h-px bg-white/10" />
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 px-3">
              <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest px-2 mb-2">Navigation</p>
              {visibleTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const meta = TAB_META[tab.id];
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative group ${
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                    }`}
                  >
                    {isActive && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${meta?.dot || 'bg-brand'}`} />
                    )}
                    <Icon className={`flex-shrink-0 w-4 h-4 mr-3 transition-colors ${
                      isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                    }`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Bottom actions */}
            <div className="px-3 mt-4 border-t border-white/10 pt-4 space-y-1">
              <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest px-2 mb-2">Account</p>
              <button
                onClick={logout}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-200 group"
              >
                <LogOut className="w-4 h-4 mr-3 text-white/30 group-hover:text-red-400 transition-colors" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main — subtle per-tab background tint */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 transition-colors duration-500 ${TAB_META[activeTab]?.mainTint || ''}`}>
          {/* Remove old header bar — each tab now has its own TabBanner */}

          {/* Wrapped in key div for fade-slide-in on every tab switch */}
          <div key={activeTab} className="dash-tab-in">
            {activeTab === 'overview' && (
              <>
                <TabBanner tabId="overview" />
                <OverviewTab batches={batches} loading={loading} onTabSwitch={handleTabSwitch} />
              </>
            )}
            {activeTab === 'batches' && (
              <>
                <TabBanner tabId="batches" action={
                  <button onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 hover:bg-white text-slate-900 text-sm font-bold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 backdrop-blur-sm">
                    <Plus className="w-4 h-4" /> New Batch
                  </button>
                } />
                <BatchesTab
                  batches={batches}
                  loading={loading}
                  onNewBatch={() => setShowCreateModal(true)}
                  onDownloadQR={handleDownloadQR}
                  onDispatch={handleDispatch}
                  initialFilter={batchesFilter}
                />
              </>
            )}
            {activeTab === 'fefo' && (
              <>
                <TabBanner tabId="fefo" />
                <FEFOTab />
              </>
            )}
            {activeTab === 'qr' && (
              <>
                <TabBanner tabId="qr" />
                <QRTab batches={batches} loading={loading} onDownloadQR={handleDownloadQR} />
              </>
            )}
            {activeTab === 'ai' && (
              <>
                <TabBanner tabId="ai" />
                <ErrorBoundary>
                  <AIAuditTab batchCount={batches.length} />
                </ErrorBoundary>
              </>
            )}
            {activeTab === 'admin' && (
              <>
                <TabBanner tabId="admin" />
                <AdminPanelTab />
              </>
            )}
          </div>
        </main>
      </div>

      <CreateBatchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreateBatch}
      />
      <DispatchModal
        batch={batchToDispatch}
        onClose={() => setBatchToDispatch(null)}
        onConfirm={handleConfirmDispatch}
      />
    </div>
  );
}
