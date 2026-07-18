/**
 * @fileoverview useAIAudit — hook for triggering and caching the AI dispatch audit.
 *
 * The backend returns structured JSON with typed sections (urgentBatches,
 * qualityWarnings, etc.) and now also returns `provider` ('gemini' | 'nvidia')
 * so the UI can show exactly which model handled the request.
 */
import { useState } from 'react';
import client from '../api/client';

export function useAIAudit() {
  const [report, setReport]           = useState(null);
  const [fromCache, setFromCache]     = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [provider, setProvider]       = useState(null);   // 'gemini' | 'nvidia'
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
      setProvider(data.provider || 'gemini');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { report, fromCache, generatedAt, provider, loading, error, runAudit };
}
