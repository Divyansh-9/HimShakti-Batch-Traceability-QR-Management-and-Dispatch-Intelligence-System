// src/hooks/useBatches.js
import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

export function useBatches() {
  const [batches, setBatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchBatches = useCallback(async () => {
    try {
      const data = await client('/api/batches');
      setBatches(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + poll every 60s (Idea 1 — real-time status refresh)
  useEffect(() => {
    fetchBatches();
    const interval = setInterval(fetchBatches, 60000);
    return () => clearInterval(interval);
  }, [fetchBatches]);

  async function createBatch(payload) {
    const data = await client('/api/batches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await fetchBatches(); // refresh list after creation
    return data;
  }

  async function dispatchBatch(id, buyerName) {
    const data = await client(`/api/batches/${id}/dispatch`, {
      method: 'PATCH',
      body: JSON.stringify({ buyerName, dispatchDate: new Date().toISOString() }),
    });
    await fetchBatches();
    return data;
  }

  // Idea 2 — QR download helper used inline on batch rows
  async function downloadQR(batchId, batchCode) {
    const data = await client(`/api/batches/${batchId}`);
    const qrDataUrl = data.data?.qrCodeDataUrl;
    if (!qrDataUrl) throw new Error('QR code not found for this batch');
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${batchCode}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Idea 3 — Scan analytics
  async function getBatchScans(batchId) {
    return client(`/api/batches/${batchId}/scans`);
  }

  return { batches, loading, error, fetchBatches, createBatch, dispatchBatch, downloadQR, getBatchScans };
}
