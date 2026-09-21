import { fireEvent, render, screen } from '@testing-library/react';
import NotificationCard from './NotificationCard';

describe('NotificationCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders unread notification details and triggers actions', () => {
    const onMarkRead = vi.fn();
    const onDelete = vi.fn();

    render(
      <NotificationCard
        notification={{
          _id: 'notif-1',
          type: 'task_assigned',
          title: 'Task assigned',
          message: 'You have a new task',
          priority: 'high',
          isRead: false,
          createdAt: '2026-03-08T11:30:00.000Z',
        }}
        onMarkRead={onMarkRead}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Task assigned')).toBeInTheDocument();
    expect(screen.getByText('You have a new task')).toBeInTheDocument();
    expect(screen.getByText('30m ago')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Mark as read'));
    fireEvent.click(screen.getByTitle('Delete'));

    expect(onMarkRead).toHaveBeenCalledWith('notif-1');
    expect(onDelete).toHaveBeenCalledWith('notif-1');
  });

  it('omits the mark-read button for read notifications', () => {
    render(
      <NotificationCard
        notification={{
          _id: 'notif-2',
          type: 'system_alert',
          title: 'System notice',
          message: 'Already read',
          priority: 'low',
          isRead: true,
          createdAt: '2026-03-08T11:59:00.000Z',
        }}
        onMarkRead={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByTitle('Mark as read')).not.toBeInTheDocument();
  });
});