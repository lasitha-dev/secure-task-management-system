const mongoose = require('mongoose');
const { NOTIFICATION_TYPE_VALUES } = require('../utils/constants');

/**
 * Per-type preference sub-schema.
 * Controls whether a specific notification type is enabled and via which channels.
 */
const typePreferenceSchema = new mongoose.Schema(
    {
        enabled: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
    },
    { _id: false }
);

/**
 * Notification Preference Schema
 * Stores per-user notification delivery preferences.
 */
const notificationPreferenceSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: [true, 'User ID is required'],
            unique: true,
            index: true,
        },
        userEmail: {
            type: String,
            default: null,
        },
        emailEnabled: {
            type: Boolean,
            default: true,
        },
        inAppEnabled: {
            type: Boolean,
            default: true,
        },
        preferences: {
            type: Map,
            of: typePreferenceSchema,
            default: () => {
                const defaults = new Map();
                NOTIFICATION_TYPE_VALUES.forEach((type) => {
                    defaults.set(type, { enabled: true, email: true, inApp: true });
                });
                return defaults;
            },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
