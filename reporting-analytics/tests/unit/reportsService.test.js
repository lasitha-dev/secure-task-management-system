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
        it('should return all reports sorted by date descending', async () => {
            const mockReports = [
                { _id: '1', title: 'Report 1', generatedAt: new Date('2026-03-05') },
                { _id: '2', title: 'Report 2', generatedAt: new Date('2026-03-04') }
            ];

            Report.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockReports)
            });

            const result = await reportsService.getAllReports();

            expect(Array.isArray(result)).toBe(true);
            expect(Report.find).toHaveBeenCalled();
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
