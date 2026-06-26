// src/components/DispatchModal.jsx
import { useState } from 'react';
import { X, Truck } from 'lucide-react';

export default function DispatchModal({ batch, onClose, onConfirm }) {
  const [buyerName, setBuyerName]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!batch) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!buyerName.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(batch._id, buyerName.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Mark as Dispatched</h2>
              <p className="text-xs text-text-muted font-mono mt-0.5">{batch.batchCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Batch summary */}
        <div className="px-6 py-4 bg-surface-2/50 border-b border-border">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Product</span>
            <span className="font-medium text-text-primary">{batch.productName}</span>
          </div>
          <div className="flex justify-between text-sm mt-1.5">
            <span className="text-text-muted">Qty</span>
            <span className="font-medium text-text-primary">{batch.quantityProduced} {batch.unit}</span>
          </div>
          <div className="flex justify-between text-sm mt-1.5">
            <span className="text-text-muted">Days to Expiry</span>
            <span className={`font-semibold ${batch.daysUntilExpiry < 7 ? 'text-red-400' : 'text-green-400'}`}>
              {batch.daysUntilExpiry} days
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Buyer / Distributor Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={buyerName}
              onChange={e => setBuyerName(e.target.value)}
              placeholder="e.g. Dehradun Agro Distributors"
              required
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors placeholder:text-text-muted/50"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-muted hover:bg-surface-2 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !buyerName.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              <Truck className="w-4 h-4" />
              {submitting ? 'Dispatching…' : 'Confirm Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
