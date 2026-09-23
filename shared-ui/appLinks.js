const APP_PORTS = {
  user: 3000,
  task: 3001,
  notifications: 3002,
  reporting: 3003,
};

function buildQueryString(query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function getBaseOrigin(app, port) {
  // Use production environment variables if they are injected at build time
  try {
    if (app === 'user' && import.meta.env.VITE_USER_APP_URL) return import.meta.env.VITE_USER_APP_URL;
    if (app === 'task' && import.meta.env.VITE_TASK_APP_URL) return import.meta.env.VITE_TASK_APP_URL;
    if (app === 'notifications' && import.meta.env.VITE_NOTIFICATIONS_APP_URL) return import.meta.env.VITE_NOTIFICATIONS_APP_URL;
    if (app === 'reporting' && import.meta.env.VITE_REPORTING_APP_URL) return import.meta.env.VITE_REPORTING_APP_URL;
  } catch (e) {
    // Ignore error if import.meta.env is not defined (e.g. in non-Vite contexts)
  }

  if (typeof window === 'undefined') {
    return `http://127.0.0.1:${port}`;
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${port}`;
}

/**
 * Build a plain URL for another TaskMaster frontend application.
 *
 * SECURITY: This function never appends any JWT or authentication token
 * to the URL.  Cross-app authentication is handled by `redirectToApp()`,
 * which uses secure, single-use handoff tickets via the backend.
 */
export function buildAppUrl(app, path = '/', options = {}) {
  const port = APP_PORTS[app];

  if (!port) {
    throw new Error(`Unknown app key: ${app}`);
  }

  const { query = {} } = options;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = buildQueryString(query);
  const origin = getBaseOrigin(app, port).replace(/\/$/, "");
  return `${origin}${normalizedPath}${queryString}`;
}

/**
 * Derive the API gateway base URL for handoff ticket requests.
 * Uses the same env var that axiosConfig.js uses.
 */
function getApiBaseUrl() {
  try {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  } catch (e) {
    // ignore
  }
  return 'http://localhost:8000/api/users';
}

/**
 * Securely redirect to another TaskMaster frontend.
 *
 * If the user is authenticated (JWT in localStorage) and `includeAuth` is
 * true (the default), this function:
 *   1. POSTs to /auth/handoff to obtain a single-use, 60-second handoff code.
 *   2. Appends ?handoff=<code> to the target URL.
 *   3. The receiving frontend exchanges the code for the JWT via
 *      POST /auth/handoff/exchange.
 *
 * The JWT NEVER appears in the URL, browser history, or Referer header.
 *
 * If the handoff API call fails (e.g. user logged out, network error), the
 * redirect proceeds without authentication — the target app will show its
 * own login page.
 */
export async function redirectToApp(app, path = '/', options = {}) {
  const {
    includeAuth = true,
    query = {},
  } = options;

  const baseUrl = buildAppUrl(app, path, { query });

  if (!includeAuth) {
    globalThis.location.href = baseUrl;
    return;
  }

  const token = (typeof window !== 'undefined')
    ? window.localStorage.getItem('token') || ''
    : '';

  if (!token) {
    globalThis.location.href = baseUrl;
    return;
  }

  // Request a single-use handoff code from the backend
  try {
    const apiBase = getApiBaseUrl();
    const response = await fetch(`${apiBase}/auth/handoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const body = await response.json();
      const code = body?.data?.code;
      if (code) {
        // Append handoff code as a query parameter — not a hash fragment
        const separator = baseUrl.includes('?') ? '&' : '?';
        globalThis.location.href = `${baseUrl}${separator}handoff=${encodeURIComponent(code)}`;
        return;
      }
    }
  } catch (e) {
    // Fall through — redirect without auth; target app will prompt login
  }

  // Fallback: redirect without token
  globalThis.location.href = baseUrl;
}
