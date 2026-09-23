const Report = require('../models/Report');
const analyticsService = require('./analyticsService');
const { PAGINATION } = require('../utils/constants');

/**
 * Defensively clamp page/limit to safe bounds regardless of what the caller
 * supplied. This is the last line of defense against an unbounded query
 * (A04) even if route-level validation is bypassed or missing.
 */
const normalizePagination = (page, limit) => {
    let safePage = parseInt(page, 10);
    if (!Number.isInteger(safePage) || safePage < 1) {
        safePage = PAGINATION.DEFAULT_PAGE;
    }

    let safeLimit = parseInt(limit, 10);
    if (!Number.isInteger(safeLimit) || safeLimit < 1) {
        safeLimit = PAGINATION.DEFAULT_LIMIT;
    } else if (safeLimit > PAGINATION.MAX_LIMIT) {
        safeLimit = PAGINATION.MAX_LIMIT;
    }

    return { page: safePage, limit: safeLimit };
};

/**
 * Generate a new report
 * @param {string} title - report title
 * @param {string} authorName - author name
 * @param {string} period - report period (week, month, custom)
 * @param {string} userId - user ID (optional)
 * @returns {Promise<object>} - created report
 */
const generateReport = async (title, authorName, period, userId = null) => {
    try {
        // Create report with processing status
        const report = new Report({
            title,
            authorName,
            period,
            userId,
            status: 'processing',
            generatedAt: new Date()
        });

        await report.save();
        console.log(`📊 Report "${title}" created with ID: ${report._id}`);

        // Get analytics snapshot — these four calls are independent of one
        // another, so run them concurrently instead of sequentially. This
        // avoids holding the request open for the sum of each call's
        // latency (A04 resource-exhaustion hardening).
        const [summary, weeklyData, statusBreakdown, userBreakdown] = await Promise.all([
            analyticsService.getSummary(period),
            analyticsService.getWeeklyData(),
            analyticsService.getStatusBreakdown(),
            analyticsService.getUserBreakdown(userId)
        ]);

        // Update report with data and status ready
        report.data = { summary, weeklyData, statusBreakdown, userBreakdown };
        report.status = 'ready';
        await report.save();

        console.log(`✅ Report "${title}" is ready`);
        return report;
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
};

/**
 * Get all reports, paginated
 * @param {number|string} page - requested page (1-based)
 * @param {number|string} limit - requested page size
 * @returns {Promise<object>} - { reports, pagination: { page, limit, total, totalPages } }
 */
const getAllReports = async (page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) => {
    try {
        const { page: safePage, limit: safeLimit } = normalizePagination(page, limit);
        const skip = (safePage - 1) * safeLimit;

        const [reports, total] = await Promise.all([
            Report.find().sort({ generatedAt: -1 }).skip(skip).limit(safeLimit),
            Report.countDocuments()
        ]);

        return {
            reports,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit)
            }
        };
    } catch (error) {
        console.error('Error getting all reports:', error);
        throw error;
    }
};

/**
 * Get report by ID
 * @param {string} id - report ID
 * @returns {Promise<object>} - report object
 */
const getReportById = async (id) => {
    try {
        const report = await Report.findById(id);
        if (!report) {
            throw new Error('Report not found');
        }
        return report;
    } catch (error) {
        console.error('Error getting report by ID:', error);
        throw error;
    }
};

/**
 * Delete report by ID
 * @param {string} id - report ID
 * @returns {Promise<object>} - deletion result
 */
const deleteReport = async (id) => {
    try {
        const report = await Report.findByIdAndDelete(id);
        if (!report) {
            throw new Error('Report not found');
        }
        console.log(`🗑️ Report "${report.title}" deleted`);
        return { success: true, message: 'Report deleted successfully' };
    } catch (error) {
        console.error('Error deleting report:', error);
        throw error;
    }
};

/**
 * Get reports for a specific user, paginated
 * @param {string} userId - user ID
 * @param {number|string} page - requested page (1-based)
 * @param {number|string} limit - requested page size
 * @returns {Promise<object>} - { reports, pagination: { page, limit, total, totalPages } }
 */
const getUserReports = async (userId, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) => {
    try {
        const { page: safePage, limit: safeLimit } = normalizePagination(page, limit);
        const skip = (safePage - 1) * safeLimit;

        const [reports, total] = await Promise.all([
            Report.find({ userId }).sort({ generatedAt: -1 }).skip(skip).limit(safeLimit),
            Report.countDocuments({ userId })
        ]);

        return {
            reports,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit)
            }
        };
    } catch (error) {
        console.error('Error getting user reports:', error);
        throw error;
    }
};

module.exports = {
    generateReport,
    getAllReports,
    getReportById,
    deleteReport,
    getUserReports
};
