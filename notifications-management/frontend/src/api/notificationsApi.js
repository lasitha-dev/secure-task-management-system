import { getStoredToken } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || '/api/notifications';

async function request(path = '', options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function getNotifications(recipientId, limit = 50) {
  const params = new URLSearchParams({ recipientId, limit: String(limit) });
  return request(`?${params.toString()}`);
}

export function markNotificationRead(id) {
  return request(`/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(recipientId) {
  return request('/read-all', {
    method: 'PATCH',
    body: JSON.stringify({ recipientId }),
  });
}

export function deleteNotification(id) {
  return request(`/${id}`, { method: 'DELETE' });
}

export function getPreferences(userId) {
  return request(`/preferences/${userId}`);
}

export function updatePreferences(userId, preferences) {
  return request(`/preferences/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}