/**
 * @fileoverview useMessages — record threads and role channels.
 *
 * REST-first by design. The backend runs serverless, where there is no
 * persistent socket layer, so polling is the mechanism that actually works in
 * production and the socket is only an accelerator for connected clients.
 * Every view here is correct with the socket switched off entirely.
 *
 * Polling only runs while a thread or channel is on screen, and pauses when
 * the tab is hidden, so an idle dashboard is not hammering the API.
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import client from '../api/client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const POLL_MS = 15_000;

// A third singleton would be a mistake; this reuses the notification socket's
// pattern but for message events only. See useSocket.js / useNotifications.js —
// they each hold their own connection, which is a known wart in this codebase.
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

/**
 * Invalidate message queries when the server says something changed.
 * Purely an optimisation — the poll would pick it up regardless.
 */
function useMessageSocket(queryKey, predicate) {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    function onNew(payload) {
      if (predicate(payload)) qc.invalidateQueries({ queryKey });
    }
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
    // queryKey is an array literal at the call sites; join it so the effect
    // does not re-subscribe on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, queryKey.join('|')]);
}

// ── Record threads ────────────────────────────────────────────────────

/**
 * Comments attached to one batch or inspection.
 * @param {'batch'|'inspection'} refType
 * @param {string} refId
 * @param {boolean} enabled  false while the drawer is closed
 */
export function useRecordThread(refType, refId, enabled = true) {
  const qc = useQueryClient();
  const queryKey = ['messages', 'record', refType, refId];
  const on = !!(enabled && refType && refId);

  useMessageSocket(queryKey, p => p?.scope === 'record' && p?.refId === String(refId));

  const query = useQuery({
    queryKey,
    queryFn: () => client(`/api/messages/record/${refType}/${refId}`).then(r => r.data ?? []),
    enabled: on,
    refetchInterval: on ? POLL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    retry: false,
  });

  const post = useMutation({
    mutationFn: (body) => client(`/api/messages/record/${refType}/${refId}`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (err) => toast.error(err.message || 'Could not post that comment'),
  });

  return { messages: query.data ?? [], isLoading: query.isLoading, post };
}

// ── Role channels ─────────────────────────────────────────────────────

/** Which channels this user may open, and the retention window. */
export function useChannelList() {
  return useQuery({
    queryKey: ['messages', 'channels'],
    queryFn: () => client('/api/messages/channels').then(r => r.data),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useChannel(role, enabled = true) {
  const qc = useQueryClient();
  const queryKey = ['messages', 'channel', role];
  const on = !!(enabled && role);

  useMessageSocket(queryKey, p => p?.scope === 'channel' && p?.channelRole === role);

  const query = useQuery({
    queryKey,
    queryFn: () => client(`/api/messages/channel/${role}`).then(r => r.data ?? []),
    enabled: on,
    refetchInterval: on ? POLL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    retry: false,
  });

  const post = useMutation({
    mutationFn: (body) => client(`/api/messages/channel/${role}`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (err) => toast.error(err.message || 'Could not send that message'),
  });

  return { messages: query.data ?? [], isLoading: query.isLoading, post };
}

// ── Shared mutations ──────────────────────────────────────────────────

export function useMessageActions(queryKey) {
  const qc = useQueryClient();

  const edit = useMutation({
    mutationFn: ({ id, body }) => client(`/api/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (err) => toast.error(err.message || 'Could not edit that message'),
  });

  const remove = useMutation({
    mutationFn: (id) => client(`/api/messages/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (err) => toast.error(err.message || 'Could not delete that message'),
  });

  return { edit, remove };
}

// ── Team directory ────────────────────────────────────────────────────

/** Contact directory. Manager and above; the API returns 403 otherwise. */
export function useDirectory({ search = '', role = '' } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (role)   params.set('role', role);
  const qs = params.toString();

  return useQuery({
    queryKey: ['directory', search, role],
    queryFn: () => client(`/auth/directory${qs ? `?${qs}` : ''}`).then(r => r.data),
    staleTime: 60_000,
    retry: false,
    placeholderData: (prev) => prev,   // keep the list on screen while searching
  });
}
