const {
    getAllowedOrigins,
    createOriginValidator,
    getCorsOptions,
    ALLOWED_METHODS,
    ALLOWED_HEADERS,
    EXPOSED_HEADERS,
    DEFAULT_CORS_OPTIONS,
} = require('../../src/config/corsConfig');
const { DEFAULT_ORIGINS } = require('../../src/config/env');

describe('corsConfig module', () => {
    describe('getAllowedOrigins', () => {
        it('returns default origins when no custom origins are provided', () => {
            expect(getAllowedOrigins()).toEqual(DEFAULT_ORIGINS);
        });

        it('returns custom origins when an array is provided', () => {
            const custom = ['https://trusted.domain.com'];
            expect(getAllowedOrigins(custom)).toEqual(custom);
        });
    });

    describe('createOriginValidator', () => {
        const validator = createOriginValidator(['http://localhost:5173', 'http://127.0.0.1:5173']);

        it('allows direct / non-browser requests where origin is undefined', (done) => {
            validator(undefined, (err, allow) => {
                expect(err).toBeNull();
                expect(allow).toBe(true);
                done();
            });
        });

        it('allows requests with whitelisted origins', (done) => {
            validator('http://localhost:5173', (err, allow) => {
                expect(err).toBeNull();
                expect(allow).toBe(true);
                done();
            });
        });

        it('rejects requests from unauthorized origins with callback(null, false)', (done) => {
            validator('http://malicious-site.com', (err, allow) => {
                expect(err).toBeNull();
                expect(allow).toBe(false);
                done();
            });
        });
    });

    describe('getCorsOptions', () => {
        it('configures credentials and preflight parameters securely', () => {
            const options = DEFAULT_CORS_OPTIONS;

            expect(options.credentials).toBe(true);
            expect(options.optionsSuccessStatus).toBe(204);
            expect(options.maxAge).toBe(86400);
            expect(options.methods).toEqual(ALLOWED_METHODS);
            expect(options.allowedHeaders).toEqual(ALLOWED_HEADERS);
            expect(options.exposedHeaders).toEqual(EXPOSED_HEADERS);
            expect(typeof options.origin).toBe('function');
        });
    });
});
