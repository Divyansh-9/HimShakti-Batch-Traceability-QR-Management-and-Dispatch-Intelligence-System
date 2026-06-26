// src/hooks/useTrace.js
import { useState, useEffect } from 'react';
import client from '../api/client';

export function useTrace(batchCode) {
  const [trace, setTrace]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!batchCode) return;
    // Uses /api/qr/ path — avoids Vite proxy conflict with React Router's /trace/:batchCode page route
    // The backend serves trace data from both /trace/:code and /api/qr/:code
    client(`/api/qr/${batchCode}`, { skipAuthRedirect: true })
      .then(data => setTrace(data.data || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [batchCode]);

  return { trace, loading, error };
}
