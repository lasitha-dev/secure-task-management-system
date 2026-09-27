const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../../src/middleware/authMiddleware');

describe('authMiddleware', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJwtSecret = process.env.JWT_SECRET;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.JWT_SECRET = originalJwtSecret;
    });

    function callMiddleware(authorizationHeader) {
        const req = {
            path: '/api/reports',
            headers: authorizationHeader ? { authorization: authorizationHeader } : {},
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();
        authMiddleware(req, res, next);
        return { req, res, next };
    }

    it('verifies a valid JWT and attaches req.user when JWT_SECRET is explicitly configured', () => {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'a-test-only-secret';
        const token = jwt.sign(
            { id: 'user-1', name: 'Test User', role: 'user' },
            process.env.JWT_SECRET
        );

        const { req, res, next } = callMiddleware(`Bearer ${token}`);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(req.user.userId).toBe('user-1');
    });

    it('fails closed with a 500 configuration error when JWT_SECRET is missing, without verifying the token', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.JWT_SECRET;
        const token = jwt.sign({ id: 'user-1' }, 'some-arbitrary-signing-value');

        const { res, next } = callMiddleware(`Bearer ${token}`);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false })
        );
    });

    it('does not expose secret/config details in the fail-closed response', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.JWT_SECRET;
        const token = jwt.sign({ id: 'user-1' }, 'some-arbitrary-signing-value');

        const { res } = callMiddleware(`Bearer ${token}`);

        const [[responseBody]] = res.json.mock.calls;
        expect(JSON.stringify(responseBody)).not.toMatch(/secret/i);
    });
});
