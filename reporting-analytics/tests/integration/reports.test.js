const request = require('supertest');
jest.setTimeout(15000);
const app = require('../../src/app');
const mongoose = require('mongoose');
const Report = require('../../src/models/Report');
const TasksMirror = require('../../src/models/TasksMirror');

// Mock dependencies
jest.mock('../../src/config/db');
jest.mock('../../src/services/syncService');
jest.mock('../../src/services/analyticsService');
jest.mock('../../src/models/Report');
jest.mock('../../src/models/TasksMirror');

describe('Reports API Endpoints', () => {
    beforeAll(() => {
        jest.spyOn(mongoose, 'connect').mockResolvedValue({
            connection: { host: 'localhost' }
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/reports', () => {
        it('should return all reports as array', async () => {
            Report.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([
                    { _id: '1', title: 'Report 1', status: 'ready' },
                    { _id: '2', title: 'Report 2', status: 'processing' }
                ])
            });

            const res = await request(app)
                .get('/api/reports');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('GET /api/reports/:id', () => {
        it('should return single report by ID', async () => {
            Report.findById = jest.fn().mockResolvedValue({
                _id: '123',
                title: 'Test Report',
                status: 'ready'
            });

            const res = await request(app)
                .get('/api/reports/123');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /api/reports/generate', () => {
        it('should generate report with valid data', async () => {
            const analyticsService = require('../../src/services/analyticsService');
            
            const mockReport = {
                _id: '123',
                title: 'Weekly Report',
                authorName: 'Alice',
                period: 'week',
                status: 'ready',
                save: jest.fn().mockResolvedValue(true)
            };

            Report.mockImplementation(() => mockReport);
            
            // Mock analyticsService methods to return synthetic data
            analyticsService.getSummary = jest.fn().mockResolvedValue({
                totalTasks: 20,
                completedTasks: 15,
                productivity: 75,
                totalChange: 10,
                completedChange: 5,
                productivityChange: 2
            });
            analyticsService.getWeeklyData = jest.fn().mockResolvedValue([
                { day: 'Mon', completed: 2 },
                { day: 'Tue', completed: 3 }
            ]);
            analyticsService.getStatusBreakdown = jest.fn().mockResolvedValue([
                { status: 'done', count: 15, percentage: 75 }
            ]);
            analyticsService.getUserBreakdown = jest.fn().mockResolvedValue([
                { userId: 'user1', completed: 5 }
            ]);

            const res = await request(app)
                .post('/api/reports/generate')
                .send({
                    title: 'Weekly Report',
                    authorName: 'Alice',
                    period: 'week'
                });

            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 400 with missing title', async () => {
            const res = await request(app)
                .post('/api/reports/generate')
                .send({
                    authorName: 'Alice',
                    period: 'week'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('DELETE /api/reports/:id', () => {
        it('should delete report by ID', async () => {
            Report.findByIdAndDelete = jest.fn().mockResolvedValue({
                _id: '123',
                title: 'Test Report'
            });

            const res = await request(app)
                .delete('/api/reports/123');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
