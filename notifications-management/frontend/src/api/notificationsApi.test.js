import { getStoredToken } from '../utils/auth';
import {
  deleteNotification,
  getNotifications,
  getPreferences,
  markAllNotificationsRead,
  markNotificationRead,
  updatePreferences,
} from './notificationsApi';

vi.mock('../utils/auth', () => ({
  getStoredToken: vi.fn(),
}));

describe('notificationsApi', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
    getStoredToken.mockReturnValue('token-123');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests notifications with the expected query params', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, data: { notifications: [] } }),
    });

    await getNotifications('user_001', 25);

    expect(fetch).toHaveBeenCalledWith(
      '/api/notifications?recipientId=user_001&limit=25',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
      })
    );
  });

  it('throws the API message for JSON failures', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: false, message: 'Validation failed' }),
    });

    await expect(markNotificationRead('abc123')).rejects.toMatchObject({
      message: 'Validation failed',
      status: 400,
    });
  });

  it('throws a fallback message for non-JSON failures', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 503,
      headers: { get: () => 'text/plain' },
    });

    await expect(deleteNotification('abc123')).rejects.toMatchObject({
      message: 'Request failed with status 503',
      status: 503,
    });
  });

  it('sends JSON payloads for mutation requests', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, data: {} }),
    });

    await markAllNotificationsRead('user_001');
    await updatePreferences('user_001', { emailEnabled: false });
    await getPreferences('user_001');

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/notifications/read-all',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ recipientId: 'user_001' }) })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/notifications/preferences/user_001',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ emailEnabled: false }) })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      '/api/notifications/preferences/user_001',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });
});