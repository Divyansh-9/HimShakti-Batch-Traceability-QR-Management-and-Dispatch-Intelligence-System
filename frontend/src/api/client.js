// src/api/client.js
// Central fetch wrapper — ALL API calls go through here.
// Never call fetch() directly from a page or hook.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

/**
 * @param {string} path           - API path, e.g. '/api/batches'
 * @param {object} options        - Fetch options (method, body, headers, etc.)
 * @param {boolean} options.skipAuthRedirect - Set true for public endpoints (TracePage)
 */
async function client(path, options = {}) {
  const { skipAuthRedirect = false, ...fetchOptions } = options;

  const token = localStorage.getItem('hs_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  // Global 401 handler — skip for public pages (e.g. TracePage)
  if (res.status === 401 && !skipAuthRedirect) {
    localStorage.removeItem('hs_token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API Error: ${res.status}`);
  }

  return data;
}

export default client;
