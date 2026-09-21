const request = require('supertest');
jest.setTimeout(15000);
const app = require('../../src/app');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('../../src/config/db');
jest.mock('../../src/models/TasksMirror');
jest.mock('axios');
const axios = require('axios');

describe('Sync API Endpoints', () => {
    beforeAll(() => {
        jest.spyOn(mongoose, 'connect').mockResolvedValue({
            connection: { host: 'localhost' }
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        const mockTasks = Array(20).fill(0).map((_, i) => ({
            _id: `mock-${i}`,
            title: `Mock task ${i}`,
            status: 'todo',
            assignedTo: { _id: 'user1', name: 'User 1' },
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        axios.get.mockResolvedValue({ data: { tasks: mockTasks } });
    });

    describe('POST /api/sync/tasks', () => {
        it('should trigger sync successfully', async () => {
            const res = await request(app)
                .post('/api/sync/tasks');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('message');
            expect(res.body.data).toHaveProperty('count');
        });

        it('should return sync result with count', async () => {
            const res = await request(app)
                .post('/api/sync/tasks');

            expect(res.status).toBe(200);
            expect(res.body.data.count).toBe(20); // Mock generates 20 tasks
        });
    });
});
