// api.js - Core client-side fetch helper for Tascorr.
// Phase 1 & 2: Offline-aware with service worker cache support.
// Phase 3: Queues mutations (POST/PATCH/DELETE) to IndexedDB when offline.

import { enqueueOperation, getPendingCount } from './offline-db.js';

/**
 * Custom Error class for API response failures
 */
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Offline Error — thrown when the device is offline and no cache is available.
 */
export class OfflineError extends Error {
  constructor() {
    super('You are currently offline. Showing cached data where available.');
    this.name = 'OfflineError';
  }
}

/**
 * Update the pending-changes badge in the UI.
 * Called after every enqueue/dequeue to keep the count accurate.
 */
export async function refreshPendingBadge() {
  try {
    const count = await getPendingCount();
    const badge = document.getElementById('pending-sync-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = `${count} pending`;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  } catch {
    // Non-fatal — badge is cosmetic
  }
}

/**
 * Global fetch wrapper with automatic headers and session error interceptors.
 * Phase 3: When offline, POST/PATCH/DELETE are queued to IndexedDB and an
 * optimistic success response is returned so the UI does not show errors.
 *
 * @param {string} method - HTTP Verb (GET, POST, PATCH, DELETE, etc.)
 * @param {string} path - API Endpoint Path (e.g. '/auth/login')
 * @param {Object} [body=null] - Optional Request Payload
 * @returns {Promise<any>} Response Data
 */
export async function fetchApi(method, path, body = null) {
  const basePath = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
    ? import.meta.env.BASE_URL.replace(/\/$/, '')
    : '';
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;
  const url = `${window.location.origin}${basePath}${apiPath}`;

  const headers = {
    'Accept': 'application/json',
  };

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('tascorr_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  // ── Phase 3: Queue mutations when offline ──────────────────────────────────
  const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase());
  if (isMutation && !navigator.onLine) {
    try {
      await enqueueOperation({ method, path: apiPath, body });
      await refreshPendingBadge();
      console.log(`[Offline Queue] Queued ${method} ${apiPath}`);
    } catch (err) {
      console.error('[Offline Queue] Failed to enqueue operation:', err);
    }
    // Return optimistic response — UI continues as if the request succeeded
    return { queued: true, message: 'Saved locally. Will sync when back online.' };
  }
  // ── End Phase 3 ────────────────────────────────────────────────────────────

  try {
    const response = await fetch(url, options);

    // If session is expired or unauthorized, redirect to login
    if (response.status === 401) {
      localStorage.removeItem('tascorr_token');
      localStorage.removeItem('tascorr_user');
      const hash = window.location.hash;
      if (hash && hash !== '#landing' && hash !== '#login' && hash !== '#signup') {
        window.location.hash = 'login';
      }
    }

    // 503 from service worker = offline + no cache
    if (response.status === 503 && method === 'GET') {
      throw new OfflineError();
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      throw new ApiError(response.status, data.error || data.message || 'API request failed.', data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError || error instanceof OfflineError) {
      throw error;
    }

    // Device-level network failure during a mutation — queue it
    if (isMutation && !navigator.onLine) {
      try {
        await enqueueOperation({ method, path: apiPath, body });
        await refreshPendingBadge();
      } catch { /* non-fatal */ }
      return { queued: true, message: 'Saved locally. Will sync when back online.' };
    }

    if (!navigator.onLine) {
      throw new OfflineError();
    }

    throw new ApiError(500, error.message || 'Network communication error. Please check your connection.');
  }
}
