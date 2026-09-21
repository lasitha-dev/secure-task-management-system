const { errorHandler } = require('../../src/middleware/errorHandler');

describe('errorHandler middleware', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        jest.restoreAllMocks();
    });

    it('omits stack traces outside development', () => {
        process.env.NODE_ENV = 'production';
        const err = Object.assign(new Error('Boom'), { statusCode: 418 });
        const req = {};
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        errorHandler(err, req, res, jest.fn());

        expect(logSpy).toHaveBeenCalledWith('Error: Boom');
        expect(res.status).toHaveBeenCalledWith(418);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Boom',
        });
    });

    it('includes stack traces in development mode', () => {
        process.env.NODE_ENV = 'development';
        const err = Object.assign(new Error('Exploded'), { statusCode: 500 });
        const req = {};
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.spyOn(console, 'error').mockImplementation(() => {});

        errorHandler(err, req, res, jest.fn());

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'Exploded',
                stack: expect.any(String),
            })
        );
    });
});