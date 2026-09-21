const mongoose = require('mongoose');

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const assigneeSchema = new mongoose.Schema(
    {
        id:     { type: String, required: true },
        name:   { type: String, required: true },
        email:  { type: String, required: true },
        role:   { type: String, default: 'developer' },
        avatar: { type: String, default: null },
    },
    { _id: false }
);

const commentSchema = new mongoose.Schema(
    {
        authorId:   { type: String, required: true },
        authorName: { type: String, required: true },
        avatar:     { type: String, default: null },
        text:       { type: String, required: true, trim: true, maxlength: 2000 },
    },
    { timestamps: true }
);

const activitySchema = new mongoose.Schema(
    {
        userId:   { type: String, required: true },
        userName: { type: String, required: true },
        action:   { type: String, required: true },  // e.g. "changed status", "assigned user"
        field:    { type: String, default: null },    // e.g. "status", "priority"
        oldValue: { type: String, default: null },
        newValue: { type: String, default: null },
    },
    { timestamps: true }
);

const timeLogSchema = new mongoose.Schema(
    {
        userId:      { type: String, required: true },
        userName:    { type: String, required: true },
        hoursLogged: { type: Number, required: true, min: 0.25, max: 24 },
        note:        { type: String, default: '', maxlength: 500 },
        date:        { type: Date, default: Date.now },
    },
    { _id: true, timestamps: true }
);

const notificationDispatchSchema = new mongoose.Schema(
    {
        key:         { type: String, required: true },
        type:        { type: String, required: true },
        recipientId: { type: String, required: true },
        sentAt:      { type: Date, default: Date.now },
    },
    { _id: false }
);

// ─── Main Task Schema ─────────────────────────────────────────────────────────

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [5000, 'Description cannot exceed 5000 characters'],
            default: '',
        },
        status: {
            type: String,
            default: 'todo',
            trim: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        deadline: {
            type: Date,
            default: null,
        },

        // ── Multiple assignees ──────────────────────────────────────────────
        assignees: {
            type: [assigneeSchema],
            default: [],
        },

        // ── Reporter / creator ─────────────────────────────────────────────
        reporter: {
            id:     { type: String, default: 'system' },
            name:   { type: String, default: 'System' },
            email:  { type: String, default: '' },
            avatar: { type: String, default: null },
        },

        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        tags: {
            type: [String],
            default: [],
        },
        board: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            default: null,
        },
        project: {
            type: String,
            trim: true,
            default: 'General',
        },
        sprint: {
            type: String,
            trim: true,
            default: null,
        },

        // ── Estimates & time tracking ──────────────────────────────────────
        estimatedHours: {
            type: Number,
            min: 0,
            default: 0,
        },
        timeLogs: {
            type: [timeLogSchema],
            default: [],
        },

        // ── Comments ───────────────────────────────────────────────────────
        comments: {
            type: [commentSchema],
            default: [],
        },

        // ── Activity log ───────────────────────────────────────────────────
        activity: {
            type: [activitySchema],
            default: [],
        },
        notificationDispatches: {
            type: [notificationDispatchSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
taskSchema.index({ status: 1 });
taskSchema.index({ 'reporter.id': 1 });
taskSchema.index({ 'assignees.id': 1 });
taskSchema.index({ 'assignees.email': 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ board: 1 });

// ── Virtual: total logged hours ───────────────────────────────────────────────
taskSchema.virtual('totalLoggedHours').get(function () {
    return this.timeLogs.reduce((sum, log) => sum + log.hoursLogged, 0);
});

taskSchema.set('toJSON', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
