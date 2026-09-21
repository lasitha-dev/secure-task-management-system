const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimiter } = require('./middleware/rateLimiter');
const { logger } = require('./middleware/logger');

require('dotenv').config();

const PORT = process.env.PORT || 8000;

function resolveTarget(req) {
    if (req.url.startsWith('/users')) {
        return process.env.USER_SERVICE_URL || 'http://localhost:5001';
    }
    if (req.url.startsWith('/tasks') || req.url.startsWith('/boards')) {
        return process.env.TASK_SERVICE_URL || 'http://localhost:5002';
    }
    if (req.url.startsWith('/notifications')) {
        return process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5003';
    }
    if (req.url.startsWith('/reports') || req.url.startsWith('/analytics') || req.url.startsWith('/sync')) {
        return process.env.REPORTING_SERVICE_URL || 'http://localhost:5004';
    }
    return process.env.TASK_SERVICE_URL || 'http://localhost:5002';
}

function createApp() {
    const app = express();

    const corsOptions = {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
        credentials: true,
    };
    app.use(cors(corsOptions));
    app.use(logger);
    app.use(rateLimiter);

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', service: 'api-gateway' });
    });

    app.use('/api', createProxyMiddleware({
        target: process.env.TASK_SERVICE_URL || 'http://localhost:5002',
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
