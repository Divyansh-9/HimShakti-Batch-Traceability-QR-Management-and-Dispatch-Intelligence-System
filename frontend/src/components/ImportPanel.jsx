/**
 * @fileoverview ImportPanel — bulk batch import tab.
 *
 * Four steps, each of which must fully resolve before the next unlocks:
 *   1. File      — parsed in the browser, nothing sent yet
 *   2. Map       — sheet headers to canonical fields, auto-matched server-side
 *   3. Preview   — dry run; every row labelled insert / skip / error
 *   4. Import    — chunked commit with live progress
 *
 * The preview is not decoration. It is produced by the same server traversal
 * that performs the write, so what the user approves is what runs.
 */
import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, X, AlertTriangle,
  SkipForward, Download, Undo2, History, Loader2, FileWarning,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useImport, useImportSchema, useImportHistory } from '../hooks/useImport';
import { parseCsvToObjects, readFileAsText, toCsv } from '../utils/csvParser';

const STEPS = ['File', 'Map columns', 'Preview', 'Import'];

// ── Small shared pieces ───────────────────────────────────────────────

function StepRail({ current }) {
  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              active ? 'bg-brand/10 text-brand border-brand/30'
              : done ? 'bg-success/10 text-success border-success/30'
              : 'bg-surface-2 text-text-muted border-border'
            }`}>
              <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-black ${
                active ? 'bg-brand text-white' : done ? 'bg-success text-white' : 'bg-border text-text-muted'
              }`}>
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {label}
            </div>
            {i < STEPS.length - 1 && <span className="text-text-muted">·</span>}
          </div>
        );
      })}
    </div>
  );
}

function VerdictPill({ verdict }) {
  const map = {
    insert: { cls: 'bg-success/10 text-success border-success/25', label: 'will import', Icon: Check },
    skip:   { cls: 'bg-blue-500/10 text-blue-500 border-blue-500/25', label: 'skip',      Icon: SkipForward },
    error:  { cls: 'bg-error/10 text-error border-error/25',         label: 'error',      Icon: AlertTriangle },
  }[verdict] || {};
  const Icon = map.Icon || X;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${map.cls}`}>
      <Icon className="w-3 h-3" />{map.label}
    </span>
  );
}

function CountChip({ n, label, tone }) {
  const tones = {
    good:  'bg-success/10 text-success border-success/25',
    info:  'bg-blue-500/10 text-blue-500 border-blue-500/25',
    bad:   'bg-error/10 text-error border-error/25',
  };
  return (
    <div className={`px-3 py-2 rounded-lg border ${tones[tone]}`}>
      <p className="text-xl font-extrabold leading-none">{n}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide mt-1 opacity-80">{label}</p>
    </div>
  );
}

// ── Step 1: file ──────────────────────────────────────────────────────

function FileStep({ columns, onParsed }) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy]         = useState(false);
  const inputRef                = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (/\.xlsx?$/i.test(file.name)) {
      toast.error('Excel files need to be saved as CSV first — File ▸ Save As ▸ CSV UTF-8');
      return;
    }
    setBusy(true);
    try {
      const text = await readFileAsText(file);
      const { headers, rows } = parseCsvToObjects(text);
      if (!rows.length) { toast.error('That file has no data rows'); return; }
      onParsed({ fileName: file.name, headers, rows });
    } catch (err) {
      toast.error(err.message || 'Could not read that file');
    } finally {
      setBusy(false);
    }
  }, [onParsed]);

  function downloadTemplate() {
    const headers = columns.map(c => c.label);
    const sample  = {
      'Product SKU': 'HS-JAM-500', 'Product Name': '', 'Source Lot Code': 'LOT-2026-08-01',
      'Farmer Name': 'Harish Negi', 'Village': 'Munsyari', 'Quantity Produced': '250',
      'Unit': 'Kg', 'Yield %': '82', 'Pack Date': '06/08/2026',
    };
    const blob = new Blob([toCsv(headers, [sample])], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'himshakti-batch-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-brand bg-brand/5' : 'border-border hover:border-brand/50 hover:bg-surface-2'
        }`}
      >
        <input
          ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
        {busy
          ? <Loader2 className="w-8 h-8 mx-auto mb-3 text-brand animate-spin" />
          : <Upload className="w-8 h-8 mx-auto mb-3 text-text-muted" />}
        <p className="text-sm font-semibold text-text-primary">
          {busy ? 'Reading file…' : 'Drop a CSV here, or click to choose one'}
        </p>
        <p className="text-xs text-text-muted mt-1">
          Parsed in your browser — nothing is uploaded until you approve the preview.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-text-muted">
          Exporting from Excel? Use <span className="font-semibold text-text-primary">Save As ▸ CSV UTF-8</span>.
        </p>
        <button onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-surface-2 transition-colors">
          <Download className="w-3.5 h-3.5" /> Download template
        </button>
      </div>
    </div>
  );
}

// ── Step 2: column mapping ────────────────────────────────────────────

function MapStep({ columns, headers, mapping, setMapping, unmappedRequired }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">
        Auto-matched from your header row. Change anything that landed wrong —
        <span className="text-text-primary font-semibold"> Ignore</span> leaves a field empty.
      </p>

      {unmappedRequired.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/25 text-warning text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-px" />
          <span>
            Still unmapped:{' '}
            <span className="font-semibold">
              {unmappedRequired.map(k => columns.find(c => c.key === k)?.label || k).join(', ')}
            </span>. Rows will fail validation until these point at a column.
          </span>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {columns.map(col => (
          <div key={col.key} className="p-3 rounded-xl border border-border bg-surface-2/50">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-semibold text-text-primary">
                {col.label}
                {col.required && <span className="text-error ml-1">*</span>}
              </label>
            </div>
            <select
              value={mapping[col.key] || ''}
              onChange={e => setMapping(m => ({ ...m, [col.key]: e.target.value }))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand"
            >
              <option value="">— Ignore —</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            {col.hint && <p className="text-[11px] text-text-muted mt-1.5 leading-snug">{col.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 3: preview ───────────────────────────────────────────────────

function PreviewStep({ result, onDownloadErrors }) {
  const [filter, setFilter] = useState('all');
  const shown = useMemo(
    () => (filter === 'all' ? result.rows : result.rows.filter(r => r.verdict === filter)),
    [result.rows, filter]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <CountChip n={result.summary.insert} label="will import" tone="good" />
        <CountChip n={result.summary.skip}   label="skipped"     tone="info" />
        <CountChip n={result.summary.error}  label="errors"      tone="bad" />
        {result.summary.error > 0 && (
          <button onClick={onDownloadErrors}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-surface-2 transition-colors">
            <FileWarning className="w-3.5 h-3.5" /> Download error report
          </button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {['all', 'insert', 'skip', 'error'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
              filter === f ? 'bg-brand/10 text-brand border-brand/30' : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
            }`}>
            {f === 'all' ? 'All rows' : f}
          </button>
        ))}
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="min-w-full divide-y divide-border text-xs">
            <thead className="bg-surface-2 sticky top-0 z-10">
              <tr>
                {['Row', 'Verdict', 'Product', 'Lot', 'Qty', 'Pack date', 'Detail'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map(r => (
                <tr key={r.row} className="hover:bg-surface-2/60">
                  <td className="px-3 py-2 text-text-muted tabular-nums">{r.row}</td>
                  <td className="px-3 py-2"><VerdictPill verdict={r.verdict} /></td>
                  <td className="px-3 py-2 text-text-primary">
                    {r.preview.productName || r.preview.sku || <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-text-muted">{r.preview.lot || '—'}</td>
                  <td className="px-3 py-2 tabular-nums text-text-primary">
                    {r.preview.quantity != null ? `${r.preview.quantity} ${r.preview.unit || ''}` : '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-text-muted">{r.preview.packDate || '—'}</td>
                  <td className="px-3 py-2 text-text-muted max-w-[320px]">
                    {r.reason || r.errors?.map(e => e.message).join('; ') || ''}
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-text-muted">No rows in this view</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── History table ─────────────────────────────────────────────────────

function HistoryTable({ onRollback, rollingBackId }) {
  const { data: jobs = [], isLoading } = useImportHistory();

  const STATUS_CLS = {
    done:        'bg-success/10 text-success border-success/25',
    running:     'bg-warning/10 text-warning border-warning/25',
    failed:      'bg-error/10 text-error border-error/25',
    rolled_back: 'bg-blue-500/10 text-blue-500 border-blue-500/25',
  };

  return (
    <div className="glass-card glass-card-border glass-card-brand rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <History className="w-4 h-4 text-brand" />
        <h2 className="text-sm font-semibold text-text-primary">Import history</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-xs">
          <thead className="bg-surface-2">
            <tr>
              {['File', 'When', 'INS / SKIP / ERR', 'By', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Loading…</td></tr>
            )}
            {!isLoading && !jobs.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No imports yet</td></tr>
            )}
            {jobs.map(j => (
              <tr key={j._id} className="hover:bg-surface-2/60">
                <td className="px-4 py-3">
                  <p className="text-text-primary font-medium">{j.fileName}</p>
                  <p className="text-text-muted text-[11px]">({j.entity})</p>
                </td>
                <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                  {new Date(j.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary whitespace-nowrap">
                  {j.inserted} / {j.skipped} / {j.errored}
                </td>
                <td className="px-4 py-3 text-text-muted whitespace-nowrap">{j.createdBy}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${STATUS_CLS[j.status] || ''}`}>
                    {j.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {j.status === 'done' && j.inserted > 0 && (
                    <button
                      onClick={() => onRollback(j)}
                      disabled={rollingBackId === j._id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-text-primary hover:bg-surface-2 disabled:opacity-50 transition-colors">
                      {rollingBackId === j._id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Undo2 className="w-3 h-3" />}
                      Undo
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Rollback confirmation ─────────────────────────────────────────────

function RollbackDialog({ job, onCancel, onConfirm, busy }) {
  if (!job) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Undo2 className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold text-text-primary">Undo this import?</h3>
        </div>
        <div className="p-5 space-y-3 text-sm text-text-primary">
          <p>
            This archives the <span className="font-semibold">{job.inserted}</span> batch
            {job.inserted === 1 ? '' : 'es'} imported from{' '}
            <span className="font-semibold">{job.fileName}</span>.
          </p>
          <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs text-text-muted">
            Nothing is destroyed. The batches are soft-deleted and stay in the Archived
            tab, where an admin can restore them. Any batch already dispatched or
            archived by hand keeps its existing state.
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button onClick={onCancel}
            className="px-3 py-2 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-surface-2 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Archive {job.inserted} batch{job.inserted === 1 ? '' : 'es'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────

export default function ImportPanel() {
  const { data: schema, isLoading: schemaLoading, error: schemaError } = useImportSchema();
  const { progress, autoMapHeaders, validate, commit, rollback } = useImport();

  const [step, setStep]           = useState(0);
  const [parsed, setParsed]       = useState(null);   // { fileName, headers, rows }
  const [mapping, setMapping]     = useState({});
  const [unmapped, setUnmapped]   = useState([]);
  const [preview, setPreview]     = useState(null);
  const [outcome, setOutcome]     = useState(null);
  const [rollbackTarget, setRollbackTarget] = useState(null);

  // Memoised: `|| []` would mint a new array every render and re-run the
  // canonicalRows memo below on each one.
  const columns = useMemo(() => schema?.columns || [], [schema]);

  /** Reduce raw sheet rows to canonical keys using the current mapping. */
  const canonicalRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.map(r => {
      const out = {};
      for (const col of columns) {
        const header = mapping[col.key];
        out[col.key] = header ? (r[header] ?? '') : '';
      }
      return out;
    });
  }, [parsed, mapping, columns]);

  function reset() {
    setStep(0); setParsed(null); setMapping({}); setUnmapped([]);
    setPreview(null); setOutcome(null);
  }

  async function handleParsed(next) {
    setParsed(next);
    try {
      const { mapping: auto, unmappedRequired } = await autoMapHeaders(next.headers);
      setMapping(auto);
      setUnmapped(unmappedRequired);
    } catch {
      setMapping({}); setUnmapped(columns.filter(c => c.required).map(c => c.key));
    }
    setStep(1);
  }

  async function handleValidate() {
    try {
      const result = await validate(canonicalRows);
      setPreview(result);
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Validation failed');
    }
  }

  async function handleCommit() {
    setStep(3);
    try {
      const res = await commit({ rows: canonicalRows, fileName: parsed.fileName });
      setOutcome(res);
      toast.success(`Imported ${res.totals.inserted} batch${res.totals.inserted === 1 ? '' : 'es'}`);
    } catch (err) {
      toast.error(err.message || 'Import failed');
      setStep(2);
    }
  }

  function downloadErrorReport() {
    const bad = preview.rows.filter(r => r.verdict === 'error');
    const rows = bad.map(r => ({
      Row: r.row,
      Product: r.preview.productName || r.preview.sku || '',
      Lot: r.preview.lot || '',
      Problem: r.errors.map(e => `${e.field || 'row'}: ${e.message}`).join(' | '),
    }));
    const blob = new Blob([toCsv(['Row', 'Product', 'Lot', 'Problem'], rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `import-errors-${parsed.fileName.replace(/\.csv$/i, '')}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (schemaLoading) {
    return <div className="p-8 text-center text-text-muted text-sm">Loading import settings…</div>;
  }
  if (schemaError) {
    return (
      <div className="p-6 rounded-xl border border-error/25 bg-error/5 text-error text-sm">
        {schemaError.message === 'Bulk import is restricted to factory managers and above'
          ? 'Your role cannot run bulk imports. Ask a manager or admin.'
          : schemaError.message}
      </div>
    );
  }

  const canAdvanceFromMap = unmapped.length === 0 || columns
    .filter(c => c.required && c.key !== 'productSku')
    .every(c => mapping[c.key]) && (mapping.productSku || mapping.productName);

  return (
    <div className="space-y-5">
      {/* ── Wizard card ── */}
      <div data-tour="import-wizard" className="glass-card glass-card-border glass-card-brand rounded-xl">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-semibold text-text-primary">Import batches</h2>
          {parsed && (
            <span className="ml-auto text-xs text-text-muted truncate max-w-[240px]">
              {parsed.fileName} · {parsed.rows.length} rows
            </span>
          )}
        </div>

        <div className="p-5">
          <StepRail current={step} />

          {step === 0 && <FileStep columns={columns} onParsed={handleParsed} />}

          {step === 1 && (
            <MapStep
              columns={columns} headers={parsed.headers}
              mapping={mapping} setMapping={setMapping} unmappedRequired={unmapped}
            />
          )}

          {step === 2 && preview && (
            <PreviewStep result={preview} onDownloadErrors={downloadErrorReport} />
          )}

          {step === 3 && (
            <div className="py-8 text-center space-y-4">
              {progress ? (
                <>
                  <Loader2 className="w-8 h-8 mx-auto text-brand animate-spin" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Importing… {progress.done} of {progress.total}
                    </p>
                    <div className="mx-auto mt-3 h-2 w-64 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-brand transition-all duration-300"
                           style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
                    </div>
                  </div>
                </>
              ) : outcome ? (
                <>
                  <div className="w-12 h-12 mx-auto rounded-full bg-success/10 grid place-items-center">
                    <Check className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">Import finished</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <CountChip n={outcome.totals.inserted} label="imported" tone="good" />
                    <CountChip n={outcome.totals.skipped}  label="skipped"  tone="info" />
                    <CountChip n={outcome.totals.errored}  label="errors"   tone="bad" />
                  </div>
                  <p className="text-xs text-text-muted">
                    Listed in the history below, where it can be undone.
                  </p>
                  <button onClick={reset}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors">
                    Import another file
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* ── Navigation ── */}
          {step > 0 && step < 3 && (
            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => (step === 1 ? reset() : setStep(1))}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-surface-2 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> {step === 1 ? 'Choose another file' : 'Back to mapping'}
              </button>

              {step === 1 && (
                <button
                  onClick={handleValidate}
                  disabled={!canAdvanceFromMap || !!progress}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors">
                  {progress?.phase === 'validating'
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking {progress.done}/{progress.total}</>
                    : <>Validate {parsed.rows.length} rows <ArrowRight className="w-3.5 h-3.5" /></>}
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={handleCommit}
                  disabled={preview.summary.insert === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {preview.summary.insert === 0
                    ? 'Nothing to import'
                    : `Import ${preview.summary.insert} batch${preview.summary.insert === 1 ? '' : 'es'}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <HistoryTable onRollback={setRollbackTarget} rollingBackId={rollback.isPending ? rollbackTarget?._id : null} />

      <RollbackDialog
        job={rollbackTarget}
        busy={rollback.isPending}
        onCancel={() => setRollbackTarget(null)}
        onConfirm={async () => {
          await rollback.mutateAsync(rollbackTarget._id);
          setRollbackTarget(null);
        }}
      />
    </div>
  );
}
