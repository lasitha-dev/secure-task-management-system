const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimiter } = require('./middleware/rateLimiter');
const { logger } = require('./middleware/logger');
const { getSecurityHeadersMiddleware } = require('./config/securityHeaders');
const { getCorsOptions } = require('./config/corsConfig');
const { config } = require('./config/env');

const PORT = config.port;

function resolveTarget(req) {
    if (req.url.startsWith('/users')) {
        return config.services.userServiceUrl;
    }
    if (req.url.startsWith('/tasks') || req.url.startsWith('/boards')) {
        return config.services.taskServiceUrl;
    }
    if (req.url.startsWith('/notifications')) {
        return config.services.notificationServiceUrl;
    }
    if (req.url.startsWith('/reports') || req.url.startsWith('/analytics') || req.url.startsWith('/sync')) {
        return config.services.reportingServiceUrl;
    }
    return config.services.taskServiceUrl;
}

function createApp() {
    const app = express();

    // Configure trust proxy for Docker bridge network & reverse proxy client IP resolution
    app.set('trust proxy', 1);

    // =========================================================================
    // Stage 1: Response Header Manipulation (Helmet & System Profiling Defense)
    // =========================================================================
    app.disable('x-powered-by');
    app.use(getSecurityHeadersMiddleware());

    // =========================================================================
    // Stage 2: Origin Authorization & Preflight Handling (CORS Whitelist)
    // =========================================================================
    const corsOptions = getCorsOptions();
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    // =========================================================================
    // Stage 3: Traffic Shaping, Logging & Rate Limiting
    // =========================================================================
    app.use(logger);
    app.use(rateLimiter);

    // =========================================================================
    // Stage 4: Local Endpoints & Microservice Reverse Proxy Dispatchers
    // =========================================================================
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', service: 'api-gateway' });
    });

    app.use('/api', createProxyMiddleware({
        target: config.services.taskServiceUrl,
        changeOrigin: true,
        pathRewrite: (path) => '/api' + path,
        router: resolveTarget,
        onProxyReq: (_proxyReq, req) => {
            console.log(`[Gateway Proxy] ${req.method} /api${req.url} -> ${resolveTarget(req)}`);
        },
        onProxyRes: (proxyRes, req) => {
            console.log(`[Gateway Proxy] Response: ${proxyRes.statusCode} for ${req.method} /api${req.url}`);
        },
        logLevel: 'debug',
    }));

    return app;
}

const configuredApp = createApp();

if (require.main === module) {
    configuredApp.listen(PORT, () => {
        console.log(`API Gateway running on port ${PORT}`);
    });
}

module.exports = { app: configuredApp, createApp };
