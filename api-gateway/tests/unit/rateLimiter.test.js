const { rateLimiter, createRateLimiter } = require('../../src/middleware/rateLimiter');

describe('rateLimiter middleware', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('allows requests below the threshold', () => {
        const req = { ip: '127.0.0.10' };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        rateLimiter(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 429 after the maximum number of requests', () => {
        const req = { ip: '127.0.0.11' };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        for (let index = 0; index < 100; index += 1) {
            rateLimiter(req, res, next);
        }

        rateLimiter(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Too many requests. Please try again later.',
        });
    });

    it('resets the window after fifteen minutes', () => {
        const nowSpy = jest.spyOn(Date, 'now');
        const req = { ip: '127.0.0.12' };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        nowSpy.mockReturnValueOnce(0);
        rateLimiter(req, res, next);

        nowSpy.mockReturnValueOnce(15 * 60 * 1000 + 1);
        rateLimiter(req, res, next);

        expect(next).toHaveBeenCalledTimes(2);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('emits standard RateLimit headers when setHeader is available', () => {
        const req = { ip: '127.0.0.13' };
        const headers = {};
        const res = {
            setHeader: jest.fn((key, val) => {
                headers[key] = val;
            }),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const next = jest.fn();

        rateLimiter(req, res, next);

        expect(headers['RateLimit-Limit']).toBe(100);
        expect(headers['RateLimit-Remaining']).toBe(99);
        expect(headers['RateLimit-Reset']).toBeDefined();
        expect(next).toHaveBeenCalled();
    });

    it('emits Retry-After header upon throttling with custom factory limiter', () => {
        const customLimiter = createRateLimiter({ windowMs: 5000, maxRequests: 2 });
        const req = { ip: '127.0.0.14' };
        const headers = {};
        const res = {
            setHeader: jest.fn((key, val) => {
                headers[key] = val;
            }),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const next = jest.fn();

        customLimiter(req, res, next); // 1
        customLimiter(req, res, next); // 2
        customLimiter(req, res, next); // 3 -> throttled

        expect(res.status).toHaveBeenCalledWith(429);
        expect(headers['Retry-After']).toBeDefined();
        expect(headers['RateLimit-Remaining']).toBe(0);
    });

    it('falls back to req.connection.remoteAddress when req.ip is missing', () => {
        const req = { connection: { remoteAddress: '192.168.1.50' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        rateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('falls back to 127.0.0.1 when both req.ip and req.connection are missing', () => {
        const req = {};
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        rateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });
});