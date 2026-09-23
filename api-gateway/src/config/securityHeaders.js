/**
 * Modular security headers configuration (OWASP A05:2021).
 * Configures Helmet defensive headers and permissions policy.
 */

const helmet = require('helmet');
const { config, DEFAULT_ORIGINS } = require('./env');

function getSecurityHeadersOptions(allowedOrigins = config.cors.allowedOrigins) {
    const origins = Array.isArray(allowedOrigins) && allowedOrigins.length > 0
        ? allowedOrigins
        : DEFAULT_ORIGINS;

    return {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", ...origins, 'https://accounts.google.com'],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'", 'https://accounts.google.com'],
                upgradeInsecureRequests: [],
            },
        },
        frameguard: {
            action: 'deny',
        },
        noSniff: true,
        strictTransportSecurity: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin',
        },
        hidePoweredBy: true,
    };
}

function getSecurityHeadersMiddleware(allowedOrigins) {
    const options = getSecurityHeadersOptions(allowedOrigins);
    const helmetMiddleware = helmet(options);

    return (req, res, next) => {
        helmetMiddleware(req, res, (err) => {
            if (err) {
                return next(err);
            }
            res.setHeader(
                'Permissions-Policy',
                'camera=(), microphone=(), geolocation=(), payment=()'
            );
            next();
        });
    };
}

module.exports = {
    getSecurityHeadersOptions,
    getSecurityHeadersMiddleware,
    DEFAULT_SECURITY_HEADERS_OPTIONS: getSecurityHeadersOptions(),
};
