/**
 * useNotifications — Phase 3
 *
 * Manages the real-time notification feed for the authenticated user.
 *
 * - On mount: connects to Socket.io singleton, emits 'auth:join' with the user's role.
 * - Server puts the socket in `role:<role>` room — only relevant pushes arrive.
 * - Listens for 'notification:new' and prepends to local state.
 * - Fetches initial list from REST on load (last 30, sorted newest-first).
 * - Merges live arrivals + DB list, deduped by _id, live items on top.
 * - Exposes: notifications, unreadCount, markRead, markAllRead, clearRead, isLoading.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { io }              from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import client              from '../api/client';
import { useAuth }         from './useAuth';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ── Singleton socket — one connection per browser tab ───────────────
let _socket = null;
function getSocket() {
  if (!_socket || _socket.disconnected) {
    _socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return _socket;
}

export function useNotifications() {
  const { getUser } = useAuth();
  const user        = getUser();
  const qc          = useQueryClient();

  // Live push arrivals — prepended when socket delivers 'notification:new'
  const [liveNotifs, setLiveNotifs] = useState([]);
  const prefsRef = useRef(user);
  useEffect(() => { prefsRef.current = user; }, [user]);

  // ── REST — initial list on load ─────────────────────────────────
  const { data: dbNotifs = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => client('/api/notifications').then(r => r.data ?? []),
    enabled:  !!user,
    staleTime: 30_000,
    retry: false,
  });

  // Merge: live items first, filter out any that are already in the DB list
  const dbIds  = new Set(dbNotifs.map(n => n._id));
  const merged = [
    ...liveNotifs.filter(n => !dbIds.has(n._id)),
    ...dbNotifs,
  ];

  const unreadCount = merged.filter(n => !n.read).length;

  // ── Socket.io ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.role) return;
    const socket = getSocket();

    const joinRoom = () => {
      socket.emit('auth:join', {
        role:   user.role,
        userId: user._id ?? user.id ?? null,
      });
    };

    const onNewNotification = (notif) => {
      setLiveNotifs(prev => [notif, ...prev]);
      // Also refresh DB list so the panel shows the persisted version
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('connect', joinRoom);
    socket.on('notification:new', onNewNotification);

    if (socket.connected) joinRoom(); // already connected → join immediately

    return () => {
      socket.off('connect', joinRoom);
      socket.off('notification:new', onNewNotification);
    };
  }, [user?.role, user?._id, user?.id, qc]);

  // ── Actions ─────────────────────────────────────────────────────

  /** Mark a single notification as read — optimistic update + API call. */
  const markRead = useCallback((id) => {
    // Optimistic
    setLiveNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    qc.setQueryData(['notifications'], (old = []) =>
      old.map(n => n._id === id ? { ...n, read: true } : n)
    );
    // Persist
    client(`/api/notifications/${id}/read`, { method: 'PATCH' })
      .then(() => qc.invalidateQueries({ queryKey: ['notifications'] }))
      .catch(() => {/* silent — optimistic state remains */});
  }, [qc]);

  /** Mark all as read — optimistic + API. */
  const markAllRead = useCallback(() => {
    setLiveNotifs(prev => prev.map(n => ({ ...n, read: true })));
    qc.setQueryData(['notifications'], (old = []) => old.map(n => ({ ...n, read: true })));
    client('/api/notifications/read-all', { method: 'PATCH' })
      .then(() => qc.invalidateQueries({ queryKey: ['notifications'] }))
      .catch(() => {});
  }, [qc]);

  /** Delete all read notifications — optimistic + API. */
  const clearRead = useCallback(() => {
    setLiveNotifs(prev => prev.filter(n => !n.read));
    qc.setQueryData(['notifications'], (old = []) => old.filter(n => !n.read));
    client('/api/notifications/clear', { method: 'DELETE' })
      .then(() => qc.invalidateQueries({ queryKey: ['notifications'] }))
      .catch(() => {});
  }, [qc]);

  return { notifications: merged, unreadCount, markRead, markAllRead, clearRead, isLoading };
}
