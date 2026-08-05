/**
 * InspectionModal.jsx — Phase 3 / T-063
 *
 * Full-screen modal form for Quality Inspectors to submit an inspection report.
 * Features:
 *  - Batch selector (live batches, excludes DISPATCHED/EXPIRED)
 *  - 8-item structured checklist with pass/fail toggles and optional notes
 *  - Visual 1–5 star rating
 *  - PASSED / FAILED / FLAGGED verdict selector with colour coding
 *  - Findings text area
 *  - Recommendation text
 *  - Submit posts to POST /api/inspections, toasts on success/error
 */
import { useState, useEffect } from 'react';
import {
  X, ClipboardCheck, Star, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, Loader2, Package, Search,
} from 'lucide-react';
import { useSubmitInspection } from '../hooks/useInspections';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────
// DEFAULT CHECKLIST — mirrors Inspection.model.js DEFAULT_CHECKLIST
// ─────────────────────────────────────────────────────────────────
const DEFAULT_CHECKLIST = [
  { label: 'Packaging integrity',            passed: null, note: '' },
  { label: 'Label accuracy & legibility',    passed: null, note: '' },
  { label: 'Expiry date visible & correct',  passed: null, note: '' },
  { label: 'Weight / quantity correct',      passed: null, note: '' },
  { label: 'No visible contamination',       passed: null, note: '' },
  { label: 'Colour & texture acceptable',    passed: null, note: '' },
  { label: 'Odour within acceptable range',  passed: null, note: '' },
  { label: 'Storage conditions met',         passed: null, note: '' },
];

// ─────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  PASSED:  { label: 'Passed',  Icon: CheckCircle2,    colour: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  ring: 'ring-green-500/50'  },
  FLAGGED: { label: 'Flagged', Icon: AlertTriangle,   colour: 'text-amber-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  ring: 'ring-amber-500/50'  },
  FAILED:  { label: 'Failed',  Icon: XCircle,         colour: 'text-rose-500',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   ring: 'ring-rose-500/50'   },
};

// ─────────────────────────────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Very Poor', 'Poor', 'Acceptable', 'Good', 'Excellent'];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-border'
              }`}
            />
          </button>
        ))}
        {(hovered || value) > 0 && (
          <span className="ml-2 text-xs font-medium text-text-muted">
            {labels[hovered || value]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CHECKLIST ITEM ROW
// ─────────────────────────────────────────────────────────────────
function ChecklistRow({ item, index, onChange }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      {/* Pass / Fail / Null toggle */}
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => onChange(index, 'passed', item.passed === true ? null : true)}
          className={`w-7 h-7 rounded-md flex items-center justify-center border transition-all ${
            item.passed === true
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-border text-text-muted hover:border-green-500 hover:text-green-500'
          }`}
          title="Pass"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(index, 'passed', item.passed === false ? null : false)}
          className={`w-7 h-7 rounded-md flex items-center justify-center border transition-all ${
            item.passed === false
              ? 'bg-rose-500 border-rose-500 text-white'
              : 'border-border text-text-muted hover:border-rose-500 hover:text-rose-500'
          }`}
          title="Fail"
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Label + note */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${
          item.passed === true  ? 'text-green-500' :
          item.passed === false ? 'text-rose-500' :
          'text-text-primary'
        }`}>
          {item.label}
        </p>
        <input
          type="text"
          value={item.note}
          onChange={e => onChange(index, 'note', e.target.value)}
          placeholder="Optional note…"
          maxLength={200}
          className="mt-1 w-full text-xs bg-transparent text-text-muted placeholder-text-muted/40 border-none outline-none"
        />
      </div>

      {/* Status chip */}
      <div className="flex-shrink-0">
        {item.passed === true  && <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">PASS</span>}
        {item.passed === false && <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">FAIL</span>}
        {item.passed === null  && <span className="text-[10px] text-text-muted/40 px-1.5 py-0.5">—</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────
export default function InspectionModal({ isOpen, onClose, batches = [], prefillBatch = null }) {
  const { mutateAsync: submit, isPending } = useSubmitInspection();

  const [selectedBatch, setSelectedBatch] = useState(prefillBatch || null);
  const [batchSearch,   setBatchSearch]   = useState('');
  const [verdict,       setVerdict]       = useState(null);  // 'PASSED' | 'FAILED' | 'FLAGGED'
  const [rating,        setRating]        = useState(0);
  const [checklist,     setChecklist]     = useState(DEFAULT_CHECKLIST.map(i => ({ ...i })));
  const [findings,      setFindings]      = useState('');
  const [recommendation,setRecommendation]= useState('');
  const [batchPickerOpen, setBatchPickerOpen] = useState(!prefillBatch);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBatch(prefillBatch || null);
      setBatchSearch('');
      setVerdict(null);
      setRating(0);
      setChecklist(DEFAULT_CHECKLIST.map(i => ({ ...i })));
      setFindings('');
      setRecommendation('');
      setBatchPickerOpen(!prefillBatch);
    }
  }, [isOpen, prefillBatch]);

  function handleChecklistChange(index, field, value) {
    setChecklist(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  // Derive suggested verdict from checklist
  const failedItems = checklist.filter(i => i.passed === false).length;
  const passedItems = checklist.filter(i => i.passed === true).length;
  const suggestedVerdict = failedItems >= 2 ? 'FAILED' : failedItems === 1 ? 'FLAGGED' : passedItems >= 6 ? 'PASSED' : null;

  const filteredBatches = batches.filter(b =>
    b.status !== 'DISPATCHED' && b.status !== 'EXPIRED' && !b.isDeleted &&
    (b.batchCode.toLowerCase().includes(batchSearch.toLowerCase()) ||
     b.productName.toLowerCase().includes(batchSearch.toLowerCase()))
  );

  const canSubmit = selectedBatch && verdict && rating > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await submit({
        batchId:        selectedBatch._id,
        status:         verdict,
        rating,
        checklist,
        findings:       findings.trim(),
        recommendation: recommendation.trim(),
      });
      toast.success(`Inspection submitted — Batch ${selectedBatch.batchCode} ${VERDICT_CONFIG[verdict].label}`);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit inspection');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-popover-in">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <ClipboardCheck className="w-4.5 h-4.5 text-teal-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Quality Inspection</h2>
              <p className="text-xs text-text-muted">
                {selectedBatch ? `${selectedBatch.batchCode} — ${selectedBatch.productName}` : 'Select a batch to begin'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-6 py-5 space-y-6">

            {/* ── STEP 1: Batch Picker ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">1 · Select Batch</h3>
                {selectedBatch && (
                  <button type="button" onClick={() => { setSelectedBatch(null); setBatchPickerOpen(true); }}
                    className="text-[11px] text-brand hover:underline">Change</button>
                )}
              </div>

              {selectedBatch ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-brand/5 border border-brand/20 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{selectedBatch.batchCode}</p>
                    <p className="text-xs text-text-muted">{selectedBatch.productName} · {selectedBatch.quantityProduced}{selectedBatch.unit} · {selectedBatch.status}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <input
                      type="text"
                      value={batchSearch}
                      onChange={e => setBatchSearch(e.target.value)}
                      placeholder="Search batch code or product…"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand text-text-primary placeholder-text-muted/50"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                    {filteredBatches.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-text-muted text-center">No active batches found</p>
                    ) : filteredBatches.map(b => (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => { setSelectedBatch(b); setBatchPickerOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{b.batchCode}</p>
                          <p className="text-xs text-text-muted truncate">{b.productName} · {b.status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {selectedBatch && (
              <>
                {/* ── STEP 2: Checklist ── */}
                <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">2 · Quality Checklist</h3>
                  <div className="bg-surface-2/40 border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-1">
                      {checklist.map((item, i) => (
                        <ChecklistRow key={i} item={item} index={i} onChange={handleChecklistChange} />
                      ))}
                    </div>
                    {/* Checklist summary */}
                    <div className="flex items-center gap-4 px-4 py-2.5 bg-surface-2/60 border-t border-border text-xs">
                      <span className="text-green-500 font-medium">{passedItems} passed</span>
                      <span className="text-rose-500 font-medium">{failedItems} failed</span>
                      <span className="text-text-muted">{8 - passedItems - failedItems} not assessed</span>
                    </div>
                  </div>
                </section>

                {/* ── STEP 3: Rating ── */}
                <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">3 · Overall Rating</h3>
                  <StarRating value={rating} onChange={setRating} />
                </section>

                {/* ── STEP 4: Verdict ── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">4 · Verdict</h3>
                    {suggestedVerdict && verdict !== suggestedVerdict && (
                      <button type="button" onClick={() => setVerdict(suggestedVerdict)}
                        className="text-[10px] text-brand border border-brand/20 bg-brand/5 px-2 py-0.5 rounded-full hover:bg-brand/10 transition-colors">
                        Suggested: {suggestedVerdict}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    {Object.entries(VERDICT_CONFIG).map(([key, cfg]) => {
                      const Icon = cfg.Icon;
                      const isSelected = verdict === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setVerdict(key)}
                          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                            isSelected
                              ? `${cfg.bg} ${cfg.border} ring-1 ${cfg.ring}`
                              : 'border-border hover:border-border/80 hover:bg-surface-2/60'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? cfg.colour : 'text-text-muted'}`} />
                          <span className={`text-xs font-bold ${isSelected ? cfg.colour : 'text-text-muted'}`}>
                            {cfg.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* ── STEP 5: Findings ── */}
                <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">5 · Findings &amp; Recommendation</h3>
                  <div className="space-y-3">
                    <textarea
                      value={findings}
                      onChange={e => setFindings(e.target.value)}
                      placeholder="Describe your findings — any defects, deviations, or observations…"
                      maxLength={1000}
                      rows={3}
                      className="w-full px-4 py-3 text-sm bg-surface-2/40 border border-border rounded-xl text-text-primary placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                    />
                    <textarea
                      value={recommendation}
                      onChange={e => setRecommendation(e.target.value)}
                      placeholder="Recommendation — what should happen next? (quarantine, rework, dispatch, etc.)"
                      maxLength={400}
                      rows={2}
                      className="w-full px-4 py-3 text-sm bg-surface-2/40 border border-border rounded-xl text-text-primary placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                    />
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-surface sticky bottom-0">
            <div className="text-xs text-text-muted">
              {!canSubmit && <span>Complete all required steps to submit.</span>}
              {canSubmit && <span className="text-green-500 font-medium">Ready to submit</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isPending}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                  canSubmit && !isPending
                    ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-sm'
                    : 'bg-surface-2 text-text-muted cursor-not-allowed'
                }`}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                {isPending ? 'Submitting…' : 'Submit Inspection'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
