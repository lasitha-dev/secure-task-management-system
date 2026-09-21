const { rateLimiter } = require('../../src/middleware/rateLimiter');

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

        nowSpy.mockReturnValueOnce((15 * 60 * 1000) + 1);
        rateLimiter(req, res, next);

        expect(next).toHaveBeenCalledTimes(2);
        expect(res.status).not.toHaveBeenCalled();
    });
});