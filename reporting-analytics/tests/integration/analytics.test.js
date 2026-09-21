const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const TasksMirror = require('../../src/models/TasksMirror');

// Mock sincedb connection
jest.mock('../../src/config/db');
jest.mock('../../src/services/syncService');

describe('Analytics API Endpoints', () => {
    beforeAll(() => {
        // Mock mongoose connection
        jest.spyOn(mongoose, 'connect').mockResolvedValue({
            connection: { host: 'localhost' }
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        TasksMirror.countDocuments = jest.fn();
        TasksMirror.find = jest.fn();
        TasksMirror.aggregate = jest.fn();
    });

    describe('GET /api/analytics/summary', () => {
        it('should return summary with period parameter', async () => {
            TasksMirror.countDocuments = jest.fn()
                .mockResolvedValueOnce(20) // totalTasksCurrent
                .mockResolvedValueOnce(12) // completedTasksCurrent
                .mockResolvedValueOnce(18) // totalTasksPrevious
                .mockResolvedValueOnce(10); // completedTasksPrevious

            const res = await request(app)
                .get('/api/analytics/summary')
                .query({ period: 'week' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('totalTasks');
        });

        it('should return default period if not provided', async () => {
            TasksMirror.countDocuments = jest.fn()
                .mockResolvedValueOnce(20)
                .mockResolvedValueOnce(12)
                .mockResolvedValueOnce(18)
                .mockResolvedValueOnce(10);

            const res = await request(app)
                .get('/api/analytics/summary');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('GET /api/analytics/weekly', () => {
        it('should return array of 7 days', async () => {
            TasksMirror.find = jest.fn().mockResolvedValue([]);

            const res = await request(app)
                .get('/api/analytics/weekly');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBe(7);
        });
    });

    describe('GET /api/analytics/status', () => {
        it('should return status breakdown', async () => {
            TasksMirror.countDocuments = jest.fn()
                .mockResolvedValueOnce(12) // completed
                .mockResolvedValueOnce(5)  // inProgress
                .mockResolvedValueOnce(3); // todo

            const res = await request(app)
                .get('/api/analytics/status');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('completed');
            expect(res.body.data).toHaveProperty('inProgress');
            expect(res.body.data).toHaveProperty('pending');
            expect(res.body.data).toHaveProperty('total');
        });
    });

    describe('GET /api/analytics/users', () => {
        it('should return user breakdown array', async () => {
            TasksMirror.aggregate = jest.fn().mockResolvedValue([
                {
                    _id: 'USER-01',
                    userName: 'Alice',
                    totalTasks: 8,
                    completedTasks: 6
                }
            ]);

            const res = await request(app)
                .get('/api/analytics/users');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
});
