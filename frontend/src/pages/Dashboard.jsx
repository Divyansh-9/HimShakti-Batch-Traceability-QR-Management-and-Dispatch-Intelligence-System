import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CreateBatchModal from '../components/CreateBatchModal';
import DispatchModal from '../components/DispatchModal';
import { useBatches } from '../hooks/useBatches';
import { useDispatch } from '../hooks/useDispatch';
import { useAIAudit } from '../hooks/useAIAudit';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Package, Truck, QrCode, LayoutDashboard, Bot,
  LogOut, Download, AlertTriangle, CheckCircle, Clock, RefreshCw, Menu, Search, InboxIcon, Leaf, Plus
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
function OverviewTab({ batches, loading }) {
  const total      = batches.length;
  const dispatched = batches.filter(b => b.status === 'DISPATCHED').length;
  const urgent     = batches.filter(b => b.status === 'URGENT').length;
  const warning    = batches.filter(b => b.status === 'WARNING').length;

  const kpis = [
    { label: 'Total Batches',    value: total,      numVal: total,      icon: Package,       color: 'text-brand',     border: 'border-l-4 border-brand',       bg: 'bg-brand/5',       sub: 'across all product lines' },
    { label: 'Dispatched',       value: dispatched, numVal: dispatched, icon: Truck,         color: 'text-blue-500',  border: 'border-l-4 border-blue-500',    bg: 'bg-blue-500/5',    sub: 'shipments completed' },
    { label: 'Urgent / Warning', value: null,       numVal: null,       icon: AlertTriangle, color: 'text-amber-500', border: 'border-l-4 border-amber-500', bg: 'bg-amber-500/5',   sub: 'require attention',
      customValue: <><AnimatedStat value={urgent} /><span className="text-xl font-bold text-text-muted mx-1">/</span><AnimatedStat value={warning} /></> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-surface border border-border rounded-xl p-6 ${kpi.border} hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-sm font-medium">{kpi.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            {loading
              ? <div className="h-9 w-20 bg-surface-2 rounded animate-pulse" />
              : <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                  {kpi.customValue ?? <AnimatedStat value={kpi.numVal} />}
                </p>
            }
            <p className="text-xs text-text-muted mt-2 font-medium">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Recent Batches</h2>
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

// ── Tab: Batches (full table + QR download + scan count) ────
function BatchesTab({ batches, loading, onNewBatch, onDownloadQR, onDispatch }) {
  const [scanInfo, setScanInfo]       = useState({});
  const [loadingScans, setLoadingScans] = useState({});
  const [query, setQuery]             = useState('');
  const { getBatchScans }              = useBatches();

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

  const filtered = batches.filter(b =>
    !query ||
    b.batchCode?.toLowerCase().includes(query.toLowerCase()) ||
    b.productName?.toLowerCase().includes(query.toLowerCase()) ||
    b.farmerName?.toLowerCase().includes(query.toLowerCase()) ||
    b.status?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by code, product, farmer, status…"
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors"
          />
        </div>
        <button onClick={onNewBatch}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0">
          <Package className="w-4 h-4" /> + New Batch
        </button>
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
                          {query ? `No batches match "${query}"` : 'No batches yet'}
                        </p>
                        {query && (
                          <button onClick={() => setQuery('')} className="text-xs text-brand hover:text-brand-hover">
                            Clear search
                          </button>
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
                  <td className="px-4 py-4 text-sm text-text-muted">{b.daysUntilExpiry} days</td>
                  <td className="px-4 py-4 text-sm text-text-muted">{b.farmerName}, {b.village}</td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {loadingScans[b._id]
                      ? '...'
                      : scanInfo[b._id]
                        ? `${scanInfo[b._id].totalScans} scans`
                        : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onDownloadQR(b._id, b.batchCode)}
                        title="Download QR"
                        className="p-1.5 text-text-muted hover:text-brand hover:bg-brand/10 rounded-md transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      {b.status !== 'DISPATCHED' && (
                        <button
                          onClick={() => onDispatch(b)}
                          title="Mark Dispatched"
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
    </div>
  );
}

// ── Tab: FEFO Dispatch Queue ─────────────────────────────────
function FEFOTab() {
  const { queue, loading, error, refetch } = useDispatch();

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">FEFO Dispatch Priority Queue</h2>
          <p className="text-xs text-text-muted mt-0.5">First Expired → First Out. Dispatch from top.</p>
        </div>
        <button onClick={refetch} className="p-1.5 text-text-muted hover:text-brand rounded-md transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {error && <div className="p-4 text-red-400 text-sm">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-2">
            <tr>
              {['Priority', 'Batch Code', 'Product', 'Expiry', 'Days Left', 'Score'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
              : queue.map((b, idx) => (
                <tr key={b._id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-text-muted">#{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-mono font-medium text-brand">{b.batchCode}</td>
                  <td className="px-6 py-4 text-sm text-text-muted">{b.productName}</td>
                  <td className="px-6 py-4 text-sm text-text-muted">{new Date(b.expiryDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-4 text-sm font-semibold text-text-primary">{b.priorityScore?.toFixed(1)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: QR Management ──────────────────────────────────────
function QRTab({ batches, loading, onDownloadQR }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {loading
        ? [...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-surface-2 rounded w-1/2 mb-3" />
            <div className="h-3 bg-surface-2 rounded w-3/4 mb-2" />
            <div className="h-8 bg-surface-2 rounded w-full mt-4" />
          </div>
        ))
        : batches.filter(b => b.status !== 'DISPATCHED').map(b => (
          <div key={b._id} className="bg-surface border border-border rounded-xl p-5 hover:border-brand/50 transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-4 h-4 text-brand flex-shrink-0" />
              <p className="text-sm font-mono font-medium text-text-primary truncate">{b.batchCode}</p>
            </div>
            <p className="text-xs text-text-muted mb-1 truncate">{b.productName}</p>
            <div className="flex items-center justify-between mt-3">
              <StatusBadge status={b.status} />
              <button
                onClick={() => onDownloadQR(b._id, b.batchCode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/10 rounded-lg transition-colors border border-brand/20 hover:border-brand/40">
                <Download className="w-3.5 h-3.5" /> Download QR
              </button>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ── Tab: AI Audit ───────────────────────────────────────────
function AIAuditTab() {
  const { report, fromCache, generatedAt, loading, error, runAudit } = useAIAudit();

  function getCacheLabel() {
    if (!fromCache || !generatedAt) return null;
    const cacheHours = 4;
    const elapsed    = (Date.now() - generatedAt.getTime()) / 3600000;
    const remaining  = Math.max(0, cacheHours - elapsed);
    const h          = Math.floor(remaining);
    const m          = Math.round((remaining - h) * 60);
    return `Report from ${generatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · Cached (refreshes in ${h}h ${m}m)`;
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">AI Dispatch Audit</h2>
            <p className="text-xs text-text-muted">Powered by Gemini 2.5 Flash · NVIDIA fallback</p>
          </div>
        </div>
        <button
          onClick={runAudit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          {loading ? 'Running Audit...' : 'Run Audit'}
        </button>
      </div>

      <div className="p-6">
        {!report && !loading && !error && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
            <p className="text-text-muted text-sm">Click "Run Audit" to generate an AI dispatch advisory report.</p>
            <p className="text-text-muted text-xs mt-1 opacity-60">Results are cached for 4 hours.</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`h-3 bg-surface-2 rounded animate-pulse ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {report && !loading && (
          <>
            {fromCache && (
              <div className="flex items-center gap-2 mb-4 text-xs text-text-muted bg-surface-2 px-3 py-2 rounded-lg border border-border">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                {getCacheLabel()}
              </div>
            )}
            <div className="prose prose-sm max-w-none text-text-muted leading-relaxed whitespace-pre-wrap text-sm">
              {report}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────
const NAV_TABS = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'batches',   label: 'Batches',   icon: Package },
  { id: 'fefo',      label: 'FEFO Queue',icon: Truck },
  { id: 'qr',        label: 'QR Codes',  icon: QrCode },
  { id: 'ai',        label: 'AI Audit',  icon: Bot },
];

export default function Dashboard() {
  const [activeTab, setActiveTab]           = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchToDispatch, setBatchToDispatch] = useState(null); // DispatchModal state
  const { logout }                            = useAuth();
  const { batches, loading, createBatch, downloadQR, dispatchBatch } = useBatches();

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
              {NAV_TABS.map(tab => {
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
                <OverviewTab batches={batches} loading={loading} />
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
                <AIAuditTab />
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
