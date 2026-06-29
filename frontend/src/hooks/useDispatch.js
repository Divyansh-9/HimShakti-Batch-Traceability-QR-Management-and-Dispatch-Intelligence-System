/**
 * @fileoverview useDispatch — React Query powered FEFO queue hook.
 */
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

const DISPATCH_KEY = ['dispatch', 'fefo'];

async function fetchFEFO() {
  const data = await client('/api/dispatch/fefo');
  return data.data || [];
}

export function useDispatch() {
  const {
    data: queue = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: DISPATCH_KEY,
    queryFn: fetchFEFO,
    staleTime: 60 * 1000, // queue doesn't need to refresh as often
  });

  return { queue, loading, error: error?.message || null, refetch };
}
