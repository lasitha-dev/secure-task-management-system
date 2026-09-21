const { RESPONSE_MESSAGES } = require('../utils/constants');

function createForbiddenError() {
    const error = new Error('Access denied.');
    error.statusCode = 403;
    return error;
}

/**
 * Notification Controller
 * Thin request/response layer that delegates all logic to the service.
 * Each handler is ≤30 lines (Single Responsibility).
 */
class NotificationController {
    constructor(notificationService) {
        this.service = notificationService;
        // Bind methods so they retain `this` context when used as route handlers
        this.getNotifications = this.getNotifications.bind(this);
        this.getNotificationById = this.getNotificationById.bind(this);
        this.createNotification = this.createNotification.bind(this);
        this.markAsRead = this.markAsRead.bind(this);
        this.markAllAsRead = this.markAllAsRead.bind(this);
        this.deleteNotification = this.deleteNotification.bind(this);
        this.getUnreadCount = this.getUnreadCount.bind(this);
        this.getPreferences = this.getPreferences.bind(this);
        this.updatePreferences = this.updatePreferences.bind(this);
    }

    async getNotifications(req, res, next) {
        try {
            const { recipientId, type, isRead, priority, page, limit } = req.query;
            if (recipientId && recipientId !== req.user.id) {
                throw createForbiddenError();
            }

            const parsedIsRead = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
            const result = await this.service.getAllNotifications({
                recipientId: req.user.id,
                type,
                isRead: parsedIsRead,
                priority,
                page: Number(page) || 1, limit: Number(limit) || 20,
            });
            res.status(200).json({ success: true, message: RESPONSE_MESSAGES.NOTIFICATION_FETCHED, data: result });
        } catch (err) { next(err); }
    }

    async getNotificationById(req, res, next) {
        try {
            const notification = await this.service.getNotificationById(req.params.id, req.user.id);
            res.status(200).json({ success: true, data: notification });
        } catch (err) { next(err); }
    }

    async createNotification(req, res, next) {
        try {
            const notification = await this.service.createNotification(req.body);
            res.status(201).json({ success: true, message: RESPONSE_MESSAGES.NOTIFICATION_CREATED, data: notification });
        } catch (err) { next(err); }
    }

    async markAsRead(req, res, next) {
        try {
            const notification = await this.service.markAsRead(req.params.id, req.user.id);
            res.status(200).json({ success: true, message: RESPONSE_MESSAGES.NOTIFICATION_MARKED_READ, data: notification });
        } catch (err) { next(err); }
    }

    async markAllAsRead(req, res, next) {
        try {
            const { recipientId } = req.body;
            if (recipientId !== req.user.id) {
                throw createForbiddenError();
            }

            const result = await this.service.markAllAsRead(recipientId);
            res.status(200).json({ success: true, message: RESPONSE_MESSAGES.ALL_MARKED_READ, data: result });
        } catch (err) { next(err); }
    }

    async deleteNotification(req, res, next) {
        try {
            await this.service.deleteNotification(req.params.id, req.user.id);
            res.status(200).json({ success: true, message: RESPONSE_MESSAGES.NOTIFICATION_DELETED });
        } catch (err) { next(err); }
    }

    async getUnreadCount(req, res, next) {
        try {
            const { recipientId } = req.query;
            if (recipientId && recipientId !== req.user.id) {
                throw createForbiddenError();
            }

            const result = await this.service.getUnreadCount(req.user.id);
            res.status(200).json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async getPreferences(req, res, next) {
        try {
            if (req.params.userId !== req.user.id) {
                throw createForbiddenError();
            }

            const prefs = await this.service.getPreferences(req.params.userId, req.user.email || null);
            res.status(200).json({ success: true, message: RESPONSE_MESSAGES.PREFERENCES_FETCHED, data: prefs });
        } catch (err) { next(err); }
    }

    async updatePreferences(req, res, next) {
        try {
            if (req.params.userId !== req.user.id) {
                throw createForbiddenError();
            }

            const prefs = await this.service.updatePreferences(req.params.userId, req.body, req.user.email || null);
            res.status(200).json({ success: true, message: RESPONSE_MESSAGES.PREFERENCES_UPDATED, data: prefs });
        } catch (err) { next(err); }
    }
}

module.exports = NotificationController;
