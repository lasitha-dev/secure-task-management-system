// Set test env vars before any imports
require('../setup');

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
}, 120000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Require app after env is set (NODE_ENV=test prevents listen/connectDB)
const app = require('../../src/app');
// User model — used by security tests to manipulate lockout state directly
const User = require('../../src/models/User');

describe('User API Routes', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user (201)', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.name).toBe('John Doe');
      expect(res.body.data.email).toBe('john@example.com');
      expect(res.body.data.role).toBe('User');
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'not-an-email',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'password456',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });
    });

    it('should login with valid credentials (200)', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.email).toBe('john@example.com');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      token = res.body.data.token;
    });

    it('should return profile for authenticated user (200)', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John Doe');
      expect(res.body.data.email).toBe('john@example.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      token = res.body.data.token;
      userId = res.body.data._id;
    });

    it('should update own profile (200)', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Jane Doe' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Jane Doe');
    });

    it('should return 403 for non-admin updating another user', async () => {
      // Register another user
      const otherRes = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Other User',
          email: 'other@example.com',
          password: 'password123',
        });

      const otherUserId = otherRes.body.data._id;

      const res = await request(app)
        .put(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      token = res.body.data.token;
      userId = res.body.data._id;
    });

    it('should delete own account (200)', async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('User removed');
    });

    it('should return 403 for non-admin deleting another user', async () => {
      const otherRes = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Other User',
          email: 'other@example.com',
          password: 'password123',
        });

      const otherUserId = otherRes.body.data._id;

      const res = await request(app)
        .delete(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users/ (Admin only)', () => {
    let adminToken;

    beforeEach(async () => {
      // Register a user first
      const userRes = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Regular User',
          email: 'user@example.com',
          password: 'password123',
        });

      // Register an admin
      const adminRes = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password123',
          role: 'Admin',
        });

      adminToken = adminRes.body.data.token;
    });

    it('should return all users for admin (200)', async () => {
      const res = await request(app)
        .get('/api/users/')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });

    it('should return 403 for non-admin', async () => {
      // Register a regular user and get their token
      const regularRes = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123',
        });

      const regularToken = regularRes.body.data.token;

      const res = await request(app)
        .get('/api/users/')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/users/');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('user-management');
    });
  });

  describe('POST /api/users/google', () => {
    it('should return 400 when idToken is missing', async () => {
      const res = await request(app)
        .post('/api/users/google')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Google ID token is required');
    });

    it('should return 401/500 for invalid Google ID token', async () => {
      const res = await request(app)
        .post('/api/users/google')
        .send({ idToken: 'invalid-token-value' });

      // Google token verification will fail with an error
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ===========================================================================
  // SECURITY TESTS — A07:2021 Brute-Force / Account Lockout
  //
  // All four tests in this suite are GREEN after Phase 1 hardening.
  // ===========================================================================
  describe('[SECURITY] Brute-force protection — POST /api/users/login', () => {
    const VICTIM_EMAIL = 'brute@example.com';
    const VICTIM_PASSWORD = 'Correct_Pass1!';
    const WRONG_PASSWORD = 'Wrong_Pass9!';
    const MAX_ATTEMPTS = 5;

    // Register the victim account before each test in this suite
    beforeEach(async () => {
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'Brute Force Victim',
          email: VICTIM_EMAIL,
          password: VICTIM_PASSWORD,
        });
    });

    // --------------------------------------------------------------------------
    // Helper: send N failed login attempts for the victim account
    // --------------------------------------------------------------------------
    async function sendFailedAttempts(count) {
      const responses = [];
      for (let i = 0; i < count; i++) {
        const res = await request(app)
          .post('/api/users/login')
          .send({ email: VICTIM_EMAIL, password: WRONG_PASSWORD });
        responses.push(res);
      }
      return responses;
    }

    it(
      'should return 401 for each of the first 5 failed attempts ' +
      '(correct email, wrong password)',
      async () => {
        // Arrange / Act — send exactly MAX_ATTEMPTS bad-password requests
        const responses = await sendFailedAttempts(MAX_ATTEMPTS);

        // Assert — every attempt returns 401 with the generic message;
        // the 5th attempt also sets the lock, but still responds 401.
        responses.forEach((res) => {
          expect(res.status).toBe(401);
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Invalid email or password');
        });
      }
    );

    it(
      'should return HTTP 429 and lock the account after ' +
      MAX_ATTEMPTS + ' consecutive failed login attempts',
      async () => {
        // Arrange — exhaust the allowed attempts (5th sets lockUntil)
        await sendFailedAttempts(MAX_ATTEMPTS);

        // Act — the (MAX_ATTEMPTS + 1)th attempt hits the locked account
        const res = await request(app)
          .post('/api/users/login')
          .send({ email: VICTIM_EMAIL, password: WRONG_PASSWORD });

        // Assert — account is locked → 429 Too Many Requests
        expect(res.status).toBe(429);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/too many|locked|try again/i);
      }
    );

    it(
      'should return HTTP 429 when the correct password is used ' +
      'on a locked account',
      async () => {
        // Arrange — lock the account via 5 failed attempts
        await sendFailedAttempts(MAX_ATTEMPTS);

        // Act — correct password while account is locked
        const res = await request(app)
          .post('/api/users/login')
          .send({ email: VICTIM_EMAIL, password: VICTIM_PASSWORD });

        // Assert — lock takes precedence even over a valid password
        expect(res.status).toBe(429);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/too many|locked|try again/i);
      }
    );

    it(
      'should allow a successful login and reset the failed-attempt ' +
      'counter after the lockout period has expired',
      async () => {
        // Arrange — lock the account
        await sendFailedAttempts(MAX_ATTEMPTS);

        // Simulate lock expiry by writing a past timestamp directly to the DB.
        // This avoids a real 15-minute wait and keeps the test deterministic.
        await User.updateOne(
          { email: VICTIM_EMAIL },
          { lockUntil: new Date(Date.now() - 1000) } // 1 second in the past
        );

        // Act — attempt login with the correct password after expiry
        const res = await request(app)
          .post('/api/users/login')
          .send({ email: VICTIM_EMAIL, password: VICTIM_PASSWORD });

        // Assert — login succeeds and counters are reset
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('token');

        // Verify that the DB counters were cleared by the service
        const dbUser = await User.findOne({ email: VICTIM_EMAIL })
          .select('+failedLoginAttempts +lockUntil');
        expect(dbUser.failedLoginAttempts).toBe(0);
        expect(dbUser.lockUntil).toBeNull();
      }
    );

    it(
      'should NOT immediately re-lock the account on the first WRONG password ' +
      'after the lockout period has expired (stale-counter edge case)',
      async () => {
        // Arrange — lock the account (failedLoginAttempts = 5, lockUntil = future)
        await sendFailedAttempts(MAX_ATTEMPTS);

        // Simulate lock expiry: lockUntil is set to 1 second in the past.
        // failedLoginAttempts is deliberately left at MAX_LOGIN_ATTEMPTS (5)
        // to reproduce the stale-counter bug.
        await User.updateOne(
          { email: VICTIM_EMAIL },
          { lockUntil: new Date(Date.now() - 1000) }
        );

        // Act — send ONE wrong password after the lock has expired
        const res = await request(app)
          .post('/api/users/login')
          .send({ email: VICTIM_EMAIL, password: WRONG_PASSWORD });

        // Assert — must return 401, NOT 429.
        // Before the fix: the service would see failedLoginAttempts=5, increment
        // to 6, satisfy (6 >= 5) and immediately re-lock → silent re-lock bug.
        // After the fix: expired counters are reset to 0 first, so the attempt
        // counts as #1 and no lock is set.
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Invalid email or password');

        // Verify the counter is 1 (fresh window) and no new lock was set
        const dbUser = await User.findOne({ email: VICTIM_EMAIL })
          .select('+failedLoginAttempts +lockUntil');
        expect(dbUser.failedLoginAttempts).toBe(1);
        expect(dbUser.lockUntil).toBeNull();
      }
    );
  });

  // ===========================================================================
  // SECURITY TESTS — A07:2021 Consistent Error Messages (Timing / User Enumeration)
  //
  // These tests describe behaviour that should already be present.
  // They are expected to PASS against the current implementation.
  // ===========================================================================
  describe('[SECURITY] Consistent error messages — POST /api/users/login', () => {
    const REAL_EMAIL = 'real@example.com';
    const REAL_PASSWORD = 'Secure_Pass1!';
    const FAKE_EMAIL = 'nonexistent_user_99@example.com';
    const WRONG_PASSWORD = 'WrongPassword9!';

    beforeEach(async () => {
      // Register a real user so we can test wrong-password path
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'Real User',
          email: REAL_EMAIL,
          password: REAL_PASSWORD,
        });
    });

    it(
      '[PASS-EXPECTED] should return the same generic message for a nonexistent email',
      async () => {
        const res = await request(app)
          .post('/api/users/login')
          .send({ email: FAKE_EMAIL, password: WRONG_PASSWORD });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        // Must NOT reveal whether the email exists
        expect(res.body.message).toBe('Invalid email or password');
      }
    );

    it(
      '[PASS-EXPECTED] should return the same generic message for a wrong password ' +
      'on a real account (no user-enumeration via differing messages)',
      async () => {
        const res = await request(app)
          .post('/api/users/login')
          .send({ email: REAL_EMAIL, password: WRONG_PASSWORD });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        // Must be identical to the nonexistent-email message
        expect(res.body.message).toBe('Invalid email or password');
      }
    );

    it(
      '[PASS-EXPECTED] both error responses should have identical message strings ' +
      '(prevents user enumeration by comparing response bodies)',
      async () => {
        const [nonExistentRes, wrongPwRes] = await Promise.all([
          request(app)
            .post('/api/users/login')
            .send({ email: FAKE_EMAIL, password: WRONG_PASSWORD }),
          request(app)
            .post('/api/users/login')
            .send({ email: REAL_EMAIL, password: WRONG_PASSWORD }),
        ]);

        expect(nonExistentRes.status).toBe(401);
        expect(wrongPwRes.status).toBe(401);

        // The exact message text must be identical — no difference that could
        // leak whether the account exists.
        expect(nonExistentRes.body.message).toBe(wrongPwRes.body.message);
      }
    );
  });
});
