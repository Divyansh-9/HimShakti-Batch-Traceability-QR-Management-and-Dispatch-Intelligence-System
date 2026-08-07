// src/pages/TracePage.jsx
// PUBLIC — no auth required. Scanned by consumers/buyers on phones.
// Light consumer theme — DOES NOT use dashboard CSS variables.
import { useParams } from 'react-router-dom';
import { useTrace } from '../hooks/useTrace';

const GREEN = '#1a4731'; // matches qrGenerator.js QR colour

const STATUS_COLORS = {
  URGENT:     { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: '⚠ Expiring Soon' },
  WARNING:    { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: '⏳ Use Soon' },
  READY:      { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: '✓ Fresh & Good' },
  DISPATCHED: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: '📦 Dispatched' },
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TracePage() {
  // One component serves both public routes. `token` is present when the
  // visitor scanned a QR; `batchCode` when they followed a legacy label.
  const { batchCode, token } = useParams();
  const { trace, loading, error } = useTrace(token || batchCode, token ? 'token' : 'batchCode');

  const statusCfg = trace?.status ? (STATUS_COLORS[trace.status] || STATUS_COLORS.READY) : null;
  // The reduced payload omits farmer/village/lot. Render what arrived
  // rather than showing empty rows the server deliberately withheld.
  const isFull    = trace?.detailLevel === 'full';
  // Shown by the API only when the verdict passed.
  const quality   = trace?.qualityCheck;
  const headerRef = trace?.batchCode || batchCode || '—';

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: GREEN, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#86efac', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
            HimShakti Food Processing
          </p>
          <p style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>Batch Traceability</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px' }}>
          <p style={{ color: 'white', fontSize: '11px', fontFamily: 'monospace' }}>{headerRef}</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${GREEN}`, borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14 }}>Loading batch information...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>❌</p>
            <p style={{ fontWeight: 700, color: '#111', fontSize: 18, marginBottom: 8 }}>Batch Not Found</p>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              {token
                ? 'This QR code could not be matched to a batch. It may be damaged or not issued by HimShakti.'
                : <>The batch code <strong>{batchCode}</strong> could not be found in our system.</>}
            </p>
          </div>
        )}

        {trace && !loading && (
          <>
            {/* Product Name */}
            <h1 style={{ fontSize: 24, fontWeight: 800, color: GREEN, marginBottom: 4, lineHeight: 1.2 }}>
              {trace.productName}
            </h1>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>SKU: {trace.sku}</p>

            {/* Status pill */}
            {statusCfg && (
              <div style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
                borderRadius: 10, padding: '10px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: statusCfg.text, fontWeight: 700, fontSize: 14 }}>{statusCfg.label}</span>
                <span style={{ color: statusCfg.text, fontSize: 13 }}>
                  {trace.daysUntilExpiry != null ? `${trace.daysUntilExpiry} days to expiry` : ''}
                </span>
              </div>
            )}

            {/* Expiry — big and prominent */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Best Before</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: statusCfg?.text || GREEN }}>{fmt(trace.expiryDate)}</p>
            </div>

            {/* Quality check — shown only when an inspector passed this
                batch. The API withholds FAILED and FLAGGED verdicts from
                the public response entirely, so absence here means "not
                inspected, or not passed", never "failed". */}
            {quality && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                padding: '14px 18px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#15803d', fontWeight: 700, fontSize: 14 }}>✓ Quality Checked</span>
                  <span style={{ color: '#15803d', fontSize: 13, letterSpacing: '0.05em' }}>
                    {'★'.repeat(quality.rating)}{'☆'.repeat(Math.max(0, 5 - quality.rating))}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#166534' }}>
                  Inspected {fmt(quality.inspectedAt)}
                  {quality.inspectorName ? ` by ${quality.inspectorName}` : ''}
                </p>
              </div>
            )}

            {/* Traceability Card */}
            <div style={{ border: `1px solid #e5e7eb`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ background: GREEN, padding: '10px 16px' }}>
                <p style={{ color: '#86efac', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  🌿 Farm-to-Table Traceability
                </p>
              </div>
              <div style={{ padding: '16px 20px', background: '#fff' }}>
                {isFull && <Row label="Farmer" value={trace.farmerName} />}
                {isFull && <Row label="Village" value={trace.village} />}
                <Row label="Packed On" value={fmt(trace.packDate)} />
                <Row label="Batch Code" value={trace.batchCode} mono />
                {isFull && trace.quantityProduced != null && (
                  <Row label="Batch Size" value={`${trace.quantityProduced} ${trace.unit || ''}`.trim()} />
                )}
              </div>
            </div>

            {/* Reduced-detail notice. Without this the page silently shows
                less than the same product's QR would, and a consumer has
                no way to tell the difference from missing data. */}
            {!isFull && (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
                padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                  Scan the QR code on the package to see full farm-to-table details,
                  including the farmer and village this batch came from.
                </p>
              </div>
            )}

            {/* Scan history */}
            {trace.scans?.length > 0 && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ background: '#f9fafb', padding: '10px 16px', borderBottom: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Scan History</p>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {trace.scans.slice(0, 5).map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
                      <span>{new Date(s.scannedAt).toLocaleString('en-IN')}</span>
                      <span style={{ textTransform: 'capitalize' }}>{s.deviceType || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Traceability note */}
            {trace.traceabilityNote && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: '#15803d' }}>📋 {trace.traceabilityNote}</p>
              </div>
            )}

            {/* Footer trust signal */}
            <div style={{ textAlign: 'center', paddingTop: 24, borderTop: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Verified by</p>
              <p style={{ fontWeight: 800, color: GREEN, fontSize: 15 }}>🏔 HimShakti Food Processing</p>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Uttarakhand, India</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, flexShrink: 0, marginRight: 12 }}>{label}</span>
      {/* maxWidth + wordBreak prevents long batch codes / product names overflowing on 320px */}
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 600, textAlign: 'right',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all', overflowWrap: 'anywhere', maxWidth: '65%' }}>{value || '—'}</span>
    </div>
  );
}

