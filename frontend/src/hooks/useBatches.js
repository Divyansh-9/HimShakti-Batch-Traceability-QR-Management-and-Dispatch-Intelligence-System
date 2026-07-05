/**
 * @fileoverview useBatches — React Query powered batch data hook.
 *
 * Provides:
 * - Deduplication, stale-while-revalidate caching
 * - Optimistic insert for createBatch with automatic rollback on failure
 * - Optimistic note update with rollback
 * - Optimistic raw material update with rollback
 * - Optimistic soft-delete (removes row instantly, restores on error)
 * - restoreBatch (admin)
 * - fetchArchivedBatches (admin — separate query)
 * - No race conditions — library handles cancellation and ordering
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

const QUERY_KEY          = ['batches'];
const ARCHIVED_QUERY_KEY = ['batches', 'archived'];

async function fetchAllBatches() {
  const data = await client('/api/batches?limit=200');
  return data.data || [];
}

async function fetchArchivedBatchesFn() {
  // Calls the dedicated protected endpoint — auth header is sent by client()
  const data = await client('/api/batches/archived');
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
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData(QUERY_KEY);

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
      if (ctx?.prev !== undefined) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
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

  // ── Update Note — optimistic with rollback ────────────────────────
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, note }) =>
      client(`/api/batches/${id}/note`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      }),

    onMutate: async ({ id, note }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old = []) =>
        old.map(b => b._id === id ? { ...b, traceabilityNote: note } : b)
      );
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  async function updateBatchNote(id, note) {
    return updateNoteMutation.mutateAsync({ id, note });
  }

  // ── Update Raw Material — optimistic with rollback ────────────────
  const updateRawMaterialMutation = useMutation({
    mutationFn: ({ id, fields }) =>
      client(`/api/batches/${id}/raw-material`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      }),

    onMutate: async ({ id, fields }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old = []) =>
        old.map(b => b._id === id ? { ...b, ...fields } : b)
      );
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ARCHIVED_QUERY_KEY });
    },
  });

  async function updateRawMaterial(id, fields) {
    return updateRawMaterialMutation.mutateAsync({ id, fields });
  }

  // ── Soft Delete — optimistic removal + rollback on error ──────────
  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      client(`/api/batches/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old = []) => old.filter(b => b._id !== id));
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ARCHIVED_QUERY_KEY });
    },
  });

  async function softDeleteBatch(id, reason) {
    return deleteMutation.mutateAsync({ id, reason });
  }

  // ── Restore — re-adds to cache after server confirms ──────────────
  const restoreMutation = useMutation({
    mutationFn: (id) =>
      client(`/api/batches/${id}/restore`, { method: 'PATCH' }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ARCHIVED_QUERY_KEY });
    },
  });

  async function restoreBatch(id) {
    return restoreMutation.mutateAsync(id);
  }

  // ── Fetch archived batches (separate on-demand query) ─────────────
  async function fetchArchivedBatches() {
    return fetchArchivedBatchesFn();
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
    updateBatchNote,
    updateRawMaterial,
    softDeleteBatch,
    restoreBatch,
    fetchArchivedBatches,
    downloadQR,
    getBatchScans,
  };
}
