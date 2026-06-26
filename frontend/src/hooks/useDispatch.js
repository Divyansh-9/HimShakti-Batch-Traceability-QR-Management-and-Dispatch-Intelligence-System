// src/hooks/useDispatch.js
import { useState, useEffect } from 'react';
import client from '../api/client';

export function useDispatch() {
  const [queue, setQueue]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchQueue = async () => {
    try {
      const data = await client('/api/dispatch/fefo');
      setQueue(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return { queue, loading, error, refetch: fetchQueue };
}
