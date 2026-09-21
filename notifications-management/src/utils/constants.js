/**
 * Shared constants for the Notifications Management Service.
 * Centralizes enums and messages to avoid magic strings throughout the codebase.
 */

// Define notification types as an enum

const NOTIFICATION_TYPES = Object.freeze({
    TASK_ASSIGNED: 'task_assigned',
    TASK_UPDATED: 'task_updated',
    DEADLINE_REMINDER: 'deadline_reminder',
    COMMENT_ADDED: 'comment_added',
    TEAM_UPDATE: 'team_update',
    SYSTEM_ALERT: 'system_alert',
});

const NOTIFICATION_PRIORITIES = Object.freeze({
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
});

const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPES);
const NOTIFICATION_PRIORITY_VALUES = Object.values(NOTIFICATION_PRIORITIES);

const RESPONSE_MESSAGES = Object.freeze({
    NOTIFICATION_CREATED: 'Notification created successfully',
    NOTIFICATION_FETCHED: 'Notifications retrieved successfully',
    NOTIFICATION_NOT_FOUND: 'Notification not found',
    NOTIFICATION_MARKED_READ: 'Notification marked as read',
    ALL_MARKED_READ: 'All notifications marked as read',
    NOTIFICATION_DELETED: 'Notification deleted successfully',
    PREFERENCES_FETCHED: 'Notification preferences retrieved successfully',
    PREFERENCES_UPDATED: 'Notification preferences updated successfully',
    VALIDATION_ERROR: 'Validation failed',
    INTERNAL_ERROR: 'Internal Server Error',
});

module.exports = {
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITIES,
    NOTIFICATION_TYPE_VALUES,
    NOTIFICATION_PRIORITY_VALUES,
    RESPONSE_MESSAGES,
};
