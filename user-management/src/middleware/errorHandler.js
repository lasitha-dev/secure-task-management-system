const logger = require('../config/logger');

/**
 * Global Error Handler Middleware
 * Ensures stack traces are never exposed to the client.
 */
const errorHandler = (err, req, res, _next) => {
    logger.error(err.message, {
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        statusCode: err.statusCode || 500,
    });

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = { errorHandler };
