const rateLimit = require('express-rate-limit');

/**
 * Endpoint-specific limiter for POST /api/reports/generate.
 *
 * The service already has a global rate limiter (100 req/15min/IP, see
 * rateLimiter.js) applied to every route — this does NOT replace it, both
 * run. Report generation is throttled tighter than that baseline because,
 * unlike a typical read, each call:
 *   - runs several DB aggregations/count queries (getSummary, getWeeklyData,
 *     getStatusBreakdown, getUserBreakdown) even after parallelizing them, and
 *   - persists a brand new Report document every time, so repeated calls
 *     grow the Report collection without bound (the read side of that is
 *     mitigated separately by paginating GET /api/reports, but unbounded
 *     writes are still a storage-growth concern).
 *
 * 10 requests per 15 minutes per IP is generous for legitimate use (reports
 * are generated on-demand, not in bulk) while meaningfully capping abuse
 * beyond the generic per-service ceiling.
 */
const reportGenerationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many report generation requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = reportGenerationLimiter;
