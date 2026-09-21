const { RESPONSE_MESSAGES } = require('../utils/constants');
const { sendNotificationEmail } = require('./emailService');

function createNotFoundError() {
    const error = new Error(RESPONSE_MESSAGES.NOTIFICATION_NOT_FOUND);
    error.statusCode = 404;
    return error;
}

/**
 * Notification Service
 * Encapsulates all business logic for notification CRUD and preferences.
 * Models are injected to support testability (Dependency Inversion).
 */
class NotificationService {
    constructor(NotificationModel, PreferenceModel) {
        this.Notification = NotificationModel;
        this.Preference = PreferenceModel;
    }

    /**
     * Retrieve notifications with optional filters and pagination.
     */
    async getAllNotifications({ recipientId, type, isRead, priority, page = 1, limit = 20 }) {
        const filter = {};
        if (recipientId) filter.recipientId = recipientId;
        if (type) filter.type = type;
        if (typeof isRead === 'boolean') filter.isRead = isRead;
        if (priority) filter.priority = priority;

        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            this.Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            this.Notification.countDocuments(filter),
        ]);

        return {
            notifications,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Retrieve a single notification by its ID.
     */
    async getNotificationById(id, recipientId = null) {
        const filter = recipientId ? { _id: id, recipientId } : { _id: id };
        const notification = await this.Notification.findOne(filter).lean();
        if (!notification) {
            throw createNotFoundError();
        }
        return notification;
    }

    /**
     * Create a new notification and dispatch an email if the recipient's
     * preferences allow it (best-effort — email errors never block creation).
     */
    async createNotification(data) {
        const notification = await this.Notification.create(data);
        const plain = notification.toObject();
        await this._maybeSendEmail(plain);
        return plain;
    }

    /**
     * Checks user preferences and dispatches an email for the notification
     * when both the global emailEnabled flag and the per-type email flag are
     * enabled.  All errors are caught — this method never throws.
     * @param {object} notification — Plain notification object
     */
    async _maybeSendEmail(notification) {
        try {
            const prefs = await this.Preference.findOne({ userId: notification.recipientId }).lean();
            // When no preferences exist, default to sending the email
            const emailEnabled = prefs ? prefs.emailEnabled : true;
            if (!emailEnabled) return;

            // Per-type email preference (stored in a Map/object keyed by type)
            if (prefs?.preferences) {
                const typePrefs = prefs.preferences instanceof Map
                    ? prefs.preferences.get(notification.type)
                    : prefs.preferences[notification.type];
                if (typePrefs && typePrefs.email === false) return;
            }

            // Resolve recipient email: stored user email (from JWT) takes priority over metadata
            const recipientEmail = prefs?.userEmail || notification?.metadata?.recipientEmail;
            if (!recipientEmail) return;

            const enriched = {
                ...notification,
                metadata: { ...(notification.metadata || {}), recipientEmail },
            };
            await sendNotificationEmail(enriched);
        } catch (error) {
            console.error(`[NotificationService] _maybySendEmail failed for notification ${notification._id}: ${error.message}`);
        }
    }

    /**
     * Mark a single notification as read.
     */
    async markAsRead(id, recipientId = null) {
        const filter = recipientId ? { _id: id, recipientId } : { _id: id };
        const notification = await this.Notification.findOneAndUpdate(
            filter,
            { isRead: true },
            { new: true, runValidators: true }
        ).lean();

        if (!notification) {
            throw createNotFoundError();
        }
        return notification;
    }

    /**
     * Mark all notifications for a recipient as read.
     */
    async markAllAsRead(recipientId) {
        const result = await this.Notification.updateMany(
            { recipientId, isRead: false },
            { isRead: true }
        );
        return { modifiedCount: result.modifiedCount };
    }

    /**
     * Delete a notification by ID.
     */
    async deleteNotification(id, recipientId = null) {
        const filter = recipientId ? { _id: id, recipientId } : { _id: id };
        const notification = await this.Notification.findOneAndDelete(filter).lean();
        if (!notification) {
            throw createNotFoundError();
        }
        return notification;
    }

    /**
     * Get the count of unread notifications for a recipient.
     */
    async getUnreadCount(recipientId) {
        const count = await this.Notification.countDocuments({ recipientId, isRead: false });
        return { count };
    }

    /**
     * Retrieve notification preferences for a user. Creates defaults if none exist.
     * Persists the user's email (from their JWT) so it is available for email dispatch.
     * @param {string} userId
     * @param {string|null} userEmail — email decoded from the caller's JWT
     */
    async getPreferences(userId, userEmail = null) {
        const update = { $setOnInsert: { userId } };
        if (userEmail) {
            update.$set = { userEmail };
        }
        const prefs = await this.Preference.findOneAndUpdate(
            { userId },
            update,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
        return prefs;
    }

    /**
     * Update notification preferences for a user (upsert).
     * Also persists the user's email when provided.
     * @param {string} userId
     * @param {object} data — preference fields from the request body
     * @param {string|null} userEmail — email decoded from the caller's JWT
     */
    async updatePreferences(userId, data, userEmail = null) {
        const updateData = { ...data, userId };
        if (userEmail) {
            updateData.userEmail = userEmail;
        }
        const prefs = await this.Preference.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, upsert: true, runValidators: true }
        ).lean();
        return prefs;
    }
}

module.exports = NotificationService;
