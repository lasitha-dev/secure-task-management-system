const reportsService = require('../../src/services/reportsService');
jest.setTimeout(15000);
const Report = require('../../src/models/Report');
const analyticsService = require('../../src/services/analyticsService');

// Mock dependencies
jest.mock('../../src/models/Report');
jest.mock('../../src/services/analyticsService');

describe('Reports Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateReport', () => {
        it('should create report with processing status', async () => {
            const mockReport = {
                _id: '123',
                title: 'Test Report',
                authorName: 'Alice',
                period: 'week',
                status: 'processing',
                save: jest.fn().mockResolvedValue(true)
            };

            Report.mockImplementation(() => mockReport);

            analyticsService.getSummary.mockResolvedValueOnce({});
            analyticsService.getWeeklyData.mockResolvedValueOnce([]);
            analyticsService.getStatusBreakdown.mockResolvedValueOnce({});
            analyticsService.getUserBreakdown.mockResolvedValueOnce([]);

            const result = await reportsService.generateReport('Test Report', 'Alice', 'week');

            expect(result).toBeDefined();
            expect(result.title).toBe('Test Report');
        });

        it('should update report status to ready after data gathering', async () => {
            const mockReport = {
                _id: '123',
                title: 'Test Report',
                status: 'processing',
                save: jest.fn().mockResolvedValue(true),
                data: {}
            };

            Report.mockImplementation(() => mockReport);

            analyticsService.getSummary.mockResolvedValueOnce({ summary: true });
            analyticsService.getWeeklyData.mockResolvedValueOnce([]);
            analyticsService.getStatusBreakdown.mockResolvedValueOnce({});
            analyticsService.getUserBreakdown.mockResolvedValueOnce([]);

            await reportsService.generateReport('Test', 'Author', 'week');

            expect(mockReport.status).toBe('ready');
            expect(mockReport.save).toHaveBeenCalled();
        });
    });

    describe('getAllReports', () => {
        const mockReports = [
            { _id: '1', title: 'Report 1', generatedAt: new Date('2026-03-05') },
            { _id: '2', title: 'Report 2', generatedAt: new Date('2026-03-04') }
        ];

        function mockFindChain(reports) {
            const chain = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(reports)
            };
            Report.find = jest.fn().mockReturnValue(chain);
            return chain;
        }

        it('should return reports sorted by date descending with pagination metadata', async () => {
            const chain = mockFindChain(mockReports);
            Report.countDocuments = jest.fn().mockResolvedValue(2);

            const result = await reportsService.getAllReports();

            expect(Report.find).toHaveBeenCalled();
            expect(chain.sort).toHaveBeenCalledWith({ generatedAt: -1 });
            expect(Array.isArray(result.reports)).toBe(true);
            expect(result.pagination).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
        });

        it('should default to page=1, limit=20 when none is requested', async () => {
            const chain = mockFindChain(mockReports);
            Report.countDocuments = jest.fn().mockResolvedValue(2);

            await reportsService.getAllReports();

            expect(chain.skip).toHaveBeenCalledWith(0);
            expect(chain.limit).toHaveBeenCalledWith(20);
        });

        it('should accept limit=100 (the maximum allowed)', async () => {
            const chain = mockFindChain(mockReports);
            Report.countDocuments = jest.fn().mockResolvedValue(2);

            const result = await reportsService.getAllReports(1, 100);

            expect(chain.limit).toHaveBeenCalledWith(100);
            expect(result.pagination.limit).toBe(100);
        });

        it('should clamp a requested limit above 100 to 100 instead of running an unbounded query', async () => {
            const chain = mockFindChain(mockReports);
            Report.countDocuments = jest.fn().mockResolvedValue(2);

            const result = await reportsService.getAllReports(1, 999999999);

            expect(chain.limit).toHaveBeenCalledWith(100);
            expect(result.pagination.limit).toBe(100);
        });

        it('should fall back to safe defaults for invalid/negative page and limit', async () => {
            const chain = mockFindChain(mockReports);
            Report.countDocuments = jest.fn().mockResolvedValue(2);

            const result = await reportsService.getAllReports(-1, -5);

            expect(chain.skip).toHaveBeenCalledWith(0);
            expect(chain.limit).toHaveBeenCalledWith(20);
            expect(result.pagination).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
        });
    });

    describe('getUserReports', () => {
        const mockReports = [
            { _id: '1', title: 'Report 1', userId: 'u1', generatedAt: new Date('2026-03-05') }
        ];

        function mockFindChain(reports) {
            const chain = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(reports)
            };
            Report.find = jest.fn().mockReturnValue(chain);
            return chain;
        }

        it('should scope the query to the given userId and return pagination metadata', async () => {
            mockFindChain(mockReports);
            Report.countDocuments = jest.fn().mockResolvedValue(1);

            const result = await reportsService.getUserReports('u1');

            expect(Report.find).toHaveBeenCalledWith({ userId: 'u1' });
            expect(Report.countDocuments).toHaveBeenCalledWith({ userId: 'u1' });
            expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
        });

        it('should clamp a requested limit above 100 to 100 instead of running an unbounded query', async () => {
            const chain = mockFindChain(mockReports);
            Report.countDocuments = jest.fn().mockResolvedValue(1);

            const result = await reportsService.getUserReports('u1', 1, 500);

            expect(chain.limit).toHaveBeenCalledWith(100);
            expect(result.pagination.limit).toBe(100);
        });
    });

    describe('getReportById', () => {
        it('should return report when found', async () => {
            const mockReport = { _id: '123', title: 'Report 1' };
            Report.findById = jest.fn().mockResolvedValue(mockReport);

            const result = await reportsService.getReportById('123');

            expect(result).toEqual(mockReport);
            expect(Report.findById).toHaveBeenCalledWith('123');
        });

        it('should throw error when report not found', async () => {
            Report.findById = jest.fn().mockResolvedValue(null);

            await expect(reportsService.getReportById('999')).rejects.toThrow('Report not found');
        });
    });

    describe('deleteReport', () => {
        it('should delete report and return success', async () => {
            const mockReport = { _id: '123', title: 'Report 1' };
            Report.findByIdAndDelete = jest.fn().mockResolvedValue(mockReport);

            const result = await reportsService.deleteReport('123');

            expect(result.success).toBe(true);
            expect(Report.findByIdAndDelete).toHaveBeenCalledWith('123');
        });

        it('should throw error when report not found', async () => {
            Report.findByIdAndDelete = jest.fn().mockResolvedValue(null);

            await expect(reportsService.deleteReport('999')).rejects.toThrow('Report not found');
        });
    });
});
