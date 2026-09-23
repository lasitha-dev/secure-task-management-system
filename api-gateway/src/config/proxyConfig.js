/**
 * Proxy configuration and routing table.
 * Maps incoming API paths to their target microservice URLs.
 */
const { config } = require('./env');

const proxyConfig = {
    routes: [
        {
            path: '/api/users',
            target: config.services.userServiceUrl,
            pathRewrite: { '^/': '/api/users/' },
        },
        {
            path: '/api/tasks',
            target: config.services.taskServiceUrl,
            pathRewrite: { '^/': '/api/tasks/' },
        },
        {
            path: '/api/boards',
            target: config.services.taskServiceUrl,
            pathRewrite: { '^/': '/api/boards/' },
        },
        {
            path: '/api/notifications',
            target: config.services.notificationServiceUrl,
            pathRewrite: { '^/': '/api/notifications/' },
        },
        {
            path: '/api/reports',
            target: config.services.reportingServiceUrl,
            pathRewrite: { '^/': '/api/reports/' },
        },
        {
            path: '/api/analytics',
            target: config.services.reportingServiceUrl,
            pathRewrite: { '^/': '/api/analytics/' },
        },
        {
            path: '/api/sync',
            target: config.services.reportingServiceUrl,
            pathRewrite: { '^/': '/api/sync/' },
        },
    ],
    resolveTarget(req) {
        if (!req || !req.url) {
            return config.services.taskServiceUrl;
        }
        if (req.url.startsWith('/users')) {
            return config.services.userServiceUrl;
        }
        if (req.url.startsWith('/tasks') || req.url.startsWith('/boards')) {
            return config.services.taskServiceUrl;
        }
        if (req.url.startsWith('/notifications')) {
            return config.services.notificationServiceUrl;
        }
        if (
            req.url.startsWith('/reports') ||
            req.url.startsWith('/analytics') ||
            req.url.startsWith('/sync')
        ) {
            return config.services.reportingServiceUrl;
        }
        return config.services.taskServiceUrl;
    },
};

module.exports = proxyConfig;
