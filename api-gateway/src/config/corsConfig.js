/**
 * Modular CORS configuration module (OWASP A05:2021).
 * Enforces dynamic origin whitelisting, credentials security, and preflight optimization.
 */

const { config, DEFAULT_ORIGINS } = require('./env');

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
const ALLOWED_HEADERS = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
];
const EXPOSED_HEADERS = ['Content-Range', 'X-Content-Range'];

function getAllowedOrigins(customOrigins) {
    if (Array.isArray(customOrigins) && customOrigins.length > 0) {
        return customOrigins;
    }
    return config.cors.allowedOrigins || DEFAULT_ORIGINS;
}

function createOriginValidator(allowedOrigins) {
    const whitelist = getAllowedOrigins(allowedOrigins);

    return function validateOrigin(origin, callback) {
        // Direct / non-browser requests (e.g. curl, internal microservice health checks)
        if (!origin) {
            return callback(null, true);
        }

        // Whitelisted origin match
        if (whitelist.includes(origin)) {
            return callback(null, true);
        }

        // Untrusted origin: reject reflection without crashing (no Access-Control-Allow-Origin emitted)
        return callback(null, false);
    };
}

function getCorsOptions(customOrigins) {
    const allowedOrigins = getAllowedOrigins(customOrigins);

    return {
        origin: createOriginValidator(allowedOrigins),
        credentials: true,
        methods: ALLOWED_METHODS,
        allowedHeaders: ALLOWED_HEADERS,
        exposedHeaders: EXPOSED_HEADERS,
        optionsSuccessStatus: 204,
        maxAge: 86400, // Cache preflight for 24 hours
    };
}

module.exports = {
    getAllowedOrigins,
    createOriginValidator,
    getCorsOptions,
    ALLOWED_METHODS,
    ALLOWED_HEADERS,
    EXPOSED_HEADERS,
    DEFAULT_CORS_OPTIONS: getCorsOptions(),
};
