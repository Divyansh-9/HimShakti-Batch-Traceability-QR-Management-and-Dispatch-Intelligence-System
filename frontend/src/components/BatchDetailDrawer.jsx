/**
 * BatchDetailDrawer.jsx — Premium redesign
 *
 * Improvements over v1:
 * - Full theme-aware (light + dark) using CSS variables only — no hardcoded colors
 * - Rich hero header with status color strip + key metric pills
 * - Card-based layout instead of naked label/value grid
 * - Expiry urgency bar prominently displayed
 * - Quick action buttons (Dispatch, Download QR) in header
 * - Danger Zone moved to a dedicated section in the Notes tab only
 * - Better History timeline with color-coded event types
 * - Production metrics shown as visual mini-cards
 * - Fully responsive: right-panel on desktop, bottom-sheet on mobile
 *
 * RBAC:
 *   View      — all roles
 *   Edit note — admin, manager, factory-manager
 *   Archive   — admin only (typed confirmation)
 *   Restore   — admin only
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBatches } from '../hooks/useBatches';
import toast from 'react-hot-toast';
import {
  X, Package, Leaf, Calendar, BarChart2, Hash,
  QrCode, Truck, Clock, Activity, Pencil, Save,
  AlertTriangle, RotateCcw, Scan, Monitor,
  Smartphone, ExternalLink, Copy, Archive, History,
  CheckCircle, RefreshCw, Eye, Download, Zap,
  MapPin, User, ChevronRight, Box, FlaskConical, ShieldAlert,
  MessagesSquare,
} from 'lucide-react';
import MessageThread from './MessageThread';
import { useRecordThread, useMessageActions } from '../hooks/useMessages';

// ── Role gates ───────────────────────────────────────────────────────
const CAN_EDIT_NOTE   = ['admin', 'manager', 'factory-manager'];
const CAN_EDIT_RAW    = ['admin', 'manager', 'factory-manager'];
const CAN_DISPATCH    = ['admin', 'manager', 'dispatch-coordinator'];
const CAN_DELETE      = ['admin'];

// ── Status config ────────────────────────────────────────────────────
const STATUS_CFG = {
  URGENT:     { strip: 'bg-red-500',    badge: 'bg-red-500/15 text-red-500 border-red-500/25',    dot: 'bg-red-500',    label: 'Urgent',     glow: 'shadow-red-500/20' },
  WARNING:    { strip: 'bg-amber-500',  badge: 'bg-amber-500/15 text-amber-500 border-amber-500/25', dot: 'bg-amber-500', label: 'Warning',    glow: 'shadow-amber-500/20' },
  READY:      { strip: 'bg-emerald-500',badge: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25', dot: 'bg-emerald-500', label: 'Ready', glow: 'shadow-emerald-500/20' },
  DISPATCHED: { strip: 'bg-blue-500',   badge: 'bg-blue-500/15 text-blue-500 border-blue-500/25', dot: 'bg-blue-500',   label: 'Dispatched', glow: 'shadow-blue-500/20' },
  EXPIRED:    { strip: 'bg-rose-700',   badge: 'bg-rose-700/15 text-rose-500 border-rose-500/25', dot: 'bg-rose-500',   label: 'Expired',    glow: 'shadow-rose-500/20' },
};

function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CFG[status] || { badge: 'bg-surface-2 text-text-muted border-border', dot: 'bg-text-muted', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-bold ${size === 'sm' ? 'text-xs' : 'text-[10px]'} ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Inline input for raw-material editing ───────────────────────────
function RawField({ label, name, value, onChange, type = 'text', suffix = '' }) {
  return (
    <div className="bg-background rounded-xl p-3 border border-brand/30 flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">{label}</p>
      <div className="flex items-center gap-1">
        <input
          type={type}
          name={name}
          defaultValue={value}
          onChange={onChange}
          step={type === 'number' ? 'any' : undefined}
          className="flex-1 min-w-0 bg-transparent text-sm font-bold text-text-primary focus:outline-none"
        />
        {suffix && <span className="text-xs text-text-muted flex-shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Raw Material editable section ───────────────────────────────────
function RawMaterialSection({ batch, canEdit, onUpdated }) {
  const { updateRawMaterial } = useBatches();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [draft, setDraft]     = useState({});

  function startEdit() {
    setDraft({
      farmerName:       batch.farmerName       || '',
      village:          batch.village          || '',
      sourceLotCode:    batch.sourceLotCode    || '',
      quantityProduced: batch.quantityProduced || '',
      unit:             batch.unit             || 'Kg',
      yieldPercent:     batch.yieldPercent     ?? '',
      dataSource:       batch.dataSource       || '',
    });
    setEditing(true);
  }

  function handleChange(e) {
    setDraft(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    // Filter out unchanged values
    const changed = {};
    for (const [k, v] of Object.entries(draft)) {
      const orig = batch[k];
      if (String(v).trim() !== String(orig ?? '').trim()) {
        changed[k] = v;
      }
    }
    if (Object.keys(changed).length === 0) { setEditing(false); return; }

    setSaving(true);
    try {
      await updateRawMaterial(batch._id, changed);
      toast.success('Raw material data updated');
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="border border-brand/20 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-brand/15 bg-brand/5 flex items-center justify-between">
          <p className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-1.5">
            <Leaf className="w-3 h-3" /> Editing Raw Material Source
          </p>
          <span className="text-[10px] text-text-muted">Changes are logged</span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          <RawField label="Farmer Name" name="farmerName" value={draft.farmerName} onChange={handleChange} />
          <RawField label="Village"     name="village"     value={draft.village}     onChange={handleChange} />
          <RawField label="Lot Code"    name="sourceLotCode" value={draft.sourceLotCode} onChange={handleChange} />
          <div className="flex gap-1.5">
            <div className="flex-1">
              <RawField label="Quantity" name="quantityProduced" value={draft.quantityProduced} onChange={handleChange} type="number" />
            </div>
            <div className="w-20">
              <RawField label="Unit" name="unit" value={draft.unit} onChange={handleChange} />
            </div>
          </div>
          <RawField label="Yield %"    name="yieldPercent" value={draft.yieldPercent} onChange={handleChange} type="number" suffix="%" />
          <RawField label="Data Source" name="dataSource"  value={draft.dataSource}  onChange={handleChange} />
        </div>
        <div className="px-3 pb-3 flex gap-2">
          <button onClick={() => setEditing(false)}
            className="flex-1 py-2 text-xs font-medium text-text-muted border border-border rounded-lg hover:bg-surface-2 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
            {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
          <Leaf className="w-3 h-3" /> Raw Material Source
        </p>
        {canEdit && (
          <button onClick={startEdit}
            className="flex items-center gap-1 text-xs text-brand hover:text-brand-hover font-semibold transition-colors">
            <Pencil className="w-3 h-3" /> Correct
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoCard icon={User}      label="Farmer"    value={batch.farmerName} />
        <InfoCard icon={MapPin}    label="Village"   value={batch.village} />
        <InfoCard icon={Hash}      label="Lot Code"  value={batch.sourceLotCode} mono />
        <InfoCard icon={Box}       label="Quantity"  value={batch.quantityProduced ? `${batch.quantityProduced} ${batch.unit}` : '—'} />
        <InfoCard icon={BarChart2} label="Yield %"   value={batch.yieldPercent !== undefined ? `${batch.yieldPercent}%` : '—'} accent />
        <InfoCard icon={Zap}       label="Data Src"  value={batch.dataSource} />
      </div>
    </div>
  );
}

// ── Tiny info card ───────────────────────────────────────────────────
function InfoCard({ icon: Icon, label, value, mono = false, accent = false }) {
  if (!value && value !== 0) return null;
  return (
    <div className="bg-background rounded-xl p-3 border border-border flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3 h-3 flex-shrink-0 ${accent ? 'text-brand' : 'text-text-muted'}`} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted truncate">{label}</p>
      </div>
      <p className={`text-sm font-bold text-text-primary truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

// ── Expiry urgency bar ───────────────────────────────────────────────
function ExpiryBar({ days, status }) {
  const pct = Math.max(0, Math.min(100, (days / 30) * 100));
  const barColor = status === 'URGENT' ? 'bg-red-500' : status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500';
  const isExpired = days !== null && days < 0;

  if (days === null) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Shelf Life Remaining</p>
        <span className={`text-xs font-black ${status === 'URGENT' ? 'text-red-500' : status === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'}`}>
          {isExpired ? `Expired ${Math.abs(days)}d ago` : `${days} days left`}
        </span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: isExpired ? '100%' : `${Math.max(4, pct)}%` }}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ══════════════════════════════════════════════════════════════
function OverviewTab({ batch, scanData, loadingScans, onDispatch, onDownloadQR, canDispatch, canEditRaw, onRefresh }) {
  const [qrSrc, setQrSrc]       = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [showQR, setShowQR]     = useState(false);

  const traceUrl = `${window.location.origin}/trace/${batch.batchCode}`;
  const cfg = STATUS_CFG[batch.status] || {};

  async function loadQR() {
    if (qrSrc) { setShowQR(v => !v); return; }
    setLoadingQR(true);
    try {
      const res = await fetch(`/api/batches/${batch._id}/qr`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hs_token')}` }
      });
      const data = await res.json();
      setQrSrc(data.data?.qrCodeDataUrl || null);
      setShowQR(true);
    } catch { /* silent */ }
    finally { setLoadingQR(false); }
  }

  function copyTraceLink() {
    navigator.clipboard.writeText(traceUrl)
      .then(() => toast.success('Trace link copied!'))
      .catch(() => toast.error('Copy failed'));
  }

  function copyBatchCode() {
    navigator.clipboard.writeText(batch.batchCode)
      .then(() => toast.success('Batch code copied'))
      .catch(() => {});
  }

  const packDateFmt   = batch.packDate   ? new Date(batch.packDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const expiryDateFmt = batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-5">

      {/* ── Expiry urgency bar ── */}
      {batch.daysUntilExpiry !== undefined && (
        <div className="bg-surface-2 rounded-xl p-3 border border-border">
          <ExpiryBar days={batch.daysUntilExpiry} status={batch.status} />
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="flex gap-2">
        <button
          onClick={copyTraceLink}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface-2 hover:bg-border border border-border rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary transition-all"
        >
          <Copy className="w-3.5 h-3.5" /> Copy Trace Link
        </button>
        <button
          onClick={onDownloadQR}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface-2 hover:bg-border border border-border rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Download QR
        </button>
        {canDispatch && batch.status !== 'DISPATCHED' && (
          <button
            onClick={onDispatch}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-500 transition-all"
          >
            <Truck className="w-3.5 h-3.5" /> Dispatch
          </button>
        )}
      </div>

      {/* ── Batch Identity ── */}
      <div>
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Package className="w-3 h-3" /> Batch Identity
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background rounded-xl p-3 border border-border col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">Batch Code</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black font-mono text-brand">{batch.batchCode}</p>
              <button onClick={copyBatchCode} className="p-1 text-text-muted hover:text-brand transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <InfoCard icon={Box}          label="Product"          value={batch.productName} />
          <InfoCard icon={Hash}         label="SKU"              value={batch.sku} mono />
          <InfoCard icon={Calendar}     label="Pack Date"        value={packDateFmt} />
          <InfoCard icon={Calendar}     label="Expiry Date"      value={expiryDateFmt} />
          <InfoCard icon={FlaskConical} label="Shelf Life Src"   value={batch.shelfLifeSource} />
          <InfoCard icon={BarChart2}    label="Priority Score"   value={batch.priorityScore} />
        </div>
      </div>

      {/* ── Raw Material Source — editable ── */}
      <RawMaterialSection batch={batch} canEdit={canEditRaw} onUpdated={onRefresh} />

      {/* ── Dispatch block (if dispatched) ── */}
      {batch.status === 'DISPATCHED' && (
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Truck className="w-3 h-3" /> Dispatched
          </p>
          <div className="grid grid-cols-2 gap-2">
            <InfoCard icon={User}     label="Buyer"         value={batch.buyerName} />
            <InfoCard icon={Calendar} label="Dispatch Date" value={batch.dispatchDate ? new Date(batch.dispatchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
          </div>
        </div>
      )}

      {/* ── QR Preview ── */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-2">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <QrCode className="w-3 h-3" /> QR Code & Trace Link
          </p>
          <a href={traceUrl} target="_blank" rel="noreferrer"
            className="p-1 text-text-muted hover:text-brand transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="p-4 space-y-3">
          <button
            onClick={loadQR}
            disabled={loadingQR}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-text-muted hover:border-brand/40 hover:text-brand hover:bg-brand/5 transition-all"
          >
            {loadingQR ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            {showQR ? 'Hide QR Code' : loadingQR ? 'Loading…' : 'Preview QR Code'}
          </button>
          {showQR && qrSrc && (
            <div className="flex justify-center py-2">
              <div className="bg-white p-3 rounded-xl border border-border shadow-sm">
                <img src={qrSrc} alt={`QR — ${batch.batchCode}`} className="w-32 h-32" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Scan Analytics ── */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-2">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> Scan Analytics
          </p>
        </div>
        <div className="p-4">
          {loadingScans ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />)}
            </div>
          ) : scanData ? (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Scans', value: scanData.totalScans, icon: Scan, color: 'text-brand' },
                { label: 'Mobile',      value: scanData.breakdown?.mobile || 0, icon: Smartphone, color: 'text-emerald-500' },
                { label: 'Desktop',     value: scanData.breakdown?.desktop || 0, icon: Monitor, color: 'text-blue-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-surface-2 rounded-xl p-3 text-center border border-border">
                  <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                  <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-[9px] text-text-muted uppercase tracking-wide mt-0.5 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4 text-text-muted">
              <Scan className="w-8 h-8 opacity-20" />
              <p className="text-xs">No scans recorded yet</p>
            </div>
          )}
          {scanData?.lastScanAt && (
            <p className="text-[10px] text-text-muted mt-2 text-center">
              Last scanned: {new Date(scanData.lastScanAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* ── Audit meta ── */}
      <div className="grid grid-cols-2 gap-2 pb-2">
        <InfoCard icon={User}     label="Created By" value={batch.createdBy} />
        <InfoCard icon={Calendar} label="Created At" value={batch.createdAt ? new Date(batch.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// NOTES TAB
// ══════════════════════════════════════════════════════════════
function NotesTab({ batch, canEdit, canDelete, onNoteUpdated, onArchived }) {
  const { updateBatchNote, softDeleteBatch, restoreBatch } = useBatches();
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(batch.traceabilityNote || '');
  const [saving, setSaving]     = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [archiveReason, setArchiveReason] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => { if (editing) textareaRef.current?.focus(); }, [editing]);

  async function handleSave() {
    if (!draft.trim() || draft.trim() === batch.traceabilityNote) { setEditing(false); return; }
    setSaving(true);
    try {
      await updateBatchNote(batch._id, draft.trim());
      toast.success('Note updated');
      setEditing(false);
      onNoteUpdated?.();
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  }

  async function handleArchive() {
    if (confirmCode !== batch.batchCode) { toast.error('Batch code does not match'); return; }
    setArchiving(true);
    try {
      await softDeleteBatch(batch._id, archiveReason.trim() || null);
      toast.success(`Batch ${batch.batchCode} archived`);
      onArchived?.();
    } catch (err) { toast.error(err.message || 'Archive failed'); }
    finally { setArchiving(false); }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      await restoreBatch(batch._id);
      toast.success(`Batch ${batch.batchCode} restored`);
      onArchived?.();
    } catch (err) { toast.error(err.message || 'Restore failed'); }
    finally { setRestoring(false); }
  }

  const history = batch.noteHistory || [];

  return (
    <div className="space-y-5">
      {/* ── Traceability note ── */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-2 flex items-center justify-between">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <Pencil className="w-3 h-3" /> Traceability Note
          </p>
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand-hover font-semibold transition-colors">
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
        </div>

        <div className="p-4">
          {editing ? (
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                maxLength={1000}
                rows={5}
                className="w-full px-3 py-2.5 bg-background border border-brand/40 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none leading-relaxed"
                placeholder="Describe provenance, quality, handling notes…"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">{draft.length}/1000</span>
                <div className="flex gap-2">
                  <button onClick={() => { setDraft(batch.traceabilityNote || ''); setEditing(false); }}
                    className="px-3 py-1.5 text-xs font-medium text-text-muted border border-border rounded-lg hover:bg-surface-2 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {batch.traceabilityNote || <span className="text-text-muted italic">No traceability note recorded.</span>}
            </p>
          )}
        </div>
      </div>

      {!canEdit && (
        <p className="text-xs text-text-muted italic px-1 text-center">
          Your role doesn't have permission to edit notes.
        </p>
      )}

      {/* ── Note history ── */}
      {history.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-2">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <History className="w-3 h-3" /> Edit History ({history.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {[...history].reverse().map((entry, i) => (
              <div key={i} className="px-4 py-3 hover:bg-surface-2 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <Pencil className="w-2.5 h-2.5 text-brand" />
                  </div>
                  <span className="text-xs font-semibold text-brand">{entry.editedBy}</span>
                  <span className="text-[10px] text-text-muted ml-auto">
                    {new Date(entry.editedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2 pl-7">{entry.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Admin Danger Zone ── */}
      {canDelete && (
        <div className={`border rounded-xl overflow-hidden ${batch.isDeleted ? 'border-amber-500/30 bg-amber-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
          <div className={`px-4 py-3 border-b flex items-center gap-2 ${batch.isDeleted ? 'border-amber-500/20' : 'border-rose-500/15'}`}>
            <ShieldAlert className={`w-3.5 h-3.5 ${batch.isDeleted ? 'text-amber-500' : 'text-rose-500'}`} />
            <p className={`text-[10px] font-black uppercase tracking-widest ${batch.isDeleted ? 'text-amber-500' : 'text-rose-500'}`}>
              {batch.isDeleted ? 'Archived Batch' : 'Danger Zone'}
            </p>
          </div>

          <div className="p-4 space-y-3">
            {batch.isDeleted ? (
              <>
                <p className="text-xs text-text-muted leading-relaxed">
                  This batch is archived and hidden from active views. The full record and scan history are preserved.
                  {batch.deletedBy && <> Archived by <strong>{batch.deletedBy}</strong>.</>}
                  {batch.deleteNote && <> Reason: <em>{batch.deleteNote}</em>.</>}
                </p>
                <button onClick={handleRestore} disabled={restoring}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                  <RotateCcw className={`w-3.5 h-3.5 ${restoring ? 'animate-spin' : ''}`} />
                  {restoring ? 'Restoring…' : 'Restore Batch'}
                </button>
              </>
            ) : !showArchive ? (
              <>
                <p className="text-xs text-text-muted leading-relaxed">
                  Archiving hides this batch from all warehouse views. The record and scan analytics are preserved and restorable. This action is logged with your username.
                </p>
                <button onClick={() => setShowArchive(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold rounded-lg transition-colors">
                  <Archive className="w-3.5 h-3.5" /> Archive Batch
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-text-primary">
                  Type <span className="font-mono text-rose-500 bg-rose-500/10 px-1 py-0.5 rounded">{batch.batchCode}</span> to confirm:
                </p>
                <input type="text" value={confirmCode} onChange={e => setConfirmCode(e.target.value)}
                  placeholder={batch.batchCode}
                  className="w-full px-3 py-2 bg-background border border-rose-500/30 rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500/25" />
                <input type="text" value={archiveReason} onChange={e => setArchiveReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/30" />
                <div className="flex gap-2">
                  <button onClick={() => { setShowArchive(false); setConfirmCode(''); setArchiveReason(''); }}
                    className="flex-1 py-2 text-xs font-medium text-text-muted border border-border rounded-lg hover:bg-surface-2 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleArchive}
                    disabled={archiving || confirmCode !== batch.batchCode}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40">
                    {archiving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                    {archiving ? 'Archiving…' : 'Confirm Archive'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HISTORY TAB
// ══════════════════════════════════════════════════════════════
function HistoryTab({ batch, scanData }) {
  const events = [];

  events.push({
    icon: Package, color: 'bg-emerald-500/15 text-emerald-500', border: 'border-emerald-500/20',
    title: 'Batch Created',
    detail: `Created by ${batch.createdBy}`,
    time: batch.createdAt,
  });

  (batch.noteHistory || []).forEach(entry => {
    events.push({
      icon: Pencil, color: 'bg-amber-500/15 text-amber-500', border: 'border-amber-500/20',
      title: 'Note Amended',
      detail: `Edited by ${entry.editedBy}`,
      time: entry.editedAt,
    });
  });

  if (batch.status === 'DISPATCHED' && batch.dispatchDate) {
    events.push({
      icon: Truck, color: 'bg-blue-500/15 text-blue-500', border: 'border-blue-500/20',
      title: 'Dispatched',
      detail: batch.buyerName ? `To ${batch.buyerName}` : 'Buyer not recorded',
      time: batch.dispatchDate,
    });
  }

  if (batch.isDeleted && batch.deletedAt) {
    events.push({
      icon: Archive, color: 'bg-rose-500/15 text-rose-500', border: 'border-rose-500/20',
      title: 'Archived',
      detail: batch.deletedBy ? `By ${batch.deletedBy}${batch.deleteNote ? ` · ${batch.deleteNote}` : ''}` : '',
      time: batch.deletedAt,
    });
  }

  events.sort((a, b) => new Date(b.time) - new Date(a.time));
  const recentScans = scanData?.recentScans || [];

  return (
    <div className="space-y-5">
      {/* ── Lifecycle timeline ── */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-2">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> Lifecycle Events
          </p>
        </div>
        <div className="divide-y divide-border">
          {events.map((ev, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${ev.color} ${ev.border}`}>
                <ev.icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text-primary">{ev.title}</p>
                  <p className="text-[10px] text-text-muted flex-shrink-0">
                    {new Date(ev.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {ev.detail && <p className="text-xs text-text-muted mt-0.5">{ev.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent QR scans ── */}
      {recentScans.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-2">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <Scan className="w-3 h-3" /> Recent QR Scans
            </p>
          </div>
          <div className="divide-y divide-border">
            {recentScans.map((scan, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors">
                <div className="w-6 h-6 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0 border border-border">
                  {scan.deviceType === 'Mobile'
                    ? <Smartphone className="w-3 h-3 text-text-muted" />
                    : <Monitor className="w-3 h-3 text-text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary">{scan.deviceType}</p>
                  {scan.source && <p className="text-[10px] text-text-muted">{scan.source}</p>}
                </div>
                <p className="text-[10px] text-text-muted flex-shrink-0">
                  {new Date(scan.scannedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && recentScans.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-text-muted">
          <History className="w-10 h-10 opacity-15" />
          <p className="text-sm">No events recorded yet</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN DRAWER
// ══════════════════════════════════════════════════════════════
/**
 * Discussion thread for this batch.
 *
 * Distinct from the Notes tab: notes are the batch's own traceability text and
 * only certain roles may change them. This is a conversation any signed-in
 * user can add to, and it is permanent — the reason a decision was taken
 * should outlive the shift that took it.
 *
 * Mounted only while the tab is open, so polling stops when it is not.
 */
function DiscussionTab({ batchId }) {
  const { messages, isLoading, post } = useRecordThread('batch', batchId, true);
  const { edit, remove } = useMessageActions(['messages', 'record', 'batch', batchId]);

  return (
    <div className="h-full flex flex-col min-h-0">
      <MessageThread
        messages={messages}
        isLoading={isLoading}
        sending={post.isPending}
        onSend={(body) => post.mutateAsync(body)}
        onEdit={(id, body) => edit.mutateAsync({ id, body })}
        onDelete={(id) => remove.mutateAsync(id)}
        placeholder="Why was this batch handled the way it was?"
        emptyTitle="No discussion yet"
        emptyHint="Anything decided about this batch belongs here — it stays on the record permanently."
      />
    </div>
  );
}

export default function BatchDetailDrawer({ batch, onClose, onRefresh, onArchived, onDispatch, onDownloadQR }) {
  const { getUser }  = useAuth();
  const user         = getUser();
  const role         = user?.role || '';
  const canEditNote  = CAN_EDIT_NOTE.includes(role);
  const canEditRaw   = CAN_EDIT_RAW.includes(role);
  const canDelete    = CAN_DELETE.includes(role);
  const canDispatch  = CAN_DISPATCH.includes(role);

  const [activeTab, setActiveTab]   = useState('overview');
  const [scanData, setScanData]     = useState(null);
  const [loadingScans, setLoadingScans] = useState(false);
  const [visible, setVisible]       = useState(false);

  const cfg = STATUS_CFG[batch?.status] || { strip: 'bg-border' };

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!batch?._id) return;
    setLoadingScans(true);
    fetch(`/api/batches/${batch._id}/scans`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('hs_token')}` }
    })
      .then(r => r.json())
      .then(d => setScanData(d))
      .catch(() => {})
      .finally(() => setLoadingScans(false));
  }, [batch?._id]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  if (!batch) return null;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'notes',    label: 'Notes',    icon: Pencil, dot: (batch.noteHistory?.length || 0) > 0 },
    { id: 'history',  label: 'History',  icon: History },
    { id: 'discuss',  label: 'Discussion', icon: MessagesSquare },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Batch details — ${batch.batchCode}`}
        className={`
          fixed z-50 flex flex-col bg-surface border-border overflow-hidden
          transition-transform duration-300 ease-out
          bottom-0 left-0 right-0 h-[94vh] rounded-t-2xl border-t border-x
          sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-[440px] sm:rounded-none sm:border-l sm:border-t-0 sm:border-r-0
          ${visible ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}
        `}
      >
        {/* Status color strip (top accent) */}
        <div className={`h-1 w-full flex-shrink-0 ${cfg.strip}`} />

        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2.5 flex-shrink-0 sm:hidden">
          <div className="w-9 h-1 bg-border rounded-full" />
        </div>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-0">
          <div className="flex items-start justify-between mb-1">
            <div className="min-w-0 flex-1 pr-3">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[10px] text-text-muted">Batch Registry</span>
                <ChevronRight className="w-2.5 h-2.5 text-text-muted" />
                <span className="text-[10px] font-semibold text-text-primary font-mono">{batch.batchCode}</span>
              </div>
              {/* Title */}
              <h2 className="text-base font-extrabold text-text-primary truncate">{batch.productName}</h2>
              {/* Sub + badges */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StatusBadge status={batch.status} />
                <span className="text-[10px] text-text-muted font-mono">{batch.batchCode}</span>
                {batch.isDeleted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold">
                    <Archive className="w-2.5 h-2.5" /> Archived
                  </span>
                )}
              </div>
            </div>
            <button onClick={handleClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-xl transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex mt-4 border-b border-border">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
                }`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.dot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-2 right-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {activeTab === 'overview' && (
            <OverviewTab
              batch={batch}
              scanData={scanData}
              loadingScans={loadingScans}
              onDispatch={onDispatch}
              onDownloadQR={onDownloadQR}
              canDispatch={canDispatch}
              canEditRaw={canEditRaw}
              onRefresh={onRefresh}
            />
          )}
          {activeTab === 'notes' && (
            <NotesTab
              batch={batch}
              canEdit={canEditNote}
              canDelete={canDelete}
              onNoteUpdated={onRefresh}
              onArchived={() => {
                handleClose();
                onRefresh?.();
                // Notify parent (Dashboard) so it can refresh the archived list
                onArchived?.();
              }}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab batch={batch} scanData={scanData} />
          )}
          {activeTab === 'discuss' && (
            <DiscussionTab batchId={batch._id} />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 border-t border-border px-5 py-3 flex items-center justify-between bg-surface-2">
          <p className="text-[10px] text-text-muted">
            Updated: {batch.updatedAt
              ? new Date(batch.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : '—'}
          </p>
          {canDelete && (
            <button onClick={() => setActiveTab('notes')}
              className="text-[10px] text-text-muted hover:text-rose-500 font-semibold flex items-center gap-1 transition-colors">
              <ShieldAlert className="w-3 h-3" /> Admin Controls
            </button>
          )}
        </div>
      </div>
    </>
  );
}
