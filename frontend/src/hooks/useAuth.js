// src/hooks/useAuth.js
// Parses role + isSuperAdmin from the login response body.
// The backend returns { token, user: { username, name, role, isSuperAdmin } } on login.
import { useState } from 'react';
import client from '../api/client';

// ── Role tier constants (mirrors backend getTier) ──────────────────
export const ROLE_TIER = {
  'factory-manager':      3,
  'quality-inspector':    3,
  'dispatch-coordinator': 3,
  'manager':              2,
  'admin':                1,
  // super-admin is tier 0 — identified by isSuperAdmin flag
};

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  function getToken() {
    return localStorage.getItem('hs_token');
  }

  function getUser() {
    try {
      const raw = localStorage.getItem('hs_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** Returns true if the current user is the immutable Super Admin. */
  function isSuperAdmin() {
    return !!getUser()?.isSuperAdmin;
  }

  /** Returns true if the current user is admin OR super-admin. */
  function isAdmin() {
    const u = getUser();
    return !!u?.isSuperAdmin || u?.role === 'admin';
  }

  /** Returns true if current user is manager, admin, or super-admin. */
  function isManagerOrAbove() {
    const u = getUser();
    if (!u) return false;
    return !!u.isSuperAdmin || u.role === 'admin' || u.role === 'manager';
  }

  /**
   * canManage(targetUser) — true if the current user has a higher tier
   * than the target user and is therefore allowed to act on them.
   * Super Admin (tier 0) can manage everyone except themselves.
   */
  function canManage(targetUser) {
    const me = getUser();
    if (!me) return false;
    if (me.username === targetUser?.username) return false;  // never self
    if (me.isSuperAdmin) return !targetUser?.isSuperAdmin;   // SA manages all except SA
    const myTier     = ROLE_TIER[me.role]   ?? 99;
    const theirTier  = targetUser?.isSuperAdmin ? 0 : (ROLE_TIER[targetUser?.role] ?? 99);
    return myTier < theirTier;   // lower number = higher privilege
  }

  function isAuthenticated() {
    return !!getToken();
  }

  async function login(username, password) {
    setLoading(true);
    setError(null);
    try {
      const data = await client('/auth/login', {
        method: 'POST',
        body:   JSON.stringify({ username, password }),
        skipAuthRedirect: true,
      });
      localStorage.setItem('hs_token', data.token);
      // Store full user object including isSuperAdmin
      localStorage.setItem('hs_user',  JSON.stringify(data.user));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function requestAccess(formData) {
    setLoading(true);
    setError(null);
    try {
      const data = await client('/auth/request-access', {
        method: 'POST',
        body:   JSON.stringify(formData),
        skipAuthRedirect: true,
      });
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('hs_token');
    localStorage.removeItem('hs_user');
    window.location.href = '/login';
  }

  return {
    login, logout, requestAccess,
    isAuthenticated, getToken, getUser,
    isSuperAdmin, isAdmin, isManagerOrAbove, canManage,
    loading, error,
  };
}
