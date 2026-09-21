const rateLimit = require('express-rate-limit');

/**
 * Rate limiter: 100 requests per 15 minutes per IP
 */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for health check
        return req.path === '/health';
    }
});

module.exports = limiter;
