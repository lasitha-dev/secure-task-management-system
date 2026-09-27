/**
 * Environment configuration module with fail-secure defaults.
 * Decouples process.env parsing from server and middleware modules.
 */

const DEFAULT_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
];

function parseOrigins(rawOrigin) {
    if (!rawOrigin || typeof rawOrigin !== 'string') {
        return [...DEFAULT_ORIGINS];
    }

    const origins = rawOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0 && origin !== '*');

    return origins.length > 0 ? origins : [...DEFAULT_ORIGINS];
}

function parsePositiveInt(val, fallback) {
    const parsed = parseInt(val, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getEnv(customEnv = process.env) {
    const rawOrigins = customEnv.CORS_ORIGIN || customEnv.FRONTEND_URL;

    return {
        port: parsePositiveInt(customEnv.PORT, 8000),
        nodeEnv: customEnv.NODE_ENV || 'development',
        cors: {
            allowedOrigins: parseOrigins(rawOrigins),
        },
        rateLimit: {
            windowMs: parsePositiveInt(customEnv.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
            maxRequests: parsePositiveInt(customEnv.RATE_LIMIT_MAX_REQUESTS, 100),
        },
        services: {
            userServiceUrl: customEnv.USER_SERVICE_URL || 'http://localhost:5001',
            taskServiceUrl: customEnv.TASK_SERVICE_URL || 'http://localhost:5002',
            notificationServiceUrl: customEnv.NOTIFICATION_SERVICE_URL || 'http://localhost:5003',
            reportingServiceUrl: customEnv.REPORTING_SERVICE_URL || customEnv.REPORT_SERVICE_URL || 'http://localhost:5004',
        },
    };
}

module.exports = {
    getEnv,
    config: getEnv(),
    DEFAULT_ORIGINS,
};
