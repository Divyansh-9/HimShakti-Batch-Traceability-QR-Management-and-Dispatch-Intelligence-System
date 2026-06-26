// src/components/CreateBatchModal.jsx
import { useState } from 'react';
import { X, Package } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import toast from 'react-hot-toast';

export default function CreateBatchModal({ isOpen, onClose, onCreated }) {
  const { products, loading: productsLoading } = useProducts();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    packDate: new Date().toISOString().slice(0, 10),
    quantityProduced: '',
    unit: 'Kg',
    yieldPercent: '',
    sourceLotCode: '',
    farmerName: '',
    village: '',
  });

  if (!isOpen) return null;

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.productId) { toast.error('Please select a product'); return; }

    setSubmitting(true);
    try {
      await onCreated({
        ...form,
        quantityProduced: Number(form.quantityProduced),
        yieldPercent: Number(form.yieldPercent),
      });
      toast.success('Batch created successfully!');
      onClose();
      setForm({
        productId: '', packDate: new Date().toISOString().slice(0, 10),
        quantityProduced: '', unit: 'Kg', yieldPercent: '',
        sourceLotCode: '', farmerName: '', village: '',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-brand" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Create New Batch</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Selector */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Product *</label>
            <select
              name="productId"
              value={form.productId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors"
            >
              <option value="">{productsLoading ? 'Loading products...' : 'Select a product'}</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.productName} ({p.sku})</option>
              ))}
            </select>
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Pack Date *</label>
              <input type="date" name="packDate" value={form.packDate} onChange={handleChange} required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Unit *</label>
              <select name="unit" value={form.unit} onChange={handleChange}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors">
                {['Kg', 'L', 'Units', 'Boxes', 'Packets'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Quantity *</label>
              <input type="number" name="quantityProduced" value={form.quantityProduced} onChange={handleChange} required min="1"
                placeholder="e.g. 200"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Yield % *</label>
              <input type="number" name="yieldPercent" value={form.yieldPercent} onChange={handleChange} required min="1" max="100"
                placeholder="e.g. 88"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Source Lot Code</label>
            <input type="text" name="sourceLotCode" value={form.sourceLotCode} onChange={handleChange}
              placeholder="e.g. LOT-2026-001"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Farmer Name *</label>
              <input type="text" name="farmerName" value={form.farmerName} onChange={handleChange} required
                placeholder="e.g. Ramesh Singh"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Village *</label>
              <input type="text" name="village" value={form.village} onChange={handleChange} required
                placeholder="e.g. Tehri"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-colors" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-muted hover:bg-surface-2 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {submitting ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
