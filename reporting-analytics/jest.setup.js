// Set NODE_ENV to test for all tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/reporting-analytics-test';
process.env.TASK_SERVICE_URL = 'mock';
process.env.USER_SERVICE_URL = 'mock';
