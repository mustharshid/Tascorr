// api.js - Core client-side fetch helper for Tascorr.
// Handles API routing, header setups, credentials (JWT cookies/headers), and global error boundary catch-offs.

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
 * Global fetch wrapper with automatic headers and session error interceptors.
 * @param {string} method - HTTP Verb (GET, POST, PATCH, DELETE, etc.)
 * @param {string} path - API Endpoint Path (e.g. '/auth/login')
 * @param {Object} [body=null] - Optional Request Payload
 * @returns {Promise<any>} Response Data
 */
export async function fetchApi(method, path, body = null) {
  // Build absolute URL so fetch always targets /api/... at the server origin,
  // accounting for the deployment base path (e.g. /tascorr/)
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

  // Retrieve token from local storage if available (fallback to cookies)
  const token = localStorage.getItem('tascorr_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    // If session is expired or unauthorized, automatically redirect to login
    if (response.status === 401) {
      localStorage.removeItem('tascorr_token');
      localStorage.removeItem('tascorr_user');
      const hash = window.location.hash;
      if (hash && hash !== '#landing' && hash !== '#login' && hash !== '#signup') {
        window.location.hash = 'login';
      }
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
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or parse errors
    throw new ApiError(500, error.message || 'Network communication error. Please check your connection.');
  }
}
