const { getEnv, DEFAULT_ORIGINS } = require('../../src/config/env');

describe('env configuration module', () => {
    it('returns fail-secure defaults when environment variables are omitted', () => {
        const config = getEnv({});

        expect(config.port).toBe(8000);
        expect(config.nodeEnv).toBe('development');
        expect(config.cors.allowedOrigins).toEqual(DEFAULT_ORIGINS);
        expect(config.rateLimit.windowMs).toBe(15 * 60 * 1000);
        expect(config.rateLimit.maxRequests).toBe(100);
        expect(config.services.userServiceUrl).toBe('http://localhost:5001');
        expect(config.services.taskServiceUrl).toBe('http://localhost:5002');
        expect(config.services.notificationServiceUrl).toBe('http://localhost:5003');
        expect(config.services.reportingServiceUrl).toBe('http://localhost:5004');
    });

    it('parses valid custom configurations', () => {
        const customEnv = {
            PORT: '9000',
            NODE_ENV: 'production',
            CORS_ORIGIN: 'https://app.taskmaster.com, https://admin.taskmaster.com',
            RATE_LIMIT_WINDOW_MS: '60000',
            RATE_LIMIT_MAX_REQUESTS: '50',
            USER_SERVICE_URL: 'http://custom-user:5001',
            TASK_SERVICE_URL: 'http://custom-task:5002',
            NOTIFICATION_SERVICE_URL: 'http://custom-notify:5003',
            REPORTING_SERVICE_URL: 'http://custom-report:5004',
        };

        const config = getEnv(customEnv);

        expect(config.port).toBe(9000);
        expect(config.nodeEnv).toBe('production');
        expect(config.cors.allowedOrigins).toEqual([
            'https://app.taskmaster.com',
            'https://admin.taskmaster.com',
        ]);
        expect(config.rateLimit.windowMs).toBe(60000);
        expect(config.rateLimit.maxRequests).toBe(50);
        expect(config.services.userServiceUrl).toBe('http://custom-user:5001');
        expect(config.services.taskServiceUrl).toBe('http://custom-task:5002');
        expect(config.services.notificationServiceUrl).toBe('http://custom-notify:5003');
        expect(config.services.reportingServiceUrl).toBe('http://custom-report:5004');
    });

    it('supports FRONTEND_URL when CORS_ORIGIN is absent', () => {
        const config = getEnv({ FRONTEND_URL: 'http://localhost:5173' });

        expect(config.cors.allowedOrigins).toEqual(['http://localhost:5173']);
    });

    it('disallows wildcard * from overriding whitelist in fail-secure mode', () => {
        const config = getEnv({ CORS_ORIGIN: '*' });

        expect(config.cors.allowedOrigins).toEqual(DEFAULT_ORIGINS);
    });

    it('falls back to default integers when invalid numbers are supplied', () => {
        const config = getEnv({
            PORT: 'invalid-port',
            RATE_LIMIT_WINDOW_MS: '-500',
            RATE_LIMIT_MAX_REQUESTS: 'not-a-number',
        });

        expect(config.port).toBe(8000);
        expect(config.rateLimit.windowMs).toBe(15 * 60 * 1000);
        expect(config.rateLimit.maxRequests).toBe(100);
    });
});
