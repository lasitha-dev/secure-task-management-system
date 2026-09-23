const proxyConfig = require('../../src/config/proxyConfig');
const { config } = require('../../src/config/env');

describe('proxyConfig', () => {
    it('defines the expected microservice routes', () => {
        expect(proxyConfig.routes).toEqual([
            expect.objectContaining({ path: '/api/users', target: expect.any(String) }),
            expect.objectContaining({ path: '/api/tasks', target: expect.any(String) }),
            expect.objectContaining({ path: '/api/boards', target: expect.any(String) }),
            expect.objectContaining({ path: '/api/notifications', target: expect.any(String) }),
            expect.objectContaining({ path: '/api/reports', target: expect.any(String) }),
            expect.objectContaining({ path: '/api/analytics', target: expect.any(String) }),
            expect.objectContaining({ path: '/api/sync', target: expect.any(String) }),
        ]);
    });

    it('provides path rewrite rules for each route', () => {
        proxyConfig.routes.forEach((route) => {
            expect(route.pathRewrite).toEqual(expect.any(Object));
            expect(Object.keys(route.pathRewrite)).toContain('^/');
        });
    });

    describe('resolveTarget', () => {
        it('resolves user service for /users routes', () => {
            expect(proxyConfig.resolveTarget({ url: '/users/profile' })).toBe(
                config.services.userServiceUrl
            );
            expect(proxyConfig.resolveTarget({ url: '/users/auth/google' })).toBe(
                config.services.userServiceUrl
            );
        });

        it('resolves task service for /tasks and /boards routes', () => {
            expect(proxyConfig.resolveTarget({ url: '/tasks' })).toBe(
                config.services.taskServiceUrl
            );
            expect(proxyConfig.resolveTarget({ url: '/boards/123' })).toBe(
                config.services.taskServiceUrl
            );
        });

        it('resolves notification service for /notifications routes', () => {
            expect(proxyConfig.resolveTarget({ url: '/notifications' })).toBe(
                config.services.notificationServiceUrl
            );
        });

        it('resolves reporting service for /reports, /analytics, and /sync routes', () => {
            expect(proxyConfig.resolveTarget({ url: '/reports/summary' })).toBe(
                config.services.reportingServiceUrl
            );
            expect(proxyConfig.resolveTarget({ url: '/analytics/usage' })).toBe(
                config.services.reportingServiceUrl
            );
            expect(proxyConfig.resolveTarget({ url: '/sync' })).toBe(
                config.services.reportingServiceUrl
            );
        });

        it('falls back to task service for unrecognized or empty requests', () => {
            expect(proxyConfig.resolveTarget({ url: '/unknown' })).toBe(
                config.services.taskServiceUrl
            );
            expect(proxyConfig.resolveTarget(null)).toBe(config.services.taskServiceUrl);
        });
    });
});