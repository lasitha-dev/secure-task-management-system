import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationCenter from './NotificationCenter';
import * as notificationsApi from '../api/notificationsApi';

vi.mock('../api/notificationsApi', () => ({
  getNotifications: vi.fn(),
  getPreferences: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  deleteNotification: vi.fn(),
  updatePreferences: vi.fn(),
}));

const notifications = [
  {
    _id: 'notif-1',
    type: 'task_assigned',
    title: 'Task assigned',
    message: 'A task needs attention',
    priority: 'high',
    isRead: false,
    createdAt: '2026-03-08T11:45:00.000Z',
  },
  {
    _id: 'notif-2',
    type: 'system_alert',
    title: 'System alert',
    message: 'Deployment finished',
    priority: 'low',
    isRead: true,
    createdAt: '2026-03-08T10:00:00.000Z',
  },
];

describe('NotificationCenter', () => {
  const currentUser = { id: 'user_001', name: 'Jane Doe', role: 'developer' };

  beforeEach(() => {
    notificationsApi.getNotifications.mockResolvedValue({ data: { notifications } });
    notificationsApi.getPreferences.mockResolvedValue({
      data: { emailEnabled: true, inAppEnabled: true, preferences: {} },
    });
    notificationsApi.markNotificationRead.mockResolvedValue({ data: {} });
    notificationsApi.markAllNotificationsRead.mockResolvedValue({ data: {} });
    notificationsApi.deleteNotification.mockResolvedValue({ data: {} });
    notificationsApi.updatePreferences.mockResolvedValue({
      data: { emailEnabled: false, inAppEnabled: true, preferences: { task_assigned: { enabled: false } } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads notifications and filters by type and status', async () => {
    render(<NotificationCenter currentUser={currentUser} />);

    expect(await screen.findByText('Task assigned')).toBeInTheDocument();
    expect(screen.getByText('System alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /tasks/i }));
    expect(screen.getByText('Task assigned')).toBeInTheDocument();
    expect(screen.queryByText('System alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^all$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^unread$/i }));
    expect(screen.getByText('Task assigned')).toBeInTheDocument();
    expect(screen.queryByText('System alert')).not.toBeInTheDocument();
  });

  it('marks notifications as read, deletes them, and saves preferences', async () => {
    render(<NotificationCenter currentUser={currentUser} />);

    expect(await screen.findByText('Task assigned')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Mark as read'));
    await waitFor(() => {
      expect(notificationsApi.markNotificationRead).toHaveBeenCalledWith('notif-1');
    });

    fireEvent.click(screen.getAllByTitle('Delete')[0]);
    await waitFor(() => {
      expect(notificationsApi.deleteNotification).toHaveBeenCalledWith('notif-1');
    });

    fireEvent.click(screen.getByRole('button', { name: /preferences/i }));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(notificationsApi.updatePreferences).toHaveBeenCalledWith('user_001', expect.any(Object));
    });
  });

  it('shows an error state when the API load fails', async () => {
    notificationsApi.getNotifications.mockRejectedValueOnce(new Error('offline'));

    render(<NotificationCenter currentUser={currentUser} />);

    expect(await screen.findByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText(/could not reach the notifications api/i)).toBeInTheDocument();
  });

  it('shows an auth-required message when there is no current user', async () => {
    render(<NotificationCenter currentUser={null} />);

    expect(await screen.findByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText(/need to sign in through the user-management flow/i)).toBeInTheDocument();
    expect(notificationsApi.getNotifications).not.toHaveBeenCalled();
  });
});