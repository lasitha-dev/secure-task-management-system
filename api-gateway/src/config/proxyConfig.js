/**
 * Proxy configuration and routing table.
 * Maps incoming API paths to their target microservice URLs.
 */
const proxyConfig = {
    routes: [
        {
            path: '/api/users',
            target: process.env.USER_SERVICE_URL || 'http://localhost:5001',
            pathRewrite: { '^/': '/api/users/' },
        },
        {
            path: '/api/tasks',
            target: process.env.TASK_SERVICE_URL || 'http://localhost:5002',
            pathRewrite: { '^/': '/api/tasks/' },
        },
        {
            path: '/api/boards',
            target: process.env.TASK_SERVICE_URL || 'http://localhost:5002',
            pathRewrite: { '^/': '/api/boards/' },
        },
        {
            path: '/api/notifications',
            target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5003',
            pathRewrite: { '^/': '/api/notifications/' },
        },
        {
            path: '/api/reports',
            target: process.env.REPORT_SERVICE_URL || 'http://localhost:5004',
            pathRewrite: { '^/': '/api/reports/' },
        },
        {
            path: '/api/analytics',
            target: process.env.REPORT_SERVICE_URL || 'http://localhost:5004',
            pathRewrite: { '^/': '/api/analytics/' },
        },
        {
            path: '/api/sync',
            target: process.env.REPORT_SERVICE_URL || 'http://localhost:5004',
            pathRewrite: { '^/': '/api/sync/' },
        },
    ],
};

module.exports = proxyConfig;
