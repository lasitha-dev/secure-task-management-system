const mongoose = require('mongoose');

const tasksMirrorSchema = new mongoose.Schema(
    {
        taskId: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['todo', 'inProgress', 'done'],
            default: 'todo',
            index: true
        },
        assignedUserId: {
            type: String,
            index: true
        },
        assignedUserName: {
            type: String
        },
        completedAt: {
            type: Date,
            index: true
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('TasksMirror', tasksMirrorSchema);
