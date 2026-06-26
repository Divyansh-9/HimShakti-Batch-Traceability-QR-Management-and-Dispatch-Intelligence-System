// src/hooks/useAuth.js
// Parses role + name from the login response body (never from re-decoding the token).
// The backend now returns { token, user: { username, name, role } } on login.
import { useState } from 'react';
import client from '../api/client';

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

  return { login, logout, requestAccess, isAuthenticated, getToken, getUser, loading, error };
}
