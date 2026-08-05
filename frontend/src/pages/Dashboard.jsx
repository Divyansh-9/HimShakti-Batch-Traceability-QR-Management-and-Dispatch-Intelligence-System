import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CreateBatchModal from '../components/CreateBatchModal';
import DispatchModal from '../components/DispatchModal';
import BatchDetailDrawer from '../components/BatchDetailDrawer';
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
  ShieldCheck, Users, XCircle, Copy, ExternalLink, Zap, TrendingUp, Activity, Info,
  Eye, Archive, Pencil, RotateCcw, HelpCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { WalkthroughProvider, useWalkthrough } from '../context/WalkthroughContext';
import WelcomeChoiceModal from '../components/WelcomeChoiceModal';
import WalkthroughTour from '../components/WalkthroughTour';


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
    <div className="tab-banner -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-6 relative overflow-hidden" style={{ height: 176 }}>
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
            <div className="flex items-center gap-2 mb-1">
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

// ── AnimatedStat ────────────────────────────────────────────
function AnimatedStat({ value }) {
  const num = typeof value === 'number' ? value : NaN;
  const [count, setCount] = useState(isNaN(num) ? value : 0);
  useEffect(() => {
    if (isNaN(num)) return;
    setCount(0);
    const start = Date.now(); const dur = 900;
    function tick() {
      const p = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * num));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [num]);
  return <>{count}</>;
}

// ── Pass 1: FilterTabBar — sliding pill indicator ────────────
const FILTER_ACCENT_CLASSES = { URGENT: 'text-red-500', WARNING: 'text-amber-500', READY: 'text-green-500', archived: 'text-rose-400' };
function FilterTabBar({ filters, activeId, onSelect }) {
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const el = tabRefs.current[activeId];
    if (!el) return;
    const parent = el.offsetParent;
    const parentLeft = parent ? parent.getBoundingClientRect().left : 0;
    const rect = el.getBoundingClientRect();
    setIndicator({ left: el.offsetLeft, width: rect.width });
  }, [activeId]);
  return (
    <div className="nav-tab-group flex gap-0 overflow-x-auto">
      <span className="nav-tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
      {filters.map(f => (
        <button key={f.id} ref={el => { tabRefs.current[f.id] = el; }}
          onClick={() => onSelect(f.id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeId === f.id
              ? `border-brand ${FILTER_ACCENT_CLASSES[f.id] || 'text-brand'}`
              : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
          }`}>
          {f.id === 'archived' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />}
          {f.label}
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
            activeId === f.id
              ? f.id === 'archived' ? 'bg-rose-400/10 text-rose-400' : 'bg-brand/10 text-brand'
              : 'bg-surface-2 text-text-muted'
          }`}>{f.count}</span>
        </button>
      ))}
    </div>
  );
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
          {/* Pass 4: skeleton-shimmer — light-sweep instead of pulse */}
          <div className="skeleton-shimmer h-4 rounded w-3/4" />
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

  // Main KPI cards — Need Attention dynamically switches to red when urgent > 0
  const needAttentionUrgent = urgent > 0;
  const kpis = [
    { label: 'Total Batches',  value: total,      icon: Package,       color: 'text-brand',     bg: 'bg-brand/5',      bar: 'bg-brand',      border: 'border-l-4 border-brand',      sub: 'across all product lines' },
    { label: 'Active Stock',   value: active,     icon: Leaf,          color: 'text-green-500', bg: 'bg-green-500/5',  bar: 'bg-green-500',  border: 'border-l-4 border-green-500',  sub: 'batches in warehouse' },
    { label: 'Dispatched',     value: dispatched, icon: Truck,         color: 'text-blue-500',  bg: 'bg-blue-500/5',   bar: 'bg-blue-500',   border: 'border-l-4 border-blue-500',   sub: 'shipments completed' },
    {
      label: 'Need Attention',
      value: urgent + warning,
      icon: AlertTriangle,
      // Red accent when urgent items exist, amber when only warnings
      color: needAttentionUrgent ? 'text-red-500'   : 'text-amber-500',
      bg:    needAttentionUrgent ? 'bg-red-500/5'   : 'bg-amber-500/5',
      bar:   needAttentionUrgent ? 'bg-red-500'     : 'bg-amber-500',
      border:needAttentionUrgent ? 'border-l-4 border-red-500' : 'border-l-4 border-amber-500',
      sub: urgent > 0 ? `${urgent} urgent · ${warning} warning` : `${warning} warning status`,
    },
  ];

  // Status breakdown — clickable, navigates to filtered batches
  const STATUS_PILLS = [
    { status: 'URGENT',  count: urgent,  label: 'Urgent',  cls: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',    dot: 'bg-red-500' },
    { status: 'WARNING', count: warning, label: 'Warning', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20', dot: 'bg-amber-500' },
    { status: 'READY',   count: ready,   label: 'Ready',   cls: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',  dot: 'bg-green-500' },
    { status: 'DISPATCHED', count: dispatched, label: 'Dispatched', cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20', dot: 'bg-blue-500' },
  ];

  // Pass 2: map kpi color class to glass glow variant
  const GLOW_MAP = {
    'text-brand':     'glass-card-brand',
    'text-green-500': 'glass-card-ready',
    'text-blue-500':  'glass-card-blue',
    'text-amber-500': 'glass-card-warning',
    'text-red-500':   'glass-card-urgent',
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* KPI Cards — Pass 2: card-grid-ambient gives backdrop-filter something to blur */}
      <div data-tour="kpi-grid" className="card-grid-ambient grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => (
          <div key={kpi.label} className={`glass-card glass-card-border ${GLOW_MAP[kpi.color] || 'glass-card-brand'} ${'card-stagger-' + (idx+1)} rounded-xl p-3 sm:p-5 ${kpi.border} cursor-default transition-all duration-500`}>
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <p className="text-text-muted text-[10px] sm:text-xs font-semibold uppercase tracking-wide leading-tight">{kpi.label}</p>
              {/* Pass 2: icon-badge inner glow, scales on card hover via CSS */}
              <div className={`icon-badge icon-badge-${GLOW_MAP[kpi.color]?.split('-')[2] || 'brand'} w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 ${kpi.bg}`}>
                <kpi.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${kpi.color}`} />
              </div>
            </div>
            {loading
              ? <div className="skeleton-shimmer h-7 sm:h-9 w-12 sm:w-16 rounded" />
              : <div className="flex items-center gap-2">
                  <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    kpi.label === 'Need Attention' && urgent > 0
                      ? 'text-red-500'
                      : 'text-text-primary'
                  }`}>
                    <AnimatedStat value={kpi.value} />
                  </p>
                  {/* Notification dot — only on Need Attention when urgent > 0 */}
                  {kpi.label === 'Need Attention' && urgent > 0 && (
                    <span className="kpi-alert-dot" aria-label="Urgent items need action" />
                  )}
                </div>
            }
            <p className="text-[10px] sm:text-xs text-text-muted mt-1 sm:mt-1.5 leading-tight">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown — Pass 2: glass card */}
      <div className="glass-card glass-card-border glass-card-brand rounded-xl p-4">
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

      {/* Recent batches table — Pass 2: glass card */}
      <div className="glass-card glass-card-border glass-card-brand rounded-xl overflow-hidden">
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
                : batches.slice(0, 8).map(b => {
                  const rowCls = { URGENT: 'batch-row-urgent', WARNING: 'batch-row-warning', READY: 'batch-row-ready' }[b.status] || 'batch-row-default';
                  return (
                    <tr key={b._id} className={`batch-row ${rowCls} transition-colors`}>
                      <td className="px-6 py-4 text-sm font-mono font-medium text-brand">{b.batchCode}</td>
                      <td className="px-6 py-4 text-sm text-text-muted">{b.productName}</td>
                      <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-6 py-4 text-sm text-text-muted">{b.daysUntilExpiry ?? '—'} days</td>
                      <td className="px-6 py-4 text-sm text-text-muted">{b.farmerName}</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Batches (full table + status filter + sort) ────────
function BatchesTab({ batches, loading, onNewBatch, onDownloadQR, onDispatch, onOpenDrawer, onAfterArchive, initialFilter = 'all' }) {
  const [scanInfo, setScanInfo]               = useState({});
  const [loadingScans, setLoadingScans]       = useState({});
  const [query, setQuery]                     = useState('');
  const [statusFilter, setStatusFilter]       = useState(initialFilter);
  const [sortBy, setSortBy]                   = useState('expiry');
  const [archivedBatches, setArchivedBatches] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  // Increment this to force a re-fetch of the archived list from anywhere
  const [archivedVersion, setArchivedVersion] = useState(0);
  const { getBatchScans, fetchArchivedBatches, restoreBatch } = useBatches();

  // Sync initialFilter if parent changes it (e.g. clicking from Overview)
  useEffect(() => { setStatusFilter(initialFilter); }, [initialFilter]);

  // Re-fetch archived list whenever we switch to the archived tab OR archivedVersion bumps
  useEffect(() => {
    if (statusFilter !== 'archived') return;
    let cancelled = false;
    setLoadingArchived(true);
    fetchArchivedBatches()
      .then(data => { if (!cancelled) setArchivedBatches(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingArchived(false); });
    return () => { cancelled = true; };
  }, [statusFilter, archivedVersion]);

  // Called after archive action from the drawer — refreshes list and switches tab
  function refreshArchived() {
    setArchivedVersion(v => v + 1);
    setStatusFilter('archived');
    // Propagate to parent in case it needs to refresh the main batch list too
    onAfterArchive?.();
  }

  // Wrap onOpenDrawer to inject the refreshArchived callback for the drawer's onArchived
  function handleOpenDrawer(batch) {
    onOpenDrawer?.(batch, refreshArchived);
  }

  async function handleRestore(batchId, batchCode) {
    try {
      await restoreBatch(batchId);
      // Optimistically remove from local list
      setArchivedBatches(prev => prev.filter(b => b._id !== batchId));
      toast.success(`${batchCode} restored to active inventory`);
    } catch (err) {
      toast.error(err?.message || 'Restore failed');
      // Re-fetch to get accurate state
      setArchivedVersion(v => v + 1);
    }
  }

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
    { id: 'archived',   label: 'Archived',   count: archivedBatches.length, icon: true },
  ];

  const FILTER_ACCENT = {
    URGENT:     'text-red-500',
    WARNING:    'text-amber-500',
    READY:      'text-green-500',
    DISPATCHED: 'text-blue-500',
    archived:   'text-rose-400',
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
              data-tour="new-batch-btn"
              className="btn-glossy btn-primary-glossy inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Batch
            </button>
          </div>
        </div>

        {/* Row 2: Pass 1 — FilterTabBar with sliding indicator */}
        <FilterTabBar
          filters={STATUS_FILTERS}
          activeId={statusFilter}
          onSelect={setStatusFilter}
        />
      </div>

      {/* ── Archived view ── */}
      {statusFilter === 'archived' ? (
        <div className="overflow-x-auto">
          {/* Archived banner */}
          <div className="px-4 py-3 bg-rose-500/5 border-b border-rose-500/15 flex items-center gap-2">
            <Archive className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <p className="text-xs text-rose-400 font-medium">
              Archived batches are hidden from active views. All records and scan history are preserved. Admins can restore them at any time.
            </p>
          </div>
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-2">
              <tr>
                {['Batch Code', 'Product', 'Farmer / Village', 'Archived At', 'Reason', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingArchived
                ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                : archivedBatches.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-rose-500/5 rounded-full flex items-center justify-center border border-rose-500/15">
                            <Archive className="w-6 h-6 text-rose-400 opacity-40" />
                          </div>
                          <p className="text-text-muted text-sm font-medium">No archived batches</p>
                          <p className="text-text-muted/60 text-xs">Archived batches will appear here</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : archivedBatches.map(b => (
                    <tr key={b._id} className="opacity-70 hover:opacity-100 transition-opacity group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Archive className="w-3 h-3 text-rose-400 flex-shrink-0" />
                          <span className="text-sm font-mono font-medium text-text-muted">{b.batchCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-text-muted">{b.productName}</td>
                      <td className="px-4 py-4 text-sm text-text-muted">
                        {b.farmerName}{b.village ? `, ${b.village}` : ''}
                      </td>
                      <td className="px-4 py-4 text-xs text-text-muted">
                        {b.deletedAt ? new Date(b.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        {b.deletedBy && <div className="text-[10px] text-text-muted/60">by {b.deletedBy}</div>}
                      </td>
                      <td className="px-4 py-4 text-xs text-text-muted italic">{b.deleteNote || '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenDrawer(b)}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRestore(b._id, b.batchCode)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-500 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg transition-colors"
                            title="Restore batch"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {archivedBatches.length > 0 && (
            <div className="px-4 py-3 bg-surface-2 border-t border-border">
              <p className="text-xs text-text-muted">{archivedBatches.length} archived batch{archivedBatches.length !== 1 ? 'es' : ''}</p>
            </div>
          )}
        </div>
      ) : (
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
                : filtered.map(b => {
                  const rowCls = { URGENT: 'batch-row-urgent', WARNING: 'batch-row-warning', READY: 'batch-row-ready' }[b.status] || 'batch-row-default';
                  return (
                <tr
                  key={b._id}
                  className={`batch-row ${rowCls} transition-colors group cursor-pointer`}
                  onMouseEnter={() => handleViewScans(b._id)}
                  onClick={() => handleOpenDrawer(b)}
                >
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
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* View detail */}
                      <button onClick={() => handleOpenDrawer(b)} title="View details"
                        className="p-1.5 text-text-muted hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Download QR */}
                      <button onClick={() => onDownloadQR(b._id, b.batchCode)} title="Download QR"
                        className="p-1.5 text-text-muted hover:text-brand hover:bg-brand/10 rounded-md transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      {/* Dispatch */}
                      {b.status !== 'DISPATCHED' && (
                        <button onClick={() => onDispatch(b)} title="Mark Dispatched"
                          className="p-1.5 text-text-muted hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors">
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                  );
                })
            }
          </tbody>
        </table>
      )}

      {/* Row count footer — only shown in non-archived view */}
      {!loading && filtered.length > 0 && statusFilter !== 'archived' && (
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
    <div className="glass-card glass-card-border glass-card-brand rounded-xl overflow-hidden">
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
        <table data-tour="fefo-table" className="min-w-full divide-y divide-border">
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
                    {/* Pass 4: fefo-top-badge ring + urgent-pulse on #1 spot */}
                    <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-black ${
                      idx === 0 ? 'bg-brand text-white fefo-top-badge' :
                      idx === 1 ? 'bg-surface-2 text-text-primary' :
                                  'text-text-muted font-bold'
                    }${idx === 0 && b.status === 'URGENT' ? ' urgent-pulse' : ''}`}>#{idx + 1}</span>
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
      <div data-tour="qr-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
  const { report, fromCache, generatedAt, provider, loading, error, runAudit } = useAIAudit();

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
              {/* ── Dynamic live status chips ── */}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {/* Chip 1: Provider — reflects which model actually ran */}
                {loading ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    Analysing…
                  </span>
                ) : provider === 'nvidia' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Zap className="w-2.5 h-2.5" />
                    NVIDIA LLaMA 3.1
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Gemini 2.5 Flash
                  </span>
                )}

                {/* Chip 2: Cache / freshness status */}
                {report && !loading && (
                  fromCache && generatedAt ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border">
                      <Clock className="w-2.5 h-2.5" />
                      {getCacheLabel()}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                      <Zap className="w-2.5 h-2.5" />
                      Just generated
                    </span>
                  )
                )}

                {/* Chip 3: Batch scope */}
                {report && !loading && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border">
                    <Activity className="w-2.5 h-2.5" />
                    {report.totalAnalyzed ?? batchCount} batches
                  </span>
                )}

                {/* Chip 3 (idle state): scope hint */}
                {!report && !loading && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border">
                    NVIDIA fallback
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runAudit}
              disabled={loading}
              data-tour="ai-run-btn"
              className="btn-glossy btn-primary-glossy inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md">
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
  'super-admin':            'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'admin':                  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'manager':                'bg-brand/10 text-brand border-brand/20',
  'factory-manager':        'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'quality-inspector':      'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'dispatch-coordinator':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
};
const ROLE_LABEL = {
  'super-admin':            'Super Admin',
  'admin':                  'Admin',
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
  const { getUser } = useAuth();
  const currentUser = getUser();
  const isSuperAdmin = !!currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'divyanshuniyal185@gmail.com' || currentUser?.username?.toLowerCase() === 'divyansh';
  const isAdmin      = isSuperAdmin || currentUser?.role === 'admin';
  const isReadOnly   = !isAdmin;   // Manager gets read-only view

  const [users,        setUsers]        = useState([]);
  const [requests,     setRequests]     = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loadingU,     setLoadingU]     = useState(true);
  const [loadingR,     setLoadingR]     = useState(true);
  const [rejectId,     setRejectId]     = useState(null);
  const [rejectNote,   setRejectNote]   = useState('');
  const [inviteLink,   setInviteLink]   = useState(null);
  const [actionLoad,   setActionLoad]   = useState(null);
  const [resending,    setResending]    = useState(false);
  const [togglingId,   setTogglingId]   = useState(null);
  const [showRawLink,  setShowRawLink]  = useState(false);
  const [removeId,     setRemoveId]     = useState(null);
  const [removeLoad,   setRemoveLoad]   = useState(null);

  // Role change state
  const [roleChangeId,   setRoleChangeId]   = useState(null);   // user._id being changed
  const [roleChangeVal,  setRoleChangeVal]  = useState('');
  const [roleChanging,   setRoleChanging]   = useState(null);

  // Delete state
  const [deleteId,       setDeleteId]       = useState(null);   // user._id being deleted
  const [deleteNote,     setDeleteNote]     = useState('');
  const [deleteConfirm,  setDeleteConfirm]  = useState('');     // typed username for hard-delete
  const [deleting,       setDeleting]       = useState(null);

  // Recycle Bin (super-admin only)
  const [deletedUsers,   setDeletedUsers]   = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [restoring,      setRestoring]      = useState(null);
  const [hardDeleting,   setHardDeleting]   = useState(null);
  const [hardConfirm,    setHardConfirm]    = useState('');

  // Converts raw SMTP errors into clean, actionable messages
  function emailErrorToFriendly(raw = '') {
    const r = raw.toLowerCase();
    if (r.includes('535') || r.includes('badcredentials') || r.includes('username and password') || r.includes('invalid login'))
      return { reason: 'Wrong App Password', fix: 'Your Gmail App Password is incorrect or expired. Go to myaccount.google.com/apppasswords, create a new one, and update EMAIL_PASS in backend/.env (and Render env vars).' };
    if (r.includes('534') || r.includes('less secure') || r.includes('allow less secure'))
      return { reason: '2-Step Verification not enabled', fix: 'Gmail requires 2-Step Verification before App Passwords work. Enable it at myaccount.google.com/security, then create an App Password.' };
    if (r.includes('econnrefused') || r.includes('etimedout') || r.includes('enotfound'))
      return { reason: 'Cannot reach mail server', fix: 'The SMTP host is unreachable. Check EMAIL_HOST and EMAIL_PORT in backend/.env. For Gmail use smtp.gmail.com port 465.' };
    if (r.includes('not configured') || r.includes('email_host') || r.includes('email_user'))
      return { reason: 'Email not configured', fix: 'Add EMAIL_HOST, EMAIL_USER and EMAIL_PASS to backend/.env. See the .env.example file for the exact format.' };
    return { reason: 'Email delivery failed', fix: raw.length > 120 ? raw.slice(0, 120) + '…' : (raw || 'Unknown error. Check backend logs for details.') };
  }


  const [activeView,  setActiveView]  = useState('users');

  // Users Roster filters
  const [userSearch,   setUserSearch]   = useState('');
  const [roleFilter,   setRoleFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
    } catch (err) {
      // Managers (read-only) may get 403 — silently show empty list instead of alarming them
      if (isReadOnly) { setRequests([]); }
      else { toast.error('Failed to load requests'); }
    }
    finally { setLoadingR(false); }
  }, [isReadOnly]);

  // ── fetchDeletedUsers MUST be declared before the useEffect that lists it in deps ──
  const fetchDeletedUsers = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingDeleted(true);
    try {
      const data = await client('/auth/users/deleted');
      setDeletedUsers(data.data || []);
    } catch { toast.error('Failed to load recycle bin'); }
    finally { setLoadingDeleted(false); }
  }, [isSuperAdmin]);

  useEffect(() => { fetchUsers(); fetchRequests(); }, [fetchUsers, fetchRequests]);
  useEffect(() => { if (isSuperAdmin) fetchDeletedUsers(); }, [fetchDeletedUsers, isSuperAdmin]);

  async function handleApprove(id, name) {
    setActionLoad(id);
    try {
      const data = await client(`/auth/requests/${id}/approve`, { method: 'POST' });
      setShowRawLink(false);
      setInviteLink({
        id,
        link:       data.inviteLink,
        name,
        emailSent:  data.emailSent,
        emailError: data.emailError,
        toEmail:    data.emailSent ? (data.inviteLink || '') : '',
      });
      toast.success(data.emailSent ? `✅ Invite emailed to ${name}!` : 'Approved — share the link manually');
      fetchRequests(); fetchUsers();
    } catch (err) { toast.error(err.message); }
    finally { setActionLoad(null); }
  }

  async function handleResendInvite() {
    if (!inviteLink?.id) return;
    setResending(true);
    try {
      const data = await client(`/auth/requests/${inviteLink.id}/resend`, { method: 'POST' });
      setShowRawLink(false);
      setInviteLink(prev => ({
        ...prev,
        link:      data.inviteLink,
        emailSent: data.emailSent,
        emailError: data.emailError,
      }));
      toast.success(data.emailSent ? 'New invite email sent!' : 'Token refreshed — share link manually.');
    } catch (err) { toast.error(err.message); }
    finally { setResending(false); }
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

  async function handleRemove(id, name) {
    setRemoveLoad(id);
    try {
      await client(`/auth/requests/${id}`, { method: 'DELETE' });
      toast.success(`${name} removed.`);
      setRemoveId(null);
      fetchRequests(); fetchUsers();
    } catch (err) { toast.error(err.message); }
    finally { setRemoveLoad(null); }
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

  async function handleChangeRole(userId, newRole) {
    setRoleChanging(userId);
    try {
      const data = await client(`/auth/users/${userId}/role`, {
        method: 'PATCH',
        body:   JSON.stringify({ role: newRole }),
      });
      toast.success(data.message);
      setRoleChangeId(null);
      fetchUsers();
    } catch (err) { toast.error(err.message); }
    finally { setRoleChanging(null); }
  }

  async function handleDeleteUser(userId, username) {
    setDeleting(userId);
    try {
      const body = isSuperAdmin
        ? JSON.stringify({ confirm: deleteConfirm })
        : JSON.stringify({ deleteNote });
      const data = await client(`/auth/users/${userId}`, { method: 'DELETE', body });
      toast.success(data.message);
      setDeleteId(null); setDeleteNote(''); setDeleteConfirm('');
      fetchUsers();
      if (isSuperAdmin) fetchDeletedUsers();
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(null); }
  }


  async function handleRestore(userId) {
    setRestoring(userId);
    try {
      const data = await client(`/auth/users/${userId}/restore`, { method: 'PATCH' });
      toast.success(data.message);
      fetchDeletedUsers(); fetchUsers();
    } catch (err) { toast.error(err.message); }
    finally { setRestoring(null); }
  }

  async function handleHardDelete(userId, username) {
    setHardDeleting(userId);
    try {
      const data = await client(`/auth/users/${userId}`, {
        method: 'DELETE',
        body:   JSON.stringify({ confirm: hardConfirm }),
      });
      toast.success(data.message);
      setHardConfirm('');
      fetchDeletedUsers();
    } catch (err) { toast.error(err.message); }
    finally { setHardDeleting(null); }
  }

  const pending  = requests.filter(r => r.status === 'pending');
  const approved = requests.filter(r => r.status === 'approved');
  const rejected = requests.filter(r => r.status === 'rejected');



  // ── Unified People list (merge activated users + all requests) ─────────────
  // Build a single merged list: activated users first, then request-only entries
  const activatedEmails = new Set(users.map(u => u.email));

  const peopleFromUsers = users.map(u => ({
    _id:       u._id,
    kind:      'user',            // has an actual account
    name:      u.name || u.username,
    email:     u.email,
    username:  u.username,
    role:      u.role,
    isActive:  u.isActive,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    _user:     u,                 // raw user doc
  }));

  // Requests whose email doesn't already have an activated account
  const peopleFromRequests = requests
    .filter(r => !activatedEmails.has(r.email))
    .map(r => ({
      _id:       r._id,
      kind:      'request',
      name:      r.name,
      email:     r.email,
      username:  null,
      role:      r.role,
      isActive:  null,
      reqStatus: r.status,       // 'pending' | 'approved' | 'rejected'
      createdAt: r.createdAt,
      approvedBy: r.approvedBy,
      _request:  r,
    }));

  const allPeople = [...peopleFromUsers, ...peopleFromRequests];

  // Filters
  const [peopleSearch,  setPeopleSearch]  = useState('');
  const [peopleFilter,  setPeopleFilter]  = useState('all'); // 'all'|'active'|'invite-sent'|'pending'|'rejected'

  const filteredPeople = allPeople.filter(p => {
    const q = peopleSearch.toLowerCase();
    const matchSearch = !q ||
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.username?.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (peopleFilter === 'all')         return true;
    if (peopleFilter === 'active')      return p.kind === 'user' && p.isActive;
    if (peopleFilter === 'inactive')    return p.kind === 'user' && !p.isActive;
    if (peopleFilter === 'invite-sent') return p.kind === 'request' && p.reqStatus === 'approved';
    if (peopleFilter === 'pending')     return p.kind === 'request' && p.reqStatus === 'pending';
    if (peopleFilter === 'rejected')    return p.kind === 'request' && p.reqStatus === 'rejected';
    return true;
  });

  // Role distribution across all people
  const allRoles = [...new Set(allPeople.map(p => p.role).filter(Boolean))];
  const roleCounts = allRoles.reduce((acc, r) => ({ ...acc, [r]: allPeople.filter(p => p.role === r).length }), {});

  const ROLE_DOT = {
    'admin':                'bg-rose-400',
    'manager':              'bg-brand',
    'factory-manager':      'bg-amber-400',
    'quality-inspector':    'bg-teal-400',
    'dispatch-coordinator': 'bg-blue-400',
  };

  return (
    <div className="space-y-5">

      {/* ── Read-only notice for managers ── */}
      {isReadOnly && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/8">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <Eye className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-500">Read-only view</p>
            <p className="text-xs text-text-muted mt-0.5">As a Manager, you can view all user and access request data but cannot make changes. Contact an Admin to take action.</p>
          </div>
          <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25">Manager</span>
        </div>
      )}

      {/* ══ Invite / Approval Modal ══ */}
      {inviteLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setInviteLink(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className={`px-6 pt-6 pb-5 border-b border-border ${
              inviteLink.emailSent ? 'bg-green-500/5' : 'bg-amber-500/5'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  inviteLink.emailSent
                    ? 'bg-green-500/15 border border-green-500/20'
                    : 'bg-amber-500/15 border border-amber-500/20'
                }`}>
                  {inviteLink.emailSent
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary leading-tight">
                    {inviteLink.emailSent ? '✅ Invite Sent!' : 'Approved — Share Link'}
                  </h3>
                  <p className="text-text-muted text-xs mt-0.5">
                    For <strong>{inviteLink.name}</strong> — link expires in 48 hours
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* ── Email delivered (happy path) ── */}
              {inviteLink.emailSent ? (
                <div className="flex items-start gap-3 bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-4">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">Email delivered successfully</p>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      <strong>{inviteLink.name}</strong> has received a branded invite email with a
                      &ldquo;Set Your Password&rdquo; button. They'll also verify their email via OTP.
                    </p>
                    <p className="text-xs text-text-muted mt-2">No manual action needed from you.</p>
                  </div>
                </div>
              ) : (
                /* ── Email not sent (fallback) ── */
                <div className="space-y-3">
                  {/* Error card */}
                  {(() => {
                    const { reason, fix } = emailErrorToFriendly(inviteLink.emailError);
                    return (
                      <div className="border border-red-500/20 rounded-xl overflow-hidden">
                        {/* Reason header */}
                        <div className="flex items-center gap-2.5 bg-red-500/8 px-4 py-3 border-b border-red-500/15">
                          <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-red-500">{reason}</p>
                            <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wide font-semibold">Email delivery failed</p>
                          </div>
                        </div>
                        {/* Fix instructions */}
                        <div className="px-4 py-3 bg-surface-2">
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1.5">How to fix</p>
                          <p className="text-xs text-text-primary leading-relaxed">{fix}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Invite link box */}
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Invite Link — Share Manually</p>
                    <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                      <code className="text-xs text-text-muted flex-1 break-all leading-relaxed">{inviteLink.link}</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(inviteLink.link); toast.success('Copied!'); }}
                        className="flex-shrink-0 p-2 hover:bg-surface rounded-lg transition-colors text-brand"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Show/hide raw link (when email sent) ── */}
              {inviteLink.emailSent && (
                <div>
                  <button
                    onClick={() => setShowRawLink(v => !v)}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors underline underline-offset-2"
                  >
                    {showRawLink ? 'Hide invite link' : 'Show invite link (backup)'}
                  </button>
                  {showRawLink && (
                    <div className="mt-2 bg-surface-2 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                      <code className="text-xs text-text-muted flex-1 break-all leading-relaxed">{inviteLink.link}</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(inviteLink.link); toast.success('Copied!'); }}
                        className="flex-shrink-0 p-2 hover:bg-surface rounded-lg transition-colors text-brand"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Actions ── */}
              <div className="flex gap-2.5 pt-1">
                {!inviteLink.emailSent && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(inviteLink.link); toast.success('Copied!'); }}
                    className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copy Link
                  </button>
                )}
                <button
                  onClick={handleResendInvite}
                  disabled={resending}
                  className={`py-2.5 border border-border text-text-muted hover:text-text-primary hover:border-brand/40 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    inviteLink.emailSent ? 'flex-1' : 'px-4'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Sending…' : 'Resend Email'}
                </button>
              </div>

              <button
                onClick={() => setInviteLink(null)}
                className="w-full text-sm text-text-muted hover:text-text-primary transition-colors py-1"
              >
                {inviteLink.emailSent ? 'Done' : 'Close'}
              </button>
            </div>
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
                ? <button onClick={() => setPeopleFilter('pending')}
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
      {!loadingU && allPeople.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Role Distribution</p>
            <p className="text-xs text-text-muted">{allPeople.length} total people</p>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden mb-3 gap-0.5">
            {allRoles.map(role => (
              <div key={role} title={`${ROLE_LABEL[role] || role}: ${roleCounts[role]}`}
                className={`${ROLE_DOT[role] || 'bg-surface-2'} transition-all duration-700 cursor-pointer`}
                style={{ width: `${(roleCounts[role] / allPeople.length) * 100}%`, minWidth: 4 }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {allRoles.map(role => (
              <button key={role}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all bg-surface border-border text-text-muted hover:text-text-primary">
                <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[role] || 'bg-surface-2'}`} />
                {ROLE_LABEL[role] || role}
                <span className="font-black">{roleCounts[role]}</span>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* ── Section Navigation ── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-0 bg-surface-2 border border-border p-1 rounded-xl w-fit overflow-x-auto">
          {[
            { id: 'users',    label: 'Users Roster',    icon: Users,       count: users.length + peopleFromRequests.filter(p => p.reqStatus === 'approved').length },
            { id: 'requests', label: 'Access Requests', icon: ShieldCheck, count: pending.length, pulse: pending.length > 0 },
            ...(isSuperAdmin ? [{ id: 'deleted', label: '🗑️ Recycle Bin', icon: Archive, count: deletedUsers.length }] : []),
          ].map(v => (
            <button key={v.id} onClick={() => { setActiveView(v.id); if (v.id === 'deleted') fetchDeletedUsers(); }}
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
        <button onClick={() => { fetchUsers(); fetchRequests(); if (isSuperAdmin) fetchDeletedUsers(); }}
          className="p-2 text-text-muted hover:text-brand rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ══ VIEW: Users Roster ══ */}
      {activeView === 'users' && (() => {
        const rosterRows = [
          // Activated users
          ...users.map(u => ({
            _id: u._id, kind: 'user', name: u.name || u.username,
            email: u.email, username: u.username, role: u.role,
            isActive: u.isActive, createdAt: u.createdAt, _user: u,
          })),
          // Invite-sent (approved but not yet activated)
          ...requests
            .filter(r => r.status === 'approved' && !new Set(users.map(u => u.email)).has(r.email))
            .map(r => ({
              _id: r._id, kind: 'invite', name: r.name, email: r.email,
              username: null, role: r.role, isActive: null,
              createdAt: r.createdAt, _request: r,
            })),
        ];

        const filteredRoster = rosterRows.filter(p => {
          const matchSearch = !userSearch ||
            p.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            p.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
            p.username?.toLowerCase().includes(userSearch.toLowerCase());
          const matchStatus =
            statusFilter === 'all'      ? true :
            statusFilter === 'active'   ? (p.kind === 'user' && p.isActive) :
            statusFilter === 'inactive' ? (p.kind === 'user' && !p.isActive) :
            statusFilter === 'pending'  ? p.kind === 'invite' : true;
          const matchRole = roleFilter === 'all' || p.role === roleFilter;
          return matchSearch && matchStatus && matchRole;
        });

        const rosterRoles = [...new Set(rosterRows.map(p => p.role).filter(Boolean))];
        const rosterRoleCounts = rosterRoles.reduce((acc, r) => ({ ...acc, [r]: rosterRows.filter(p => p.role === r).length }), {});

        return (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {/* Command bar */}
            <div className="px-4 pt-4 pb-0 border-b border-border">
              {/* Row 1: search + status toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, username..."
                    className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors" />
                </div>
                <div className="flex gap-1 bg-surface-2 border border-border p-0.5 rounded-lg flex-shrink-0">
                  {[
                    { id: 'all',      label: 'All' },
                    { id: 'active',   label: 'Active' },
                    { id: 'inactive', label: 'Inactive' },
                    { id: 'pending',  label: 'Invite Sent' },
                  ].map(s => (
                    <button key={s.id} onClick={() => setStatusFilter(s.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        statusFilter === s.id
                          ? s.id === 'active'   ? 'bg-green-500/15 text-green-500 shadow-sm'
                          : s.id === 'inactive' ? 'bg-red-500/15 text-red-400 shadow-sm'
                          : s.id === 'pending'  ? 'bg-blue-500/15 text-blue-500 shadow-sm'
                                                : 'bg-surface text-text-primary shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}>{s.label}</button>
                  ))}
                </div>
              </div>

              {/* Row 2: role filter tabs */}
              <div className="flex gap-0 overflow-x-auto">
                {[
                  { id: 'all', label: 'All', count: filteredRoster.length, dot: null },
                  ...rosterRoles.map(r => ({ id: r, label: ROLE_LABEL[r] || r, count: rosterRows.filter(p => p.role === r).length, dot: ROLE_DOT[r] })),
                ].map(rf => (
                  <button key={rf.id} onClick={() => setRoleFilter(rf.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                      roleFilter === rf.id
                        ? 'border-brand text-brand'
                        : 'border-transparent text-text-muted hover:text-text-primary'
                    }`}>
                    {rf.dot && <span className={`w-1.5 h-1.5 rounded-full ${rf.dot}`} />}
                    {rf.label}
                    <span className={`text-[10px] font-black px-1 py-0.5 rounded-full ml-0.5 ${
                      roleFilter === rf.id ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-text-muted'
                    }`}>{rf.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {loadingU ? (
              <div className="divide-y divide-border">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-xl bg-surface-2 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-2 rounded animate-pulse w-32" />
                      <div className="h-2.5 bg-surface-2 rounded animate-pulse w-44" />
                    </div>
                    <div className="h-6 w-20 bg-surface-2 rounded-full animate-pulse" />
                    <div className="h-6 w-16 bg-surface-2 rounded animate-pulse" />
                    <div className="h-8 w-20 bg-surface-2 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-surface-2 rounded-full animate-pulse" />
                    <div className="h-8 w-20 bg-surface-2 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="text-center py-14">
                <Users className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-text-muted text-sm">No users found</p>
                {(userSearch || roleFilter !== 'all' || statusFilter !== 'all') && (
                  <button onClick={() => { setUserSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                    className="mt-2 text-xs text-brand font-semibold">Clear filters</button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-[2.2fr_1.4fr_1fr_1fr_1fr_1.2fr] gap-4 px-5 py-3 border-b border-border bg-surface-2/60">
                  {['USER', 'USERNAME', 'ROLE', 'JOINED', 'STATUS', 'ACTION'].map(h => (
                    <p key={h} className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{h}</p>
                  ))}
                </div>
                <div className="divide-y divide-border">
                  {filteredRoster.map(p => {
                    const initials = (p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    const isRowSA = p._user?.isSuperAdmin || p.email?.toLowerCase() === 'divyanshuniyal185@gmail.com' || p.username?.toLowerCase() === 'divyansh';
                    const avatarColor =
                      isRowSA                            ? 'god-avatar'
                      : p.role === 'admin'               ? 'bg-rose-500/15 text-rose-500'
                      : p.role === 'manager'             ? 'bg-brand/15 text-brand'
                      : p.role === 'factory-manager'     ? 'bg-amber-500/15 text-amber-500'
                      : p.role === 'quality-inspector'   ? 'bg-teal-500/15 text-teal-500'
                      : p.role === 'dispatch-coordinator'? 'bg-blue-500/15 text-blue-500'
                      :                                   'bg-surface-2 text-text-muted';
                    const joinDate = p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                      : '--';
                    return (
                      <div key={p._id}
                        className="grid grid-cols-1 md:grid-cols-[2.2fr_1.4fr_1fr_1fr_1fr_1.2fr] gap-2 md:gap-4 items-center px-5 py-3.5 hover:bg-surface-2/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 ${avatarColor}`}>{initials}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{p.name}</p>
                            <p className="text-xs text-text-muted truncate">{p.email}</p>
                          </div>
                        </div>
                        <div>
                          {p.username
                            ? <span className="px-2.5 py-1 bg-surface-2 border border-border rounded-lg text-[11px] font-mono text-text-muted">@{p.username}</span>
                            : <span className="text-[10px] text-text-muted italic opacity-60">Not activated</span>}
                        </div>
                        {isRowSA ? (
                          /* ── GOD badge — animated gold shimmer, Super Admin only ── */
                          <span className="god-badge-wrap" title="System Owner — Super Admin">
                            <span className="god-badge-text">⚡ GOD</span>
                          </span>
                        ) : (
                          <span className={`w-fit px-2.5 py-1 rounded-lg text-[10px] font-bold border ${ROLE_STYLE[p.role] || 'bg-surface-2 text-text-muted border-border'}`}>
                            {ROLE_LABEL[p.role] || p.role || '--'}
                          </span>
                        )}
                        <p className="text-xs text-text-muted hidden md:block">{joinDate}</p>
                        <div>
                          {p.kind === 'user' && p.isActive    && <p className="text-xs font-semibold text-green-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Active</p>}
                          {p.kind === 'user' && !p.isActive   && <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Inactive</p>}
                          {p.kind === 'invite'                 && <p className="text-xs font-semibold text-blue-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />Invite Sent</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Super Admin owner shield — shown alongside GOD role badge */}
                          {isRowSA && (
                            <span className="px-2 py-1 rounded-lg text-[9px] font-black bg-yellow-500/8 text-yellow-500/80 border border-yellow-500/20 uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
                              👑 Owner
                            </span>
                          )}

                          {/* Role change dropdown — admin+SA only, not on super-admin row, not in read-only mode */}
                          {p.kind === 'user' && !isRowSA && isAdmin && (
                            roleChangeId === p._id ? (
                              <div className="flex items-center gap-1">
                                <select
                                  value={roleChangeVal}
                                  onChange={e => setRoleChangeVal(e.target.value)}
                                  className="text-xs bg-surface-2 border border-border rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                                >
                                  {['factory-manager','quality-inspector','dispatch-coordinator','manager']
                                    .concat(isSuperAdmin ? ['admin'] : [])
                                    .map(r => <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>)
                                  }
                                </select>
                                <button
                                  onClick={() => handleChangeRole(p._id, roleChangeVal)}
                                  disabled={roleChanging === p._id || !roleChangeVal || roleChangeVal === p.role}
                                  className="px-2 py-1.5 bg-brand text-white text-xs font-bold rounded-lg disabled:opacity-50"
                                >
                                  {roleChanging === p._id ? '…' : 'Save'}
                                </button>
                                <button onClick={() => setRoleChangeId(null)} className="p-1.5 border border-border text-text-muted text-xs rounded-lg">✕</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setRoleChangeId(p._id); setRoleChangeVal(p.role); }}
                                className="px-2.5 py-1.5 border border-border text-text-muted hover:text-brand hover:border-brand/30 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
                                title="Change role"
                              >
                                <Pencil className="w-3 h-3" /> Role
                              </button>
                            )
                          )}

                          {/* Enable/Disable toggle — admin+SA, not on super-admin row, not read-only */}
                          {p.kind === 'user' && !isRowSA && isAdmin && (
                            <button onClick={() => handleToggle(p._user._id)} disabled={togglingId === p._user._id}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 ${
                                p.isActive ? 'border-red-400/30 text-red-500 hover:bg-red-500/5' : 'border-green-400/30 text-green-500 hover:bg-green-500/5'
                              }`}>
                              {togglingId === p._user._id ? '...' : p.isActive ? 'Disable' : 'Enable'}
                            </button>
                          )}

                          {/* Delete button — admin+SA, not on super-admin row, not read-only */}
                          {p.kind === 'user' && !p._user?.isSuperAdmin && isAdmin && (
                            deleteId === p._id ? (
                              <div className="flex flex-col gap-1 p-2 bg-surface-2 border border-red-500/20 rounded-lg">
                                {isSuperAdmin ? (
                                  <>
                                    <p className="text-[10px] text-red-400 font-semibold">Type username to confirm permanent delete:</p>
                                    <input
                                      value={deleteConfirm}
                                      onChange={e => setDeleteConfirm(e.target.value)}
                                      placeholder={p._user.username}
                                      className="text-xs bg-surface border border-border rounded px-2 py-1 text-text-primary w-32 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleDeleteUser(p._id, p._user.username)}
                                        disabled={deleteConfirm !== p._user.username || deleting === p._id}
                                        className="flex-1 py-1 bg-red-500 text-white text-xs font-bold rounded-lg disabled:opacity-40"
                                      >{deleting === p._id ? '…' : '⚠️ Hard Delete'}</button>
                                      <button onClick={() => { setDeleteId(null); setDeleteConfirm(''); }} className="px-2 py-1 border border-border text-text-muted text-xs rounded-lg">Cancel</button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-[10px] text-amber-400 font-semibold">Move to Recycle Bin?</p>
                                    <input
                                      value={deleteNote}
                                      onChange={e => setDeleteNote(e.target.value)}
                                      placeholder="Reason (optional)"
                                      className="text-xs bg-surface border border-border rounded px-2 py-1 text-text-primary w-40 focus:outline-none"
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleDeleteUser(p._id, p._user.username)}
                                        disabled={deleting === p._id}
                                        className="flex-1 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                                      >{deleting === p._id ? '…' : 'Confirm'}</button>
                                      <button onClick={() => { setDeleteId(null); setDeleteNote(''); }} className="px-2 py-1 border border-border text-text-muted text-xs rounded-lg">Cancel</button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteId(p._id)}
                                className="p-1.5 border border-red-400/20 text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
                                title={isSuperAdmin ? 'Permanently delete user' : 'Move to Recycle Bin'}
                              >
                                <Archive className="w-3 h-3" />
                              </button>
                            )
                          )}
                          {p.kind === 'invite' && (
                            isAdmin ? (
                              removeId === p._id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleRemove(p._id, p.name)} disabled={removeLoad === p._id}
                                    className="px-2.5 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg disabled:opacity-50">
                                    {removeLoad === p._id ? '...' : 'Confirm'}
                                  </button>
                                  <button onClick={() => setRemoveId(null)} className="px-2 py-1.5 border border-border text-text-muted text-xs rounded-lg">x</button>
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => setInviteLink({ id: p._id, link: `${window.location.origin}/invite?token=`, name: p.name, emailSent: false })}
                                    className="px-2.5 py-1.5 border border-brand/30 text-brand hover:bg-brand/5 text-xs font-bold rounded-lg flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Resend
                                  </button>
                                  <button onClick={() => setRemoveId(p._id)}
                                    className="p-1.5 border border-red-400/20 text-red-400 hover:bg-red-500/5 rounded-lg" title="Remove">
                                    <Archive className="w-3 h-3" />
                                  </button>
                                </>
                              )
                            ) : (
                              // Manager read-only: show status label, no actions
                              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/8 border border-amber-500/20 text-[10px] font-semibold text-amber-500/75">
                                <Eye className="w-3 h-3 flex-shrink-0" /> View only
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 py-3 border-t border-border bg-surface-2/60">
                  <p className="text-xs text-text-muted">
                    Showing <span className="font-semibold text-text-primary">{filteredRoster.length}</span> of{' '}
                    <span className="font-semibold text-text-primary">{rosterRows.length}</span> users
                    {peopleFromRequests.filter(p => p.reqStatus === 'approved').length > 0 && (
                      <span className="ml-3 text-blue-500 font-semibold">
                        {peopleFromRequests.filter(p => p.reqStatus === 'approved').length} invite sent
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ══ VIEW: Recycle Bin (Super Admin Only) ══ */}
      {activeView === 'deleted' && isSuperAdmin && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-red-500/5">
            <div>
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">🗑️ Recycle Bin — Soft-Deleted Users</h3>
              <p className="text-xs text-text-muted mt-0.5">Users deleted by Admins. You can restore or permanently remove.</p>
            </div>
            <button onClick={fetchDeletedUsers} className="p-2 text-text-muted hover:text-brand rounded-lg transition-colors"><RefreshCw className="w-4 h-4" /></button>
          </div>
          {loadingDeleted ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : deletedUsers.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-text-muted text-sm">Recycle Bin is empty.</p>
              <p className="text-xs text-text-muted mt-1 opacity-60">Users soft-deleted by Admins will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {deletedUsers.map(u => (
                <div key={u._id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-surface-2/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-[11px] font-black text-red-400 flex-shrink-0">
                        {(u.name || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{u.name}</p>
                        <p className="text-xs text-text-muted">{u.email} · <span className="font-mono">@{u.username}</span></p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 ml-10">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ROLE_STYLE[u.role] || 'bg-surface-2 text-text-muted border-border'}`}>{ROLE_LABEL[u.role] || u.role}</span>
                      <span className="text-[10px] text-text-muted">Deleted by <strong>{u.deletedBy}</strong> · {u.deletedAt ? new Date(u.deletedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' }) : '—'}</span>
                      {u.deleteNote && <span className="text-[10px] text-text-muted italic">Reason: {u.deleteNote}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRestore(u._id)}
                      disabled={restoring === u._id}
                      className="px-3 py-1.5 border border-green-500/30 text-green-500 hover:bg-green-500/5 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                    >{restoring === u._id ? '…' : '↩ Restore'}</button>
                    {hardDeleting === u._id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={hardConfirm}
                          onChange={e => setHardConfirm(e.target.value)}
                          placeholder={u.username}
                          className="text-xs bg-surface border border-red-500/30 rounded px-2 py-1 text-text-primary w-28 focus:outline-none"
                        />
                        <button
                          onClick={() => handleHardDelete(u._id, u.username)}
                          disabled={hardConfirm !== u.username}
                          className="px-2 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg disabled:opacity-40"
                        >Delete</button>
                        <button onClick={() => { setHardDeleting(null); setHardConfirm(''); }} className="p-1.5 border border-border text-text-muted rounded-lg text-xs">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setHardDeleting(u._id); setHardConfirm(''); }}
                        className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/5 text-xs font-bold rounded-lg transition-all"
                        title="Permanently remove from database"
                      >💀 Hard Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ VIEW: Access Requests ══ */}
      {activeView === 'requests' && (() => {
        const visibleRequests = requests.filter(r =>
          reqFilter === 'all' ? true : r.status === reqFilter
        );
        const reqTabs = [
          { id: 'pending',  label: 'Pending',  count: pending.length,  pulse: pending.length > 0 },
          { id: 'approved', label: 'Approved', count: approved.length },
          { id: 'rejected', label: 'Rejected', count: rejected.length },
          { id: 'all',      label: 'All',      count: requests.length },
        ];
        return (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {/* Filter tabs */}
            <div className="flex gap-0 px-4 border-b border-border overflow-x-auto">
              {reqTabs.map(t => (
                <button key={t.id} onClick={() => setReqFilter(t.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                    reqFilter === t.id ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}>
                  {t.pulse && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                  {t.label}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    reqFilter === t.id ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-text-muted'
                  }`}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* Cards */}
            <div className="p-4">
              {loadingR ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-surface-2 rounded-xl animate-pulse" />)}
                </div>
              ) : visibleRequests.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                  <p className="text-text-muted text-sm">No {reqFilter === 'all' ? '' : reqFilter} requests</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {visibleRequests.map(r => (
                      <div key={r._id}
                        className={`bg-surface border rounded-xl p-4 transition-all ${
                          r.status === 'pending'  ? 'border-l-4 border-l-amber-500 border-border'
                          : r.status === 'approved' ? 'border-l-4 border-l-green-500 border-border'
                          :                           'border-l-4 border-l-red-400 border-border'
                        }`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-text-primary text-sm truncate">{r.name}</p>
                            <p className="text-xs text-text-muted truncate">{r.email}</p>
                          </div>
                          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                            STATUS_BADGE[r.status] || 'bg-surface-2 text-text-muted border-border'
                          }`}>{r.status}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${ROLE_STYLE[r.role] || 'bg-surface-2 text-text-muted border-border'}`}>
                            {ROLE_LABEL[r.role] || r.role}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {r.approvedBy && (
                          <p className="text-[10px] text-text-muted mb-2">By: {r.approvedBy}</p>
                        )}

                        {r.status === 'pending' && (
                          isAdmin ? (
                            // Admin/SuperAdmin: show Approve + Reject action buttons
                            rejectId === r._id ? (
                              <div className="space-y-1.5">
                                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                                  placeholder="Rejection reason (optional)" rows={2}
                                  className="w-full px-3 py-2 text-xs bg-surface-2 border border-border rounded-lg text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30" />
                                <div className="flex gap-2">
                                  <button onClick={() => handleReject(r._id)} disabled={actionLoad === r._id}
                                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50">
                                    {actionLoad === r._id ? '...' : 'Confirm Reject'}
                                  </button>
                                  <button onClick={() => { setRejectId(null); setRejectNote(''); }}
                                    className="px-3 py-2 border border-border text-text-muted text-xs rounded-lg hover:bg-surface-2">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handleApprove(r._id, r.name)} disabled={actionLoad === r._id}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {actionLoad === r._id ? '...' : 'Approve'}
                                </button>
                                <button onClick={() => setRejectId(r._id)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-400/30 text-red-500 hover:bg-red-500/5 text-xs font-bold rounded-lg transition-all">
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            )
                          ) : (
                            // Manager: read-only indicator instead of action buttons
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/20">
                              <Eye className="w-3 h-3 text-amber-500/70 flex-shrink-0" />
                              <span className="text-[10px] font-semibold text-amber-500/80">Pending — Admin action required</span>
                            </div>
                          )
                        )}

                        {(r.status === 'approved' || r.status === 'rejected') && isAdmin && (
                          <div className="flex items-center justify-between mt-1">
                            {r.status === 'approved' && (
                              <button
                                onClick={() => setInviteLink({ id: r._id, link: `${window.location.origin}/invite?token=`, name: r.name, emailSent: false })}
                                className="text-[10px] text-brand hover:text-brand-hover font-semibold transition-colors">
                                Resend Invite
                              </button>
                            )}
                            {r.status !== 'approved' && <span />}
                            {removeId === r._id ? (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => handleRemove(r._id, r.name)} disabled={removeLoad === r._id}
                                  className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg disabled:opacity-50">
                                  {removeLoad === r._id ? '...' : 'Confirm'}
                                </button>
                                <button onClick={() => setRemoveId(null)} className="px-2 py-1 border border-border text-text-muted text-[10px] rounded-lg">x</button>
                              </div>
                            ) : (
                              <button onClick={() => setRemoveId(r._id)}
                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:text-red-500 hover:bg-red-500/5 border border-red-400/20 hover:border-red-400/40 rounded-lg transition-all">
                                <Archive className="w-3 h-3" /> Remove
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-text-muted">
                      {visibleRequests.length} {reqFilter === 'all' ? 'total' : reqFilter} request{visibleRequests.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
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


function DashboardInner() {
  const { id: tabParam } = Object.fromEntries(new URLSearchParams(window.location.search));
  const [activeTab, setActiveTab]           = useState(tabParam || 'overview');

  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem('hs_sidebar_collapsed') === 'true'
  );
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('hs_sidebar_collapsed', String(next));
      return next;
    });
  };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchToDispatch, setBatchToDispatch] = useState(null);
  const [batchesFilter, setBatchesFilter]     = useState('all'); // cross-tab filter from Overview
  const [drawerBatch, setDrawerBatch]         = useState(null);  // open detail drawer
  const [drawerOnArchived, setDrawerOnArchived] = useState(null); // callback after archive from drawer
  const { logout, getUser }                   = useAuth();
  const user                                  = getUser(); // { username, name, role, isSuperAdmin }
  const userIsSuperAdmin                      = !!user?.isSuperAdmin || user?.email?.toLowerCase() === 'divyanshuniyal185@gmail.com' || user?.username?.toLowerCase() === 'divyansh';
  const { batches, loading, createBatch, downloadQR, dispatchBatch, fetchBatches } = useBatches();

  // ── Walkthrough integration ──────────────────────────────────
  const { registerTabSwitcher, openHelp, nudgeMode } = useWalkthrough();
  const hasSeen = !!localStorage.getItem(`hs_tour_seen_${user?.role}`);

  // Register tab-switcher so tour can navigate tabs
  useEffect(() => {
    registerTabSwitcher((tabId) => setActiveTab(tabId));
  }, [registerTabSwitcher]);

  // "Explore Myself" nudge — pulse the role's key element for 3.5s
  useEffect(() => {
    if (!nudgeMode) {
      document.querySelectorAll('[data-tour-nudge]').forEach(el => el.removeAttribute('data-tour-nudge'));
      return;
    }
    const nudgeMap = {
      'factory-manager':      'new-batch-btn',
      'quality-inspector':    'kpi-grid',
      'dispatch-coordinator': 'fefo-table',
      'manager':              'kpi-grid',
      'admin':                'new-batch-btn',
      'super-admin':          'kpi-grid',
    };
    const targetSelector = nudgeMap[user?.role] || 'kpi-grid';
    const tabMap = { 'new-batch-btn': 'batches', 'fefo-table': 'fefo', 'qr-grid': 'qr' };
    setActiveTab(tabMap[targetSelector] || 'overview');
    setTimeout(() => {
      const el = document.querySelector(`[data-tour="${targetSelector}"]`);
      if (el) { el.setAttribute('data-tour-nudge', 'true'); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    }, 400);
  }, [nudgeMode, user?.role]);

  // Connect to WebSocket for real-time batch updates across all dashboard tabs
  useSocket();

  // Navigate to a tab, optionally pre-set a filter (e.g. from Overview status pills)
  function handleTabSwitch(tabId, filter = 'all') {
    if (tabId === 'batches') setBatchesFilter(filter);
    setActiveTab(tabId);
  }

  // Filter NAV_TABS based on role tier:
  //   - Super Admin + Admin: full admin tab + all tabs
  //   - Manager: admin tab visible (read-only) + all tabs
  //   - Others (factory-manager, quality-inspector, dispatch-coordinator): no admin tab
  const visibleTabs = NAV_TABS.filter(t => {
    if (!t.adminOnly) return true;
    return userIsSuperAdmin || user?.role === 'admin' || user?.role === 'manager';
  });



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
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      {/* Welcome modal + Tour engine — rendered at root level */}
      <WelcomeChoiceModal user={user} />
      <WalkthroughTour userRole={user?.role} />

      <Navbar onMenuClick={() => setIsSidebarOpen(v => !v)} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 overflow-hidden" style={{ marginTop: '72px', height: 'calc(100vh - 72px)' }}>
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Sidebar — always fixed, slides in on mobile, collapses to icon-rail on desktop */}
        <aside
          className={`
            sidebar-premium flex flex-col
            fixed top-[72px] left-0 bottom-0 z-30 transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isSidebarCollapsed ? 'md:w-16' : 'md:w-56'}
            w-56
          `}
        >
          {/* Mountain watermark */}
          <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="white">
              <polygon points="100,20 180,160 20,160" opacity="0.4"/>
              <polygon points="60,60 130,160 0,160" opacity="0.3"/>
              <polygon points="140,50 200,160 90,160" opacity="0.3"/>
            </svg>
          </div>

          {/* ── ZONE 1: Brand mark + inline collapse toggle ── */}
          <div className="flex-shrink-0 px-3 pt-4 pb-3 overflow-hidden">
            <div className={`flex items-center gap-2 px-2 py-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              {/* Brand icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-lg bg-brand/30 blur-[6px]" />
                <div className="relative w-7 h-7 bg-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/40">
                  <Leaf className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Brand name — hidden when collapsed */}
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-white text-xs font-bold leading-tight tracking-wide truncate">HimShakti</p>
                  <p className="text-white/35 text-[9px] leading-tight tracking-widest uppercase truncate">Operations</p>
                </div>
              )}

              {/* Collapse toggle — desktop only, inline in header */}
              <button
                onClick={toggleSidebarCollapse}
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={`hidden md:flex flex-shrink-0 items-center justify-center rounded-lg
                  w-6 h-6 text-white/30 hover:text-white hover:bg-white/10
                  transition-all duration-200 ${isSidebarCollapsed ? 'mt-0' : ''}`}
              >
                {isSidebarCollapsed
                  ? <ChevronRight className="w-3.5 h-3.5" />
                  : <ChevronLeft className="w-3.5 h-3.5" />
                }
              </button>
            </div>
            <div className="mt-3 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
          </div>

          {/* ── ZONE 2: Navigation — scrollable middle, clips x-overflow ── */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-0.5 px-2 py-2 relative">
            {!isSidebarCollapsed && (
              <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest px-2 mb-2">Navigation</p>
            )}
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const meta = TAB_META[tab.id];
              return (
                <button
                  key={tab.id}
                  data-tour={`${tab.id}-tab`}
                  onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                  title={isSidebarCollapsed ? tab.label : ''}
                  className={`relative group w-full flex items-center rounded-xl transition-all duration-200
                    ${isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                    text-sm font-medium ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.06]'
                    }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 8px rgba(0,0,0,0.20)'
                  } : {}}
                >
                  {isActive && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full shadow-[0_0_6px_currentColor] ${meta?.dot || 'bg-brand'}`} />
                  )}
                  <Icon className={`flex-shrink-0 w-4 h-4 transition-colors ${
                    isSidebarCollapsed ? '' : 'mr-3'
                  } ${
                    isActive ? 'text-white drop-shadow-sm' : 'text-white/35 group-hover:text-white/65'
                  }`} />
                  {!isSidebarCollapsed && tab.label}
                  {!isSidebarCollapsed && isActive && (
                    <span className={`ml-auto w-1.5 h-1.5 rounded-full ${meta?.dot || 'bg-brand'} shadow-[0_0_4px_currentColor]`} />
                  )}
                  {/* Collapsed tooltip */}
                  {isSidebarCollapsed && (
                    <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium
                      bg-[#1e2433] text-white border border-white/10 shadow-xl whitespace-nowrap
                      opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0
                      transition-all duration-200 z-50">
                      {tab.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── ZONE 3: Footer actions — always pinned at bottom ── */}
          <div className="flex-shrink-0 px-2 py-3 relative" style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 100%)',
            backdropFilter: 'blur(12px)',
          }}>
            {/* Help & Walkthrough */}
            <button
              id="sidebar-help-btn"
              onClick={openHelp}
              title={isSidebarCollapsed ? 'Help & Walkthrough' : ''}
              className={`relative group w-full flex items-center gap-3 rounded-xl text-sm font-medium
                transition-all duration-200 mb-1
                ${isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                ${
                  hasSeen
                    ? 'text-white/50 hover:bg-white/[0.06] hover:text-brand'
                    : 'text-brand/80 hover:bg-brand/10 hover:text-brand help-sidebar-btn-new'
                }`}
            >
              <HelpCircle className={`w-4 h-4 flex-shrink-0 transition-colors ${
                hasSeen ? 'text-white/25 group-hover:text-brand' : 'text-brand/60 group-hover:text-brand'
              }`} />
              {!isSidebarCollapsed && (
                <>
                  <span>Help &amp; Walkthrough</span>
                  {!hasSeen && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand/20 text-brand border border-brand/30 animate-pulse">NEW</span>
                  )}
                </>
              )}
              {isSidebarCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium
                  bg-[#1e2433] text-white border border-white/10 shadow-xl whitespace-nowrap
                  opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0
                  transition-all duration-200 z-50">
                  Help &amp; Walkthrough
                </span>
              )}
            </button>

            <div className="mx-2 my-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

            {/* Sign Out */}
            <button
              onClick={logout}
              title={isSidebarCollapsed ? 'Sign Out' : ''}
              className={`relative group w-full flex items-center gap-3 rounded-xl text-sm font-medium
                text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200
                ${isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}`}
            >
              <LogOut className="w-4 h-4 flex-shrink-0 text-white/20 group-hover:text-red-400 transition-colors" />
              {!isSidebarCollapsed && <span>Sign Out</span>}
              {isSidebarCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium
                  bg-[#1e2433] text-red-400 border border-white/10 shadow-xl whitespace-nowrap
                  opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0
                  transition-all duration-200 z-50">
                  Sign Out
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* Main — offset dynamically based on sidebar state */}
        <main
          className={`flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6 transition-all duration-300 ease-in-out ${TAB_META[activeTab]?.mainTint || ''}`}
          style={{ marginLeft: isSidebarCollapsed ? '4rem' : '14rem' }}
        >
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
                    className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-white/90 hover:bg-white text-slate-900 text-sm font-bold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 backdrop-blur-sm">
                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Batch</span><span className="sm:hidden">New</span>
                  </button>
                } />
                <BatchesTab
                  batches={batches}
                  loading={loading}
                  onNewBatch={() => setShowCreateModal(true)}
                  onDownloadQR={handleDownloadQR}
                  onDispatch={handleDispatch}
                  onOpenDrawer={(batch, onArchived) => {
                    setDrawerBatch(batch);
                    // Store as a function ref using setter form to avoid calling the fn immediately
                    setDrawerOnArchived(() => onArchived || null);
                  }}
                  onAfterArchive={fetchBatches}
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

        {/* Mobile Bottom Navigation — only visible on small screens */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t"
          style={{ height: 60, background: 'rgba(10,15,32,0.97)', borderTopColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const meta = TAB_META[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                  isActive ? 'opacity-100' : 'opacity-40 hover:opacity-65'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-white/14 shadow-inner'
                    : 'bg-transparent'
                }`}>
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? `${meta?.accentLight || 'text-white'}` : 'text-white/60'
                  }`} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide leading-none ${
                  isActive ? 'text-white' : 'text-white/40'
                }`}>
                  {tab.label === 'FEFO Queue' ? 'FEFO' : tab.label === 'AI Audit' ? 'AI' : tab.label === 'Admin Panel' ? 'Admin' : tab.label}
                </span>
              </button>
            );
          })}
        </nav>
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
      {drawerBatch && (
        <BatchDetailDrawer
          batch={batches.find(b => b._id === drawerBatch._id) || drawerBatch}
          onClose={() => { setDrawerBatch(null); setDrawerOnArchived(null); }}
          onRefresh={fetchBatches}
          onArchived={() => {
            setDrawerBatch(null);
            fetchBatches();
            drawerOnArchived?.();
            setDrawerOnArchived(null);
          }}
          onDispatch={() => { setDrawerBatch(null); setBatchToDispatch(drawerBatch); }}
          onDownloadQR={() => handleDownloadQR(drawerBatch._id, drawerBatch.batchCode)}
        />
      )}

      {/* Floating ? Help FAB — desktop only (hidden on mobile via CSS) */}
      <button
        id="help-fab-btn"
        onClick={openHelp}
        className={`help-fab ${hasSeen ? '' : 'help-fab--new-user'}`}
        aria-label="Help & Walkthrough"
        title="Help & Walkthrough"
      >
        <span className="help-fab-tooltip">Help &amp; Walkthrough</span>
        ?
      </button>
    </div>
  );
}

// ── Public export: wraps DashboardInner in WalkthroughProvider ────
export default function Dashboard() {
  const { getUser } = useAuth();
  const user = getUser();
  return (
    <WalkthroughProvider userRole={user?.role}>
      <DashboardInner />
    </WalkthroughProvider>
  );
}
