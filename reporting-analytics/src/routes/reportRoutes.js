const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { validateReportGeneration, validatePagination } = require('../middleware/validateRequest');
const { authMiddleware } = require('../middleware/authMiddleware');
const reportGenerationLimiter = require('../middleware/reportGenerationLimiter');

/**
 * GET /api/reports?page=&limit=
 * Returns: paginated reports sorted by date (for Recent Reports table)
 */
router.get('/', validatePagination, reportsController.getAllReports);

/**
 * GET /api/reports/my-reports?page=&limit=
 * Returns: paginated reports for current user only
 * Requires: JWT authentication
 */
router.get('/my-reports', authMiddleware, validatePagination, reportsController.getMyReports);

/**
 * GET /api/reports/:id
 * Returns: single report details
 */
router.get('/:id', reportsController.getReportById);

/**
 * POST /api/reports/generate
 * Body: { title, authorName, period }
 * Creates report snapshot, saves to DB, returns report
 */
router.post('/generate', reportGenerationLimiter, validateReportGeneration, reportsController.generateReport);

/**
 * DELETE /api/reports/:id
 * Deletes report
 */
router.delete('/:id', reportsController.deleteReport);

module.exports = router;
