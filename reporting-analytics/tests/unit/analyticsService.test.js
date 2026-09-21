const analyticsService = require('../../src/services/analyticsService');
const TasksMirror = require('../../src/models/TasksMirror');

// Mock the TasksMirror model
jest.mock('../../src/models/TasksMirror');

describe('Analytics Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSummary', () => {
        it('should return summary statistics with correct structure', async () => {
            // Mock returns
            TasksMirror.countDocuments.mockResolvedValueOnce(20); // totalTasksCurrent
            TasksMirror.countDocuments.mockResolvedValueOnce(12); // completedTasksCurrent
            TasksMirror.countDocuments.mockResolvedValueOnce(18); // totalTasksPrevious
            TasksMirror.countDocuments.mockResolvedValueOnce(10); // completedTasksPrevious

            const result = await analyticsService.getSummary('week');

            expect(result).toHaveProperty('totalTasks');
            expect(result).toHaveProperty('completedTasks');
            expect(result).toHaveProperty('productivity');
            expect(result).toHaveProperty('totalChange');
            expect(result).toHaveProperty('completedChange');
            expect(result).toHaveProperty('productivityChange');
            expect(result.totalTasks).toBe(20);
            expect(result.completedTasks).toBe(12);
        });

        it('should calculate productivity percentage correctly', async () => {
            TasksMirror.countDocuments.mockResolvedValueOnce(10); // totalTasksCurrent
            TasksMirror.countDocuments.mockResolvedValueOnce(5);  // completedTasksCurrent
            TasksMirror.countDocuments.mockResolvedValueOnce(0);  // totalTasksPrevious
            TasksMirror.countDocuments.mockResolvedValueOnce(0);  // completedTasksPrevious

            const result = await analyticsService.getSummary('week');

            expect(result.productivity).toBe(50);
        });
    });

    describe('getWeeklyData', () => {
        it('should return array with 7 days', async () => {
            TasksMirror.find.mockResolvedValueOnce([]);

            const result = await analyticsService.getWeeklyData();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(7);
            result.forEach(day => {
                expect(day).toHaveProperty('day');
                expect(day).toHaveProperty('completed');
            });
        });

        it('should have all day abbreviations', async () => {
            TasksMirror.find.mockResolvedValueOnce([]);

            const result = await analyticsService.getWeeklyData();

            const days = result.map(d => d.day);
            expect(days).toContain('Mon');
            expect(days).toContain('Sun');
        });
    });

    describe('getStatusBreakdown', () => {
        it('should return status breakdown with correct structure', async () => {
            TasksMirror.countDocuments.mockResolvedValueOnce(12); // completed
            TasksMirror.countDocuments.mockResolvedValueOnce(5);  // inProgress
            TasksMirror.countDocuments.mockResolvedValueOnce(3);  // todo

            const result = await analyticsService.getStatusBreakdown();

            expect(result).toHaveProperty('completed');
            expect(result).toHaveProperty('inProgress');
            expect(result).toHaveProperty('pending');
            expect(result).toHaveProperty('total');
            expect(result.total).toBe(20);
        });

        it('should calculate percentages correctly', async () => {
            TasksMirror.countDocuments.mockResolvedValueOnce(60); // completed (60%)
            TasksMirror.countDocuments.mockResolvedValueOnce(25); // inProgress (25%)
            TasksMirror.countDocuments.mockResolvedValueOnce(15); // todo (15%)

            const result = await analyticsService.getStatusBreakdown();

            expect(parseFloat(result.completed.percentage)).toBeCloseTo(60, 1);
            expect(parseFloat(result.inProgress.percentage)).toBeCloseTo(25, 1);
            expect(parseFloat(result.pending.percentage)).toBeCloseTo(15, 1);
        });
    });

    describe('getUserBreakdown', () => {
        it('should return array of user stats', async () => {
            const mockUsers = [
                {
                    _id: 'USER-01',
                    userName: 'Alice',
                    totalTasks: 8,
                    completedTasks: 6
                }
            ];

            TasksMirror.aggregate = jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue(mockUsers)
            });

            // Since aggregate returns an array directly in our service
            TasksMirror.aggregate.mockResolvedValueOnce(mockUsers);

            const result = await analyticsService.getUserBreakdown();

            expect(Array.isArray(result)).toBe(true);
            if (result.length > 0) {
                expect(result[0]).toHaveProperty('userId');
                expect(result[0]).toHaveProperty('userName');
                expect(result[0]).toHaveProperty('totalTasks');
                expect(result[0]).toHaveProperty('completedTasks');
                expect(result[0]).toHaveProperty('completionRate');
            }
        });
    });
});
