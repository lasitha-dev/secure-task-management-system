const { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } = require('./constants');

/**
 * Seeds the database with realistic mock notifications if the collection is empty.
 * This is a temporary measure while other microservices are not yet triggering
 * real notifications. Replace this seeder with event-driven calls when ready.
 */
const seedMockData = async (NotificationModel) => {
    const count = await NotificationModel.countDocuments();
    if (count > 0) {
        console.log(`📋 Notifications collection already has ${count} documents — skipping seed.`);
        return;
    }

    const mockUserId = 'user_001';
    const secondUserId = 'user_002';

    const mockNotifications = [
        {
            type: NOTIFICATION_TYPES.TASK_ASSIGNED,
            title: 'New Task Assigned: Design API Schema',
            message: 'You have been assigned the task "Design API Schema" for the Task Management module. Due date: March 5, 2026.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.HIGH,
            isRead: false,
            metadata: { taskId: 'task_101', assignedBy: 'user_003' },
        },
        {
            type: NOTIFICATION_TYPES.DEADLINE_REMINDER,
            title: 'Deadline Approaching: User Authentication',
            message: 'The task "Implement User Authentication" is due in 2 days. Please ensure all unit tests are passing.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.CRITICAL,
            isRead: false,
            metadata: { taskId: 'task_087', dueDate: '2026-03-02' },
        },
        {
            type: NOTIFICATION_TYPES.COMMENT_ADDED,
            title: 'Sarah commented on "Task #402"',
            message: '"Hey, can you review the new API schema before we merge? I\'ve updated the endpoint contracts."',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.MEDIUM,
            isRead: false,
            metadata: { taskId: 'task_402', commentBy: 'user_004' },
        },
        {
            type: NOTIFICATION_TYPES.SYSTEM_ALERT,
            title: 'Server Load High: Auth-Service',
            message: 'Latency exceeded 500ms threshold in the production cluster. Immediate review of logs recommended.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.CRITICAL,
            isRead: false,
            metadata: { service: 'auth-service', metric: 'latency', value: '523ms' },
        },
        {
            type: NOTIFICATION_TYPES.TEAM_UPDATE,
            title: 'New Team Member Added',
            message: 'Michael Scott joined the "Engineering" workspace as a Senior Developer. Welcome them aboard!',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.LOW,
            isRead: true,
            metadata: { newMemberId: 'user_010', role: 'Senior Developer' },
        },
        {
            type: NOTIFICATION_TYPES.TASK_UPDATED,
            title: 'Task Status Changed: Database Migration',
            message: 'The task "Database Migration Script" has been moved from "In Progress" to "Code Review" by Alex.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.MEDIUM,
            isRead: true,
            metadata: { taskId: 'task_215', updatedBy: 'user_005', oldStatus: 'in_progress', newStatus: 'code_review' },
        },
        {
            type: NOTIFICATION_TYPES.SYSTEM_ALERT,
            title: 'Deployment Successful',
            message: 'Release v2.4.0 has been successfully deployed across all microservice pods. Health checks passed.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.LOW,
            isRead: true,
            metadata: { version: 'v2.4.0', environment: 'production' },
        },
        {
            type: NOTIFICATION_TYPES.SYSTEM_ALERT,
            title: 'Daily Backup Completed',
            message: 'Automated database backup (3.2GB) saved to secure S3 storage. Integrity check completed successfully.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.LOW,
            isRead: true,
            metadata: { size: '3.2GB', storage: 'S3' },
        },
        {
            type: NOTIFICATION_TYPES.TASK_ASSIGNED,
            title: 'New Task Assigned: Write Unit Tests',
            message: 'You have been assigned the task "Write Unit Tests for Notification Service". Priority: High.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.HIGH,
            isRead: false,
            metadata: { taskId: 'task_330', assignedBy: 'user_003' },
        },
        {
            type: NOTIFICATION_TYPES.COMMENT_ADDED,
            title: 'Alex replied to your comment on "Task #215"',
            message: '"Good catch on the edge case! I\'ve updated the migration script to handle null values."',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.MEDIUM,
            isRead: false,
            metadata: { taskId: 'task_215', commentBy: 'user_005' },
        },
        {
            type: NOTIFICATION_TYPES.DEADLINE_REMINDER,
            title: 'Overdue: CI/CD Pipeline Setup',
            message: 'The task "CI/CD Pipeline Setup" was due yesterday. Please update the status or request an extension.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.CRITICAL,
            isRead: false,
            metadata: { taskId: 'task_150', dueDate: '2026-02-27' },
        },
        {
            type: NOTIFICATION_TYPES.TEAM_UPDATE,
            title: 'Team Meeting Scheduled',
            message: 'Sprint retrospective meeting scheduled for Friday, March 1st at 10:00 AM. All team members are expected to attend.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.MEDIUM,
            isRead: false,
            metadata: { meetingDate: '2026-03-01', time: '10:00 AM' },
        },
        {
            type: NOTIFICATION_TYPES.TASK_ASSIGNED,
            title: 'New Task Assigned: Reporting Dashboard',
            message: 'You have been assigned the task "Build Reporting Dashboard" for the Analytics module.',
            recipientId: secondUserId,
            priority: NOTIFICATION_PRIORITIES.HIGH,
            isRead: false,
            metadata: { taskId: 'task_500', assignedBy: 'user_003' },
        },
        {
            type: NOTIFICATION_TYPES.TASK_UPDATED,
            title: 'Task Priority Changed: API Gateway Config',
            message: 'The priority of "API Gateway Configuration" has been elevated from Medium to Critical by the project lead.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.HIGH,
            isRead: false,
            metadata: { taskId: 'task_088', updatedBy: 'user_003', oldPriority: 'medium', newPriority: 'critical' },
        },
        {
            type: NOTIFICATION_TYPES.SYSTEM_ALERT,
            title: 'Security Scan Completed',
            message: 'Snyk security scan completed for notifications-management. No high-severity vulnerabilities detected.',
            recipientId: mockUserId,
            priority: NOTIFICATION_PRIORITIES.LOW,
            isRead: true,
            metadata: { service: 'notifications-management', vulnerabilities: 0 },
        },
    ];

    await NotificationModel.insertMany(mockNotifications);
    console.log(`🌱 Seeded ${mockNotifications.length} mock notifications successfully.`);
};

module.exports = seedMockData;
