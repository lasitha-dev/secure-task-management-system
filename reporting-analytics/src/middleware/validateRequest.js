const Joi = require('joi');
const { PAGINATION } = require('../utils/constants');

/**
 * Validation middleware for GET /api/reports and GET /api/reports/my-reports
 * pagination query params. Rejects out-of-range values at the edge
 * (A04 resource-exhaustion hardening); the service layer also clamps
 * defensively in case this is bypassed.
 */
const validatePagination = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
        limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT)
    }).unknown(true);

    const { error, value } = schema.validate(req.query);

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }

    req.query.page = value.page;
    req.query.limit = value.limit;
    next();
};

/**
 * Validation middleware for POST /api/reports/generate
 */
const validateReportGeneration = (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().required().messages({
            'string.empty': 'Title is required',
            'any.required': 'Title is required'
        }),
        authorName: Joi.string().required().messages({
            'string.empty': 'Author name is required',
            'any.required': 'Author name is required'
        }),
        period: Joi.string().valid('week', 'month', 'custom').required().messages({
            'any.only': 'Period must be one of: week, month, custom',
            'any.required': 'Period is required'
        })
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }

    req.body = value;
    next();
};

module.exports = { validateReportGeneration, validatePagination };
