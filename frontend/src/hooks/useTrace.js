// src/hooks/useTrace.js
import { useState, useEffect } from 'react';
import client from '../api/client';

/**
 * Fetch the public trace record.
 *
 * Two identifier kinds, resolved by different endpoints:
 *   token     — from a scanned QR. Returns the full provenance record.
 *   batchCode — a legacy QR printed before tokens existed, or a code
 *               typed by hand. Returns a reduced record.
 *
 * The reduced response is not an error state: it carries
 * `detailLevel: 'limited'` and the page renders what it has.
 *
 * Requests go via /api/qr/... rather than /trace/... because /trace is
 * also this SPA's own client-side route, and the Vite dev proxy cannot
 * serve both from one path.
 *
 * `loading` is derived by comparing the identifier the state was filled
 * for against the one currently requested, rather than being flipped by
 * a setState in the effect body. That keeps the reset atomic with the
 * identifier change — switching identifiers can never briefly show the
 * previous batch's data as though it were the new one.
 */
export function useTrace(identifier, kind = 'batchCode') {
  const [state, setState] = useState({ forId: null, trace: null, error: null });

  useEffect(() => {
    if (!identifier) return undefined;

    // Guards against an out-of-order response overwriting a newer one.
    let cancelled = false;

    const path = kind === 'token'
      ? `/api/qr/t/${identifier}`
      : `/api/qr/${identifier}`;

    client(path, { skipAuthRedirect: true })
      .then((data) => {
        if (!cancelled) setState({ forId: identifier, trace: data.data || data, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ forId: identifier, trace: null, error: err.message });
      });

    return () => { cancelled = true; };
  }, [identifier, kind]);

  const settled = state.forId === identifier;

  return {
    trace:   settled ? state.trace : null,
    error:   settled ? state.error : null,
    loading: Boolean(identifier) && !settled,
  };
}
