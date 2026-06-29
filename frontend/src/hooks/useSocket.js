/**
 * @fileoverview useSocket — Socket.io real-time connection hook.
 *
 * Connects to the backend WebSocket server and provides a subscribe
 * method so any component can react to server-push events.
 * On unmount, cleans up listeners to prevent memory leaks.
 */
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

let sharedSocket = null; // singleton — one connection per app session

function getSocket() {
  if (!sharedSocket || sharedSocket.disconnected) {
    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
    });
  }
  return sharedSocket;
}

export function useSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // ── batch:created ─────────────────────────────────────────────
    // Server emits this when any user creates a new batch.
    // We invalidate the query so React Query refetches fresh data —
    // this removes the optimistic row and replaces it with the real one.
    function onBatchCreated() {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch', 'fefo'] });
    }

    // ── batch:updated ─────────────────────────────────────────────
    // Server emits this when a batch status changes (e.g. DISPATCHED).
    // We patch the cache in-place for instant UI update, no full refetch.
    function onBatchUpdated({ batchId, status }) {
      queryClient.setQueryData(['batches'], (old = []) =>
        old.map(b => (b._id === batchId ? { ...b, status } : b))
      );
      queryClient.invalidateQueries({ queryKey: ['dispatch', 'fefo'] });
    }

    socket.on('batch:created', onBatchCreated);
    socket.on('batch:updated', onBatchUpdated);

    return () => {
      socket.off('batch:created', onBatchCreated);
      socket.off('batch:updated', onBatchUpdated);
    };
  }, [queryClient]);

  return socketRef.current;
}
