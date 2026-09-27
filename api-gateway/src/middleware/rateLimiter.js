/**
 * Hardened rate limiter middleware (OWASP A04:2021).
 * Limits requests per client IP to prevent brute-force and resource exhaustion.
 */
const { config } = require('../config/env');

function createRateLimiter(options = {}) {
    const windowMs =
        options.windowMs ||
        (config && config.rateLimit ? config.rateLimit.windowMs : 15 * 60 * 1000);
    const maxRequests =
        options.maxRequests ||
        (config && config.rateLimit ? config.rateLimit.maxRequests : 100);
    const requestCounts = new Map();

    return function rateLimiterMiddleware(req, res, next) {
        const ip = req.ip || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
        const now = Date.now();

        if (!requestCounts.has(ip)) {
            requestCounts.set(ip, { count: 1, startTime: now });
        } else {
            const record = requestCounts.get(ip);
            if (now - record.startTime > windowMs) {
                record.count = 1;
                record.startTime = now;
            } else {
                record.count += 1;
            }
        }

        const record = requestCounts.get(ip);
        const remaining = Math.max(0, maxRequests - record.count);
        const resetSeconds = Math.max(1, Math.ceil((record.startTime + windowMs - now) / 1000));

        if (typeof res.setHeader === 'function') {
            res.setHeader('RateLimit-Limit', maxRequests);
            res.setHeader('RateLimit-Remaining', remaining);
            res.setHeader('RateLimit-Reset', resetSeconds);
        }

        if (record.count > maxRequests) {
            if (typeof res.setHeader === 'function') {
                res.setHeader('Retry-After', resetSeconds);
            }
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
            });
        }

        next();
    };
}

const rateLimiter = createRateLimiter();

module.exports = {
    createRateLimiter,
    rateLimiter,
};
