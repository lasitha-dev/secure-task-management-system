const mongoose = require('mongoose');
const { NOTIFICATION_TYPE_VALUES, NOTIFICATION_PRIORITY_VALUES } = require('../utils/constants');

/**
 * Notification Schema
 * Represents an in-app notification sent to a user.
 */
const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: NOTIFICATION_TYPE_VALUES,
            required: [true, 'Notification type is required'],
        },
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        recipientId: {
            type: String,
            required: [true, 'Recipient ID is required'],
            index: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        priority: {
            type: String,
            enum: NOTIFICATION_PRIORITY_VALUES,
            default: 'medium',
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for common queries: fetch unread notifications for a user
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
