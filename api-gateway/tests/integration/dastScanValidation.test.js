const request = require('supertest');
const { createApp } = require('../../src/server');

describe('OWASP ZAP DAST Baseline Audit Verification Suite', () => {
    let app;

    beforeAll(() => {
        app = createApp();
    });

    describe('OWASP ZAP Rule 10020: Anti-CSRF / Anti-Clickjacking Header Missing', () => {
        it('enforces X-Frame-Options: DENY on standard endpoints (HTTP 200)', async () => {
            const res = await request(app).get('/health').expect(200);
            expect(res.headers['x-frame-options']).toBe('DENY');
        });

        it('enforces X-Frame-Options: DENY on 404 fallback endpoints', async () => {
            const res = await request(app).get('/unmapped-dast-endpoint').expect(404);
            expect(res.headers['x-frame-options']).toBe('DENY');
        });

        it('enforces frame-src none restriction in Content-Security-Policy', async () => {
            const res = await request(app).get('/health').expect(200);
            const csp = res.headers['content-security-policy'];
            expect(csp).toContain("frame-src 'none'");
        });
    });

    describe('OWASP ZAP Rule 10021: X-Content-Type-Options Header Missing', () => {
        it('enforces X-Content-Type-Options: nosniff on JSON health endpoint', async () => {
            const res = await request(app).get('/health').expect(200);
            expect(res.headers['x-content-type-options']).toBe('nosniff');
        });

        it('enforces X-Content-Type-Options: nosniff on error routes', async () => {
            const res = await request(app).get('/invalid-route-for-dast').expect(404);
            expect(res.headers['x-content-type-options']).toBe('nosniff');
        });
    });

    describe('OWASP ZAP Rule 10038: Content Security Policy (CSP) Header Not Set', () => {
        it('sets a non-empty, comprehensive Content-Security-Policy header', async () => {
            const res = await request(app).get('/health').expect(200);
            const csp = res.headers['content-security-policy'];

            expect(csp).toBeDefined();
            expect(csp.length).toBeGreaterThan(0);
            expect(csp).toContain("default-src 'self'");
            expect(csp).toContain("script-src 'self'");
            expect(csp).toContain("object-src 'none'");
            expect(csp).toContain('base-uri');
        });

        it('maintains strict CSP across unauthorized routes and errors', async () => {
            const res = await request(app).get('/dast-security-test-endpoint').expect(404);
            expect(res.headers['content-security-policy']).toBeDefined();
            expect(res.headers['content-security-policy']).toContain('default-src');
        });
    });

    describe('OWASP ZAP Rule 10049: Stale or Permissive CORS Headers', () => {
        it('strictly denies reflecting untrusted origins in Access-Control-Allow-Origin', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'http://malicious-cross-origin.com')
                .expect(200);

            expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });

        it('never reflects wildcard * combined with credentials', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:5173')
                .expect(200);

            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
            expect(res.headers['access-control-allow-origin']).not.toBe('*');
            expect(res.headers['access-control-allow-credentials']).toBe('true');
        });

        it('intercepts preflight OPTIONS requests with status 204 without downstream dispatch', async () => {
            const res = await request(app)
                .options('/health')
                .set('Origin', 'http://localhost:5173')
                .set('Access-Control-Request-Method', 'POST')
                .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
                .expect(204);

            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
            expect(res.headers['access-control-allow-methods']).toContain('POST');
            expect(res.headers['access-control-allow-headers']).toContain('Authorization');
            expect(res.headers['access-control-max-age']).toBe('86400');
        });

        it('handles direct curl / server-to-server requests safely without origin reflection', async () => {
            const res = await request(app).get('/health').expect(200);
            expect(res.headers['access-control-allow-origin']).toBeUndefined();
            expect(res.body.status).toBe('OK');
        });
    });

    describe('System Profiling & Response Header Hardening', () => {
        it('suppresses X-Powered-By runtime identifier across all responses', async () => {
            const okRes = await request(app).get('/health');
            expect(okRes.headers['x-powered-by']).toBeUndefined();

            const notFoundRes = await request(app).get('/nonexistent');
            expect(notFoundRes.headers['x-powered-by']).toBeUndefined();

            const preflightRes = await request(app)
                .options('/health')
                .set('Origin', 'http://localhost:5173');
            expect(preflightRes.headers['x-powered-by']).toBeUndefined();
        });
    });
});
