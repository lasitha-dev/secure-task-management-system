const { body, query, param } = require('express-validator');
const { NOTIFICATION_TYPE_VALUES, NOTIFICATION_PRIORITY_VALUES, PAGINATION, RESPONSE_MESSAGES } = require('../utils/constants');

/**
 * Validation result handler middleware.
 * Checks for express-validator errors and returns 400 if any exist.
 */
const handleValidationErrors = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: RESPONSE_MESSAGES.VALIDATION_ERROR,
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

/**
 * Validate POST /api/notifications body.
 */
const validateCreateNotification = [
    body('type')
        .notEmpty().withMessage('Type is required')
        .isIn(NOTIFICATION_TYPE_VALUES).withMessage(`Type must be one of: ${NOTIFICATION_TYPE_VALUES.join(', ')}`),
    body('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('message')
        .notEmpty().withMessage('Message is required')
        .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
    body('recipientId')
        .notEmpty().withMessage('Recipient ID is required'),
    body('priority')
        .optional()
        .isIn(NOTIFICATION_PRIORITY_VALUES).withMessage(`Priority must be one of: ${NOTIFICATION_PRIORITY_VALUES.join(', ')}`),
    handleValidationErrors,
];

/**
 * Validate GET /api/notifications query pagination params.
 * Rejects out-of-range values at the edge (A04 resource-exhaustion hardening);
 * the service layer also clamps defensively in case this is bypassed.
 */
const validateGetNotifications = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: PAGINATION.MAX_LIMIT }).withMessage(`Limit must be an integer between 1 and ${PAGINATION.MAX_LIMIT}`),
    handleValidationErrors,
];

/**
 * Validate PUT /api/notifications/preferences/:userId body.
 */
const validateUpdatePreferences = [
    param('userId')
        .notEmpty().withMessage('User ID is required'),
    body('emailEnabled')
        .optional()
        .isBoolean().withMessage('emailEnabled must be a boolean'),
    body('inAppEnabled')
        .optional()
        .isBoolean().withMessage('inAppEnabled must be a boolean'),
    handleValidationErrors,
];

/**
 * Validate that the :id param is a valid Mongo ObjectId.
 */
const validateObjectId = [
    param('id')
        .isMongoId().withMessage('Invalid notification ID format'),
    handleValidationErrors,
];

/**
 * Validate PATCH /api/notifications/read-all body.
 */
const validateMarkAllRead = [
    body('recipientId')
        .notEmpty().withMessage('Recipient ID is required'),
    handleValidationErrors,
];

module.exports = {
    validateCreateNotification,
    validateGetNotifications,
    validateUpdatePreferences,
    validateObjectId,
    validateMarkAllRead,
    handleValidationErrors,
};
