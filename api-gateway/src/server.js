const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimiter } = require('./middleware/rateLimiter');
const { logger } = require('./middleware/logger');
const { getSecurityHeadersMiddleware } = require('./config/securityHeaders');
const { getCorsOptions } = require('./config/corsConfig');
const { config } = require('./config/env');
const { getProxyOptions } = require('./config/proxyConfig');

const PORT = config.port;

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

    app.use('/api', createProxyMiddleware(getProxyOptions()));

    // 404 Catch-All Handler (ensures full security headers are retained on unmapped endpoints)
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Resource not found',
        });
    });

    return app;
}

const configuredApp = createApp();

if (require.main === module) {
    configuredApp.listen(PORT, () => {
        console.log(`API Gateway running on port ${PORT}`);
    });
}

module.exports = { app: configuredApp, createApp };
