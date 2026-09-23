const {
    getSecurityHeadersOptions,
    getSecurityHeadersMiddleware,
    DEFAULT_SECURITY_HEADERS_OPTIONS,
} = require('../../src/config/securityHeaders');

describe('securityHeaders configuration and middleware', () => {
    it('provides standard defensive options by default', () => {
        const options = DEFAULT_SECURITY_HEADERS_OPTIONS;

        expect(options.frameguard).toEqual({ action: 'deny' });
        expect(options.noSniff).toBe(true);
        expect(options.strictTransportSecurity).toEqual({
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        });
        expect(options.referrerPolicy).toEqual({
            policy: 'strict-origin-when-cross-origin',
        });
        expect(options.hidePoweredBy).toBe(true);

        const { directives } = options.contentSecurityPolicy;
        expect(directives.defaultSrc).toEqual(["'self'"]);
        expect(directives.scriptSrc).toEqual(["'self'"]);
        expect(directives.frameSrc).toEqual(["'none'"]);
        expect(directives.objectSrc).toEqual(["'none'"]);
        expect(directives.baseUri).toEqual(["'self'"]);
        expect(directives.formAction).toContain('https://accounts.google.com');
    });

    it('injects custom allowed origins into CSP connectSrc', () => {
        const customOrigins = ['https://frontend.production.com'];
        const options = getSecurityHeadersOptions(customOrigins);

        expect(options.contentSecurityPolicy.directives.connectSrc).toEqual([
            "'self'",
            'https://frontend.production.com',
            'https://accounts.google.com',
        ]);
    });

    it('middleware sets defensive headers and Permissions-Policy on response', (done) => {
        const middleware = getSecurityHeadersMiddleware(['http://localhost:5173']);
        const headers = {};

        const req = {
            headers: {},
        };

        const res = {
            setHeader: jest.fn((name, value) => {
                headers[name.toLowerCase()] = value;
            }),
            getHeader: jest.fn((name) => headers[name.toLowerCase()]),
            removeHeader: jest.fn((name) => {
                delete headers[name.toLowerCase()];
            }),
        };

        middleware(req, res, (err) => {
            expect(err).toBeUndefined();
            expect(headers['x-frame-options']).toBe('DENY');
            expect(headers['x-content-type-options']).toBe('nosniff');
            expect(headers['strict-transport-security']).toContain('max-age=31536000');
            expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
            expect(headers['content-security-policy']).toBeDefined();
            expect(headers['permissions-policy']).toBe(
                'camera=(), microphone=(), geolocation=(), payment=()'
            );
            done();
        });
    });

    it('falls back to DEFAULT_ORIGINS when custom allowedOrigins is null or empty', () => {
        const optionsNull = getSecurityHeadersOptions(null);
        expect(optionsNull.contentSecurityPolicy.directives.connectSrc).toEqual(
            expect.arrayContaining(["'self'"])
        );

        const optionsEmpty = getSecurityHeadersOptions([]);
        expect(optionsEmpty.contentSecurityPolicy.directives.connectSrc).toEqual(
            expect.arrayContaining(["'self'"])
        );
    });
});
