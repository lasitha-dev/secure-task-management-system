const mongoose = require('mongoose');

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const memberSchema = new mongoose.Schema(
    {
        id:     { type: String, required: true },
        name:   { type: String, required: true },
        email:  { type: String, required: true },
        role:   { type: String, default: 'member' }, // member, admin
        avatar: { type: String, default: null },
    },
    { _id: false }
);

// ─── Main Board Schema ────────────────────────────────────────────────────────

const boardSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Board name is required'],
            trim: true,
            maxlength: [100, 'Board name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },
        sprint: {
            type: String,
            trim: true,
            maxlength: [50, 'Sprint cannot exceed 50 characters'],
            default: 'Sprint 1',
        },
        members: {
            type: [memberSchema],
            default: [],
        },
        createdBy: {
            id:     { type: String, required: true },
            name:   { type: String, required: true },
            email:  { type: String, required: true },
            avatar: { type: String, default: null },
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
boardSchema.index({ name: 1 });
boardSchema.index({ 'createdBy.id': 1 });
boardSchema.index({ 'members.id': 1 });

module.exports = mongoose.model('Board', boardSchema);
