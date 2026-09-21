const APP_PORTS = {
  user: 3000,
  task: 3001,
  notifications: 3002,
  reporting: 3003,
};

function getToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem('token') || '';
}

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

export function buildAppUrl(app, path = '/', options = {}) {
  const port = APP_PORTS[app];

  if (!port) {
    throw new Error(`Unknown app key: ${app}`);
  }

  const {
    includeToken = true,
    query = {},
  } = options;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = buildQueryString(query);
  // Ensure the origin does not have a trailing slash, and normalizedPath starts with slash
  const origin = getBaseOrigin(app, port).replace(/\/$/, "");
  const baseUrl = `${origin}${normalizedPath}${queryString}`;

  if (!includeToken) {
    return baseUrl;
  }

  const token = getToken();
  return token ? `${baseUrl}#token=${encodeURIComponent(token)}` : baseUrl;
}

export function redirectToApp(app, path = '/', options = {}) {
  globalThis.location.href = buildAppUrl(app, path, options);
}
