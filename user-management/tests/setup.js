// Set environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRE = '1h';
process.env.NODE_ENV = 'test';
process.env.PORT = '5099';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5099/api/users/auth/google/callback';
process.env.FRONTEND_URL = 'http://localhost:5173';
// Use the locally cached MongoDB binary to avoid a 600MB download on first run
process.env.MONGOMS_VERSION = '7.0.0';
