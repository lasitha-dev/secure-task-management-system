/**
 * Basic rate limiter middleware.
 * Limits requests per IP to prevent abuse.
 */
const requestCounts = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

const rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, startTime: now });
        return next();
    }

    const record = requestCounts.get(ip);

    if (now - record.startTime > WINDOW_MS) {
        requestCounts.set(ip, { count: 1, startTime: now });
        return next();
    }

    if (record.count >= MAX_REQUESTS) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
        });
    }

    record.count += 1;
    next();
};

module.exports = { rateLimiter };
