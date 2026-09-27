const http = require('http');
const request = require('supertest');
const { config } = require('../../src/config/env');
const { createApp } = require('../../src/server');

describe('OAuth 2.0 Reverse Proxy Pass-Through Integration Suite', () => {
    let mockDownstreamServer;
    let mockDownstreamPort;
    let originalUserServiceUrl;
    let app;
    let lastDownstreamRequest = null;

    beforeAll((done) => {
        originalUserServiceUrl = config.services.userServiceUrl;

        // Spin up ephemeral downstream HTTP server to simulate User Service
        mockDownstreamServer = http.createServer((req, res) => {
            lastDownstreamRequest = {
                url: req.url,
                method: req.method,
                headers: req.headers,
            };

            if (req.url.startsWith('/api/users/auth/google/callback')) {
                res.writeHead(302, {
                    'Location': 'http://localhost:5173/dashboard?token=mock_jwt_token',
                    'Set-Cookie': 'jwt=mock_jwt_token; Path=/; HttpOnly; SameSite=Lax',
                    'Content-Type': 'text/plain',
                });
                res.end('Redirecting to dashboard...');
                return;
            }

            if (req.url === '/api/users/auth/google/redirect-temporary') {
                res.writeHead(307, {
                    'Location': 'https://accounts.google.com/o/oauth2/v2/auth?prompt=select_account',
                    'Content-Type': 'text/plain',
                });
                res.end('Temporary redirect...');
                return;
            }

            if (req.url === '/api/users/auth/google') {
                res.writeHead(302, {
                    'Location':
                        'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=google_mock_client_id&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fusers%2Fauth%2Fgoogle%2Fcallback&scope=openid%20email%20profile&state=secure_state_val',
                    'Set-Cookie': 'oauth_state=secure_state_val; Path=/; HttpOnly',
                    'Content-Type': 'text/plain',
                });
                res.end('Redirecting to Google...');
                return;
            }

            if (req.url === '/api/users/profile') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'profile data' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ path: req.url }));
        });

        mockDownstreamServer.listen(0, '127.0.0.1', () => {
            mockDownstreamPort = mockDownstreamServer.address().port;
            config.services.userServiceUrl = `http://127.0.0.1:${mockDownstreamPort}`;
            app = createApp();
            done();
        });
    });

    afterAll((done) => {
        config.services.userServiceUrl = originalUserServiceUrl;
        mockDownstreamServer.close(done);
    });

    beforeEach(() => {
        lastDownstreamRequest = null;
    });

    it('passes through Google OAuth authorization redirect (HTTP 302) with intact Location and Set-Cookie', async () => {
        const expectedGoogleOAuthUrl =
            'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=google_mock_client_id&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fusers%2Fauth%2Fgoogle%2Fcallback&scope=openid%20email%20profile&state=secure_state_val';

        const response = await request(app)
            .get('/api/users/auth/google')
            .expect(302);

        // Verify Location header is intact and not rewritten
        expect(response.headers.location).toBe(expectedGoogleOAuthUrl);

        // Verify Set-Cookie header is preserved
        expect(response.headers['set-cookie']).toBeDefined();
        const setCookieHeader = Array.isArray(response.headers['set-cookie'])
            ? response.headers['set-cookie'].join('; ')
            : response.headers['set-cookie'];
        expect(setCookieHeader).toContain('oauth_state=secure_state_val');

        // Verify security headers remain attached to proxied redirect response
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('preserves query parameters without stripping during OAuth callback handshake', async () => {
        const queryParams = 'code=4%2F0AY0e-g7mock_code_xyz123&state=secure_state_val';

        const response = await request(app)
            .get(`/api/users/auth/google/callback?${queryParams}`)
            .expect(302);

        // Verify downstream service received the full query string intact
        expect(lastDownstreamRequest).not.toBeNull();
        expect(lastDownstreamRequest.url).toBe(`/api/users/auth/google/callback?${queryParams}`);

        // Verify gateway returned downstream redirect and session cookies
        expect(response.headers.location).toBe('http://localhost:5173/dashboard?token=mock_jwt_token');
        const setCookieHeader = Array.isArray(response.headers['set-cookie'])
            ? response.headers['set-cookie'].join('; ')
            : response.headers['set-cookie'];
        expect(setCookieHeader).toContain('jwt=mock_jwt_token');
    });

    it('passes through HTTP 307 temporary redirect responses intact', async () => {
        const response = await request(app)
            .get('/api/users/auth/google/redirect-temporary')
            .expect(307);

        expect(response.headers.location).toBe(
            'https://accounts.google.com/o/oauth2/v2/auth?prompt=select_account'
        );
        expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('forwards authorization headers and cookies intact to downstream services', async () => {
        const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenPayload';
        const cookieHeader = 'session_id=s_123456789; tracking=enabled';

        const response = await request(app)
            .get('/api/users/profile')
            .set('Authorization', authHeader)
            .set('Cookie', cookieHeader)
            .expect(200);

        expect(response.body).toEqual({ success: true, message: 'profile data' });

        // Verify downstream service received exact credentials
        expect(lastDownstreamRequest).not.toBeNull();
        expect(lastDownstreamRequest.headers.authorization).toBe(authHeader);
        expect(lastDownstreamRequest.headers.cookie).toBe(cookieHeader);
    });

    it('injects standard reverse-proxy forwarding metadata (xfwd: true)', async () => {
        await request(app)
            .get('/api/users/profile')
            .set('X-Forwarded-Proto', 'https')
            .expect(200);

        expect(lastDownstreamRequest).not.toBeNull();
        expect(lastDownstreamRequest.headers['x-forwarded-for']).toBeDefined();
        expect(lastDownstreamRequest.headers['x-forwarded-host']).toBeDefined();
    });
});
