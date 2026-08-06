/**
 * @fileoverview useImport — bulk batch import.
 *
 * The browser parses the file and sends already-structured rows, so there is
 * no upload endpoint and no multipart handling anywhere in the stack. Rows go
 * up in chunks because the backend runs serverless: one 5,000-row request
 * would exceed the function timeout, and the body would blow past the 1 MB
 * express.json limit long before that.
 *
 * Validation and commit both chunk through the same helper, so the preview a
 * user approves is produced by the same traversal that then writes.
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import client from '../api/client';

/** Must not exceed MAX_CHUNK_ROWS on the server, which rejects with 413. */
export const CHUNK_SIZE = 200;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Column contract — drives the mapping step's labels and required flags. */
export function useImportSchema() {
  return useQuery({
    queryKey: ['import', 'schema'],
    queryFn:  () => client('/api/import/schema').then(r => r.data),
    staleTime: Infinity,   // static contract; refetching it is pure waste
    retry: false,
  });
}

/** Import history for the log table. */
export function useImportHistory() {
  return useQuery({
    queryKey: ['import', 'history'],
    queryFn:  () => client('/api/import').then(r => r.data ?? []),
    staleTime: 15_000,
    retry: false,
  });
}

export function useImport() {
  const qc = useQueryClient();

  // Progress is deliberately local state, not React Query — it is transient
  // UI for one in-flight run, not server state anyone else can observe.
  const [progress, setProgress] = useState(null); // { phase, done, total }

  /** Ask the server to match sheet headers to canonical columns. */
  const autoMapHeaders = useCallback(async (headers) => {
    const res = await client('/api/import/map-headers', {
      method: 'POST',
      body: JSON.stringify({ headers }),
    });
    return res.data;   // { mapping, unmappedRequired }
  }, []);

  /**
   * Dry run. Writes nothing; returns a per-row verdict for the preview table.
   * @param {object[]} rows  rows already reduced to canonical keys
   */
  const validate = useCallback(async (rows) => {
    const groups = chunk(rows, CHUNK_SIZE);
    const all    = [];
    const summary = { insert: 0, skip: 0, error: 0 };

    setProgress({ phase: 'validating', done: 0, total: rows.length });

    for (let i = 0; i < groups.length; i++) {
      const res = await client('/api/import/validate', {
        method: 'POST',
        body: JSON.stringify({
          rows: groups[i],
          rowOffset: i * CHUNK_SIZE + 2,   // +2: header is sheet row 1
        }),
      });
      all.push(...res.data.rows);
      summary.insert += res.data.summary.insert;
      summary.skip   += res.data.summary.skip;
      summary.error  += res.data.summary.error;
      setProgress({ phase: 'validating', done: Math.min((i + 1) * CHUNK_SIZE, rows.length), total: rows.length });
    }

    setProgress(null);
    return { rows: all, summary };
  }, []);

  /**
   * Commit for real. The first chunk opens the ImportJob; every later chunk
   * carries its id so a multi-request import stays one row in the history.
   */
  const commit = useCallback(async ({ rows, fileName }) => {
    const groups = chunk(rows, CHUNK_SIZE);
    let jobId = null;
    let totals = { inserted: 0, skipped: 0, errored: 0 };
    const errors = [];

    setProgress({ phase: 'importing', done: 0, total: rows.length });

    try {
      for (let i = 0; i < groups.length; i++) {
        const res = await client('/api/import/commit', {
          method: 'POST',
          body: JSON.stringify({
            jobId,
            fileName,
            rows: groups[i],
            rowOffset: i * CHUNK_SIZE + 2,
            totalRows: rows.length,
            isFinal: i === groups.length - 1,
          }),
        });
        jobId  = res.data.jobId;
        totals = res.data.totals;
        errors.push(...(res.data.errors || []));
        setProgress({ phase: 'importing', done: Math.min((i + 1) * CHUNK_SIZE, rows.length), total: rows.length });
      }
    } finally {
      setProgress(null);
      // Even a partial run has written batches — refresh whatever is on screen.
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['dispatch', 'fefo'] });
      qc.invalidateQueries({ queryKey: ['import', 'history'] });
    }

    return { jobId, totals, errors };
  }, [qc]);

  const rollback = useMutation({
    mutationFn: (jobId) => client(`/api/import/${jobId}/rollback`, { method: 'POST' }),
    onSuccess: (res) => {
      toast.success(res.message || 'Import rolled back');
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['batches', 'archived'] });
      qc.invalidateQueries({ queryKey: ['dispatch', 'fefo'] });
      qc.invalidateQueries({ queryKey: ['import', 'history'] });
    },
    onError: (err) => toast.error(err.message || 'Rollback failed'),
  });

  return { progress, autoMapHeaders, validate, commit, rollback };
}
