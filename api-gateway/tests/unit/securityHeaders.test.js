const request = require('supertest');
const { app } = require('../../src/server');

describe('Security Headers Unit Test Suite (OWASP A05:2021 Remediation)', () => {
    describe('GET /health (representative 200 OK endpoint)', () => {
        let response;

        beforeAll(async () => {
            response = await request(app).get('/health');
        });

        it('explicitly omits the X-Powered-By header on all HTTP responses', () => {
            expect(response.headers['x-powered-by']).toBeUndefined();
        });

        it('enforces framing restriction policies via X-Frame-Options: DENY', () => {
            expect(response.headers['x-frame-options']).toBe('DENY');
        });

        it('mitigates MIME sniffing via X-Content-Type-Options: nosniff', () => {
            expect(response.headers['x-content-type-options']).toBe('nosniff');
        });

        it('sets a non-empty, restrictive Content-Security-Policy header', () => {
            const csp = response.headers['content-security-policy'];
            expect(csp).toBeDefined();
            expect(csp.length).toBeGreaterThan(0);
            expect(csp).toContain("default-src 'self'");
            expect(csp).toContain("frame-src 'none'");
            expect(csp).toContain("object-src 'none'");
        });

        it('enforces Strict-Transport-Security with a valid duration and subdomains', () => {
            const hsts = response.headers['strict-transport-security'];
            expect(hsts).toBeDefined();
            expect(hsts).toContain('includeSubDomains');
            expect(hsts).toContain('preload');

            const match = hsts.match(/max-age=(\d+)/);
            expect(match).not.toBeNull();
            const maxAge = parseInt(match[1], 10);
            expect(maxAge).toBeGreaterThanOrEqual(31536000);
        });

        it('enforces restrictive cross-origin referrer leakage standards', () => {
            expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
        });

        it('enforces restrictive Permissions-Policy header', () => {
            expect(response.headers['permissions-policy']).toBe(
                'camera=(), microphone=(), geolocation=(), payment=()'
            );
        });
    });

    describe('GET /non-existent-endpoint (404 Fallback)', () => {
        let response;

        beforeAll(async () => {
            response = await request(app).get('/non-existent-endpoint');
        });

        it('maintains security headers and omits X-Powered-By on non-200 responses', () => {
            expect(response.headers['x-powered-by']).toBeUndefined();
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['content-security-policy']).toBeDefined();
            expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
        });
    });
});
