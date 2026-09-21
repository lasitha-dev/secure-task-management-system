const proxyConfig = require('../../src/config/proxyConfig');

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
});