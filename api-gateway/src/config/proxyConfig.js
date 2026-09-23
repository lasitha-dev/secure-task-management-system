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
    getProxyOptions(overrides = {}) {
        return {
            target: config.services.taskServiceUrl,
            changeOrigin: true,
            autoRewrite: false,
            preserveHeaderKeyCase: true,
            xfwd: true,
            pathRewrite: (path) => '/api' + path,
            router: proxyConfig.resolveTarget,
            onProxyReq: (_proxyReq, req) => {
                if (process.env.NODE_ENV !== 'test') {
                    const target = proxyConfig.resolveTarget(req);
                    console.log(`[Gateway Proxy] ${req ? req.method : 'UNKNOWN'} /api${req ? req.url : ''} -> ${target}`);
                }
            },
            onProxyRes: (proxyRes, req) => {
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`[Gateway Proxy] Response: ${proxyRes ? proxyRes.statusCode : 'UNKNOWN'} for ${req ? req.method : 'UNKNOWN'} /api${req ? req.url : ''}`);
                }
            },
            logLevel: process.env.NODE_ENV === 'test' ? 'silent' : 'debug',
            ...overrides,
        };
    },
};

module.exports = proxyConfig;
