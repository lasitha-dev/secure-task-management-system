const request = require('supertest');
const { app } = require('../../src/server');

describe('CORS Policy Test Suite (OWASP A05:2021 Remediation)', () => {
    describe('1. Authorized Origin (Positive Tests)', () => {
        it('reflects exact whitelisted origin and allows credentials for http://localhost:5173', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:5173');

            expect(response.status).toBe(200);
            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
            expect(response.headers['access-control-allow-origin']).not.toBe('*');
        });

        it('reflects exact whitelisted origin and allows credentials for http://127.0.0.1:5173', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://127.0.0.1:5173');

            expect(response.status).toBe(200);
            expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
        });
    });

    describe('2. Unauthorized Origin (Negative Tests)', () => {
        it('does not reflect origin or grant access for untrusted origin http://malicious-site.com', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://malicious-site.com');

            expect(response.status).toBe(200);
            expect(response.headers['access-control-allow-origin']).toBeUndefined();
            expect(response.headers['access-control-allow-credentials']).toBeUndefined();
        });

        it('does not reflect origin for subdomain spoofing http://localhost:5173.attacker.com', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:5173.attacker.com');

            expect(response.status).toBe(200);
            expect(response.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    describe('3. Wildcard Origin Rejection', () => {
        it('never reflects wildcard * when credentials are true', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:5173');

            expect(response.headers['access-control-allow-origin']).not.toBe('*');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
        });
    });

    describe('4. Preflight Handling (OPTIONS Tests)', () => {
        it('intercepts OPTIONS request with valid preflight headers and returns 204 with methods and headers', async () => {
            const response = await request(app)
                .options('/health')
                .set('Origin', 'http://localhost:5173')
                .set('Access-Control-Request-Method', 'POST')
                .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

            expect(response.status).toBe(204);
            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
            expect(response.headers['access-control-allow-methods']).toContain('POST');
            expect(response.headers['access-control-allow-methods']).toContain('GET');
            expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
            expect(response.headers['access-control-allow-headers']).toContain('Authorization');
            expect(response.headers['access-control-max-age']).toBe('86400');
        });

        it('does not emit Access-Control-Allow-Origin for preflight from untrusted origin', async () => {
            const response = await request(app)
                .options('/health')
                .set('Origin', 'http://evil-domain.com')
                .set('Access-Control-Request-Method', 'POST');

            expect(response.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    describe('5. Direct / Non-Browser Request Handling', () => {
        it('processes requests without an Origin header normally without errors', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: 'OK', service: 'api-gateway' });
            expect(response.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
});
