// Centralized API client. Uses Vite dev proxy (BASE = '/api') by default.
// Set VITE_API_BASE_URL at build time to point the frontend at a backend on
// another same-site origin (e.g. https://api.example.com). A trailing slash is
// stripped so URL joins below stay predictable.
// Sends credentials (HTTP-only cookies) with every request and
// transparently refreshes the access token when it expires.

export const API_BASE = (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, '')
  : '/api');

const BASE = API_BASE;

let refreshPromise = null;

async function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d) => Boolean(d && d.success))
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(method, url, { body, params, credentials = 'include' } = {}, retried = false) {
  let query = '';
  if (params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, v);
    });
    const s = q.toString();
    if (s) query = `?${s}`;
  }

  const headers = {};
  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${url}${query}`, {
    method,
    headers,
    body: payload,
    credentials,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  // Attempt a single token refresh on 401 (unauthorized/expired). If the
  // refresh succeeds, retry the original request once with the new cookie.
  if (res.status === 401 && !retried && url !== '/auth/login' && url !== '/auth/refresh') {
    const refreshed = await refreshToken();
    if (!refreshed) {
      throw new ApiError('Your session has expired. Please log in again.', res.status, data);
    }
    return api(method, url, { body, params, credentials }, true);
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }

  return data;
}

export const get = (url, params, opts) => api('GET', url, { params, ...opts });
export const post = (url, body, params, opts) => api('POST', url, { body, params, ...opts });
export const put = (url, body, params, opts) => api('PUT', url, { body, params, ...opts });
export const del = (url, params, opts) => api('DELETE', url, { params, ...opts });
