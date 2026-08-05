/**
 * useInspections — TanStack Query hooks for the inspection system
 *
 * Exports:
 *  useInspectionList()       — all latest inspections (manager view)
 *  useMyInspections()        — authenticated QI's own submissions
 *  useInspectionsByBatch(id) — full history for a specific batch
 *  useSubmitInspection()     — mutation to POST a new inspection
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

// ── All inspections (paginated, manager/admin view) ─────────────
export function useInspectionList({ status, page = 1, limit = 30 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);

  return useQuery({
    queryKey: ['inspections', 'list', status, page],
    queryFn:  () => client(`/api/inspections?${params}`).then(r => r),
    staleTime: 30_000,
    retry: false,
  });
}

// ── My inspections (QI view) ────────────────────────────────────
export function useMyInspections({ page = 1, limit = 20 } = {}) {
  return useQuery({
    queryKey: ['inspections', 'my', page],
    queryFn:  () => client(`/api/inspections/my?page=${page}&limit=${limit}`).then(r => r),
    staleTime: 30_000,
    retry: false,
  });
}

// ── History for a specific batch ────────────────────────────────
export function useInspectionsByBatch(batchId) {
  return useQuery({
    queryKey: ['inspections', 'batch', batchId],
    queryFn:  () => client(`/api/inspections/batch/${batchId}`).then(r => r),
    enabled:  !!batchId,
    staleTime: 60_000,
    retry: false,
  });
}

// ── Submit a new inspection ─────────────────────────────────────
export function useSubmitInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      client('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      // Invalidate all inspection queries to refresh lists
      qc.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}
