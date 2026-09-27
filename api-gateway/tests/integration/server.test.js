const request = require('supertest');
const { app } = require('../../src/server');

describe('API Gateway Server Integration Suite', () => {
    describe('1. Health Check Endpoint & Defensive Security Headers', () => {
        let response;

        beforeAll(async () => {
            response = await request(app).get('/health');
        });

        it('returns gateway health status with 200 OK', () => {
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: 'OK', service: 'api-gateway' });
        });

        it('strictly omits the X-Powered-By runtime identifier', () => {
            expect(response.headers['x-powered-by']).toBeUndefined();
        });

        it('enforces framing restriction policies via X-Frame-Options: DENY', () => {
            expect(response.headers['x-frame-options']).toBe('DENY');
        });

        it('enforces MIME-type protection via X-Content-Type-Options: nosniff', () => {
            expect(response.headers['x-content-type-options']).toBe('nosniff');
        });

        it('enforces Strict-Transport-Security (HSTS) with subdomains and preload', () => {
            const hsts = response.headers['strict-transport-security'];
            expect(hsts).toBeDefined();
            expect(hsts).toContain('max-age=31536000');
            expect(hsts).toContain('includeSubDomains');
            expect(hsts).toContain('preload');
        });

        it('enforces Content-Security-Policy (CSP) restricting resources', () => {
            const csp = response.headers['content-security-policy'];
            expect(csp).toBeDefined();
            expect(csp).toContain("default-src 'self'");
            expect(csp).toContain("frame-src 'none'");
            expect(csp).toContain("object-src 'none'");
        });

        it('enforces Referrer-Policy: strict-origin-when-cross-origin', () => {
            expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
        });

        it('enforces restrictive Permissions-Policy', () => {
            expect(response.headers['permissions-policy']).toBe(
                'camera=(), microphone=(), geolocation=(), payment=()'
            );
        });
    });

    describe('2. End-to-End CORS Integration Across Server Pipeline', () => {
        it('reflects authorized origin with credentials enabled', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:5173');

            expect(res.status).toBe(200);
            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
            expect(res.headers['access-control-allow-credentials']).toBe('true');
            expect(res.headers['access-control-allow-origin']).not.toBe('*');
        });

        it('does not reflect origin for unauthorized domain', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'http://unauthorized-attacker.com');

            expect(res.status).toBe(200);
            expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });

        it('intercepts OPTIONS preflight request with 204 and permissible methods/headers', async () => {
            const res = await request(app)
                .options('/health')
                .set('Origin', 'http://localhost:5173')
                .set('Access-Control-Request-Method', 'POST')
                .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

            expect(res.status).toBe(204);
            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
            expect(res.headers['access-control-allow-credentials']).toBe('true');
            expect(res.headers['access-control-allow-methods']).toContain('POST');
            expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
        });
    });

    describe('3. Rate Limiter Integration Across Pipeline', () => {
        it('emits standard rate-limiting headers on successful requests', async () => {
            const res = await request(app).get('/health');

            expect(res.status).toBe(200);
            expect(res.headers['ratelimit-limit']).toBeDefined();
            expect(res.headers['ratelimit-remaining']).toBeDefined();
            expect(res.headers['ratelimit-reset']).toBeDefined();
        });
    });

    describe('4. Routing & 404 Fallback Security', () => {
        it('preserves security headers and omits X-Powered-By on non-existent endpoints', async () => {
            const res = await request(app).get('/non-existent-route-for-testing');

            expect(res.status).toBe(404);
            expect(res.headers['x-powered-by']).toBeUndefined();
            expect(res.headers['x-frame-options']).toBe('DENY');
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['content-security-policy']).toBeDefined();
        });
    });
});