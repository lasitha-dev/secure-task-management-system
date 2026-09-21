const express = require('express');
const router = express.Router();
const { protect, protectInternalService } = require('../middleware/auth');

// --- Dependency Wiring (Dependency Inversion) --------------------------------
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationService = require('../services/notificationService');
const NotificationController = require('../controllers/notificationController');

const service = new NotificationService(Notification, NotificationPreference);
const controller = new NotificationController(service);

// --- Validation Middleware ---------------------------------------------------
const {
    validateCreateNotification,
    validateObjectId,
    validateMarkAllRead,
    validateUpdatePreferences,
} = require('../middleware/validators');

// --- Notification Routes -----------------------------------------------------

// POST   /api/notifications/internal      — Internal-only notification creation
router.post('/internal', protectInternalService, validateCreateNotification, controller.createNotification);

router.use(protect);

// GET    /api/notifications              — List all (with filters & pagination)
router.get('/', controller.getNotifications);

// GET    /api/notifications/unread-count  — Get unread count for a recipient
router.get('/unread-count', controller.getUnreadCount);

// PATCH  /api/notifications/read-all      — Mark all as read for a recipient
router.patch('/read-all', validateMarkAllRead, controller.markAllAsRead);

// GET    /api/notifications/preferences/:userId  — Get user preferences
router.get('/preferences/:userId', controller.getPreferences);

// PUT    /api/notifications/preferences/:userId  — Update user preferences
router.put('/preferences/:userId', validateUpdatePreferences, controller.updatePreferences);

// GET    /api/notifications/:id           — Get single notification
router.get('/:id', validateObjectId, controller.getNotificationById);

// PATCH  /api/notifications/:id/read      — Mark single as read
router.patch('/:id/read', validateObjectId, controller.markAsRead);

// DELETE /api/notifications/:id           — Delete a notification
router.delete('/:id', validateObjectId, controller.deleteNotification);

module.exports = router;
