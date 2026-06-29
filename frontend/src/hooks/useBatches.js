/**
 * @fileoverview useBatches — React Query powered batch data hook.
 *
 * Replaces fragile manual useState/useEffect pattern with TanStack Query:
 * - Deduplicates concurrent fetches
 * - Handles stale-while-revalidate caching
 * - Provides optimistic insert for createBatch with automatic rollback on failure
 * - No race conditions — library handles cancellation and ordering
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

const QUERY_KEY = ['batches'];

async function fetchAllBatches() {
  const data = await client('/api/batches?limit=100');
  return data.data || [];
}

export function useBatches() {
  const queryClient = useQueryClient();

  // ── Read ──────────────────────────────────────────────────────────
  const {
    data: batches = [],
    isLoading: loading,
    error,
    refetch: fetchBatches,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAllBatches,
  });

  // ── Create — with optimistic insert + rollback ────────────────────
  const createMutation = useMutation({
    mutationFn: (payload) =>
      client('/api/batches', { method: 'POST', body: JSON.stringify(payload) }),

    onMutate: async (payload) => {
      // Cancel any in-flight refetches so they don't overwrite the optimistic value
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      // Snapshot current list for rollback
      const prev = queryClient.getQueryData(QUERY_KEY);

      // Optimistic insert — temporary ID so the row appears immediately
      queryClient.setQueryData(QUERY_KEY, (old = []) => [
        ...old,
        {
          _id: `optimistic-${Date.now()}`,
          batchCode: 'Saving…',
          productName: payload.productName || '—',
          status: 'READY',
          daysUntilExpiry: null,
          farmerName: payload.farmerName,
          village: payload.village,
          _optimistic: true,
        },
      ]);

      return { prev };
    },

    onError: (_err, _payload, ctx) => {
      // Rollback on failure — removes the phantom row
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(QUERY_KEY, ctx.prev);
      }
    },

    onSettled: () => {
      // Always refetch after mutation to get the real server-returned object
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  async function createBatch(payload) {
    return createMutation.mutateAsync(payload);
  }

  // ── Dispatch ──────────────────────────────────────────────────────
  const dispatchMutation = useMutation({
    mutationFn: ({ id, buyerName }) =>
      client(`/api/batches/${id}/dispatch`, {
        method: 'PATCH',
        body: JSON.stringify({ buyerName, dispatchDate: new Date().toISOString() }),
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  async function dispatchBatch(id, buyerName) {
    return dispatchMutation.mutateAsync({ id, buyerName });
  }

  // ── QR Download ───────────────────────────────────────────────────
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

  // ── Scan analytics ────────────────────────────────────────────────
  async function getBatchScans(batchId) {
    return client(`/api/batches/${batchId}/scans`);
  }

  return {
    batches,
    loading,
    error: error?.message || null,
    fetchBatches,
    createBatch,
    dispatchBatch,
    downloadQR,
    getBatchScans,
  };
}
