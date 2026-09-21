import { TYPE_META } from '../constants/notificationMeta';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationCard({ notification, onMarkRead, onDelete }) {
  const meta = TYPE_META[notification.type] || {
    icon: 'info',
    iconClass: 'system',
    label: 'Notification',
  };

  return (
    <div className={`notification-card ${notification.isRead ? '' : 'unread'}`}>
      <div className={`notif-icon-wrapper ${meta.iconClass}`}>
        <span className="material-icons-outlined">{meta.icon}</span>
      </div>
      <div className="notif-body">
        <div className="notif-header">
          <div className="notif-title">{notification.title}</div>
        </div>
        <div className="notif-message">{notification.message}</div>
        <div className="notif-meta">
          <span className="notif-time">
            <span className="material-icons-outlined">schedule</span>
            {timeAgo(notification.createdAt)}
          </span>
          <span className={`notif-priority ${notification.priority}`}>{notification.priority}</span>
        </div>
      </div>
      <div className="notif-actions">
        {!notification.isRead ? (
          <button className="notif-action-btn" onClick={() => onMarkRead(notification._id)} title="Mark as read">
            <span className="material-icons-outlined">done</span>
          </button>
        ) : null}
        <button className="notif-action-btn delete" onClick={() => onDelete(notification._id)} title="Delete">
          <span className="material-icons-outlined">delete_outline</span>
        </button>
      </div>
    </div>
  );
}