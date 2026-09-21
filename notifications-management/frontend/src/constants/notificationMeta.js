export const TYPE_META = {
  task_assigned: { icon: 'assignment_ind', iconClass: 'task', label: 'Task Assigned', group: 'task' },
  task_updated: { icon: 'update', iconClass: 'task', label: 'Task Updated', group: 'task' },
  deadline_reminder: { icon: 'alarm', iconClass: 'deadline', label: 'Deadline', group: 'task' },
  comment_added: { icon: 'chat_bubble', iconClass: 'comment', label: 'Comment', group: 'comment' },
  team_update: { icon: 'group_add', iconClass: 'team', label: 'Team Update', group: 'team' },
  system_alert: { icon: 'dns', iconClass: 'system', label: 'System Alert', group: 'system' },
};

export const TYPE_LABELS = {
  task_assigned: 'Task Assignments',
  task_updated: 'Task Status Changes',
  deadline_reminder: 'Deadline Reminders',
  comment_added: 'Comments & Mentions',
  team_update: 'Team Updates',
  system_alert: 'System Alerts',
};

export const FILTERS = [
  { key: 'all', label: 'All', icon: null },
  { key: 'task', label: 'Tasks', icon: 'assignment' },
  { key: 'system', label: 'System', icon: 'dns' },
  { key: 'team', label: 'Team', icon: 'group' },
  { key: 'comment', label: 'Comments', icon: 'chat_bubble' },
];

export const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];