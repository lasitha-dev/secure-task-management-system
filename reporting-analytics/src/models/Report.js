const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        generatedAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        authorName: {
            type: String,
            required: true
        },
        userId: {
            type: String,
            default: null,
            index: true
        },
        status: {
            type: String,
            enum: ['ready', 'processing'],
            default: 'processing',
            index: true
        },
        period: {
            type: String,
            enum: ['week', 'month', 'custom'],
            required: true
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
