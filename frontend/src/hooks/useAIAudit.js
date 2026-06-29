/**
 * @fileoverview useAIAudit — hook for triggering and caching the AI dispatch audit.
 * 
 * The backend now returns structured JSON (not Markdown), so `report` is an object
 * with typed sections (urgentBatches, qualityWarnings, etc.) ready for card rendering.
 */
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
      // report is now a structured JSON object, not a plain string
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
