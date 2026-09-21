const { logger } = require('../../src/middleware/logger');

describe('logger middleware', () => {
    it('logs the request method and URL then calls next', () => {
        const req = { method: 'GET', originalUrl: '/api/notifications' };
        const res = {};
        const next = jest.fn();
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        logger(req, res, next);

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/notifications'));
        expect(next).toHaveBeenCalledTimes(1);

        logSpy.mockRestore();
    });
});