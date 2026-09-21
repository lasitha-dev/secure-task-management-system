const Joi = require('joi');

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

module.exports = { validateReportGeneration };
