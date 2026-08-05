/**
 * useNotifications — Phase 3
 *
 * Manages the real-time notification feed for the authenticated user.
 *
 * - On mount: connects to Socket.io, joins the user's role room.
 * - Listens for 'notification:new' events and prepends them to state.
 * - Fetches initial list from REST API on load.
 * - Exposes: notifications, unreadCount, markRead, markAllRead, clearRead, isLoading.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { useAuth } from './useAuth';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

let _socket = null; // singleton socket — one connection per tab

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

  const [liveNotifs, setLiveNotifs] = useState([]);
  const socketRef = useRef(null);

  // Fetch initial notification list
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => client('/api/notifications').then(r => r.data || []),
    enabled:  !!user,
    staleTime: 30_000,
    retry: false,
  });

  // Merge DB list + live push arrivals (live ones go on top)
  const dbNotifs  = data || [];
  const dbIds     = new Set(dbNotifs.map(n => n._id));
  const merged    = [
    ...liveNotifs.filter(n => !dbIds.has(n._id)),
    ...dbNotifs,
  ];

  const unreadCount = merged.filter(n => !n.read).length;

  // Socket.io setup
  useEffect(() => {
    if (!user?.role) return;

    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      socket.emit('auth:join', { role: user.role, userId: user._id || user.id });
    };

    const onNewNotification = (notif) => {
      setLiveNotifs(prev => [{ ...notif, _isLive: true }, ...prev]);
      // Also invalidate the DB query so the bell count updates
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('connect', onConnect);
    socket.on('notification:new', onNewNotification);

    // If already connected, join immediately
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('notification:new', onNewNotification);
    };
  }, [user?.role, user?._id, user?.id, qc]);

  // Mark one as read
  const { mutate: markOneRead } = useMutation({
    mutationFn: (id) => client(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setLiveNotifs(prev => prev.map(n => n._id === arguments[0] ? { ...n, read: true } : n));
    },
  });

  const markRead = useCallback((id) => {
    setLiveNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    client(`/api/notifications/${id}/read`, { method: 'PATCH' })
      .then(() => qc.invalidateQueries({ queryKey: ['notifications'] }))
      .catch(() => {});
  }, [qc]);

  // Mark all as read
  const markAllRead = useCallback(() => {
    setLiveNotifs(prev => prev.map(n => ({ ...n, read: true })));
    client('/api/notifications/read-all', { method: 'PATCH' })
      .then(() => qc.invalidateQueries({ queryKey: ['notifications'] }))
      .catch(() => {});
  }, [qc]);

  // Clear read
  const clearRead = useCallback(() => {
    setLiveNotifs(prev => prev.filter(n => !n.read));
    client('/api/notifications/clear', { method: 'DELETE' })
      .then(() => qc.invalidateQueries({ queryKey: ['notifications'] }))
      .catch(() => {});
  }, [qc]);

  return { notifications: merged, unreadCount, markRead, markAllRead, clearRead, isLoading };
}
