const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema(
    {
        period: {
            type: String,
            unique: true,
            required: true,
            enum: ['week', 'month'],
            index: true
        },
        summary: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        weeklyData: {
            type: Array,
            default: []
        },
        statusBreakdown: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        userBreakdown: {
            type: Array,
            default: []
        },
        updatedAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('AnalyticsCache', analyticsCacheSchema);
