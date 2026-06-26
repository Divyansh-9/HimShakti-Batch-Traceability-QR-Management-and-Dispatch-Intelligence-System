// src/hooks/useAIAudit.js
import { useState } from 'react';
import client from '../api/client';

export function useAIAudit() {
  const [report, setReport]           = useState(null);
  const [fromCache, setFromCache]     = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  async function runAudit() {
    setLoading(true);
    setError(null);
    try {
      const data = await client('/api/ai/dispatch-audit', { method: 'POST' });
      setReport(data.report);
      setFromCache(data.fromCache);
      setGeneratedAt(data.generatedAt ? new Date(data.generatedAt) : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { report, fromCache, generatedAt, loading, error, runAudit };
}
