const request = require('supertest');
const mongoose = require('mongoose');

// Mock dependencies so requiring the real app has no external side effects
jest.mock('../../src/config/db');
jest.mock('../../src/services/syncService');
jest.mock('../../src/services/analyticsService');
jest.mock('../../src/models/Report');
jest.mock('../../src/models/TasksMirror');

const app = require('../../src/app');

describe('X-Powered-By header', () => {
    beforeAll(() => {
        jest.spyOn(mongoose, 'connect').mockResolvedValue({
            connection: { host: 'localhost' }
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('is absent from the real app responses', async () => {
        const res = await request(app).get('/health');

        expect(res.headers['x-powered-by']).toBeUndefined();
    });
});
