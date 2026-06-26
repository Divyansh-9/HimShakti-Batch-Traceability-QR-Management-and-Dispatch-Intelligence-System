// src/hooks/useAuth.js
import { useState } from 'react';
import client from '../api/client';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  function getToken() {
    return localStorage.getItem('token');
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
        body: JSON.stringify({ username, password }),
        skipAuthRedirect: true, // login page should not redirect itself
      });
      localStorage.setItem('token', data.token);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  return { login, logout, isAuthenticated, getToken, loading, error };
}
