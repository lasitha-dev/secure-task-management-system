const Task = require('../models/Task');
const {
    createNotification,
    createBulkNotifications,
} = require('./notificationService');
const { triggerDeadlineReminderForTask } = require('./deadlineReminderService');

function buildTaskAssignedNotification(task, assignee, actor) {
    return {
        type: 'task_assigned',
        title: `New task assigned: ${task.title}`,
        message: `${actor?.name || 'A teammate'} assigned you to \"${task.title}\".`,
        recipientId: assignee.id,
        priority: task.priority === 'urgent' ? 'high' : 'medium',
        metadata: {
            taskId: task._id.toString(),
            taskTitle: task.title,
            assignedBy: actor?.id || null,
            assignedByName: actor?.name || null,
            boardId: task.board ? task.board.toString() : null,
            deadline: task.deadline,            recipientEmail: assignee.email || null,        },
    };
}
function buildActorAssignedNotification(task, assignees, actor) {
    const names = assignees.map((a) => a.name).join(', ');
    return {
        type: 'task_assigned',
        title: `You assigned members to: ${task.title}`,
        message: `You assigned ${names} to "${task.title}".`,
        recipientId: actor.id,
        priority: task.priority === 'urgent' ? 'high' : 'medium',
        metadata: {
            taskId: task._id.toString(),
            taskTitle: task.title,
            assignedBy: actor.id,
            assignedByName: actor.name,
            boardId: task.board ? task.board.toString() : null,
            deadline: task.deadline,
            recipientEmail: actor.email || null,
        },
    };
}
async function sendAssignmentNotifications(task, assignees, actor, authToken = null) {
    if (!Array.isArray(assignees) || assignees.length === 0) {
        return;
    }

    const notifications = assignees
        .filter((assignee) => assignee.id !== actor?.id)
        .map((assignee) => buildTaskAssignedNotification(task, assignee, actor));

    if (actor?.id) {
        notifications.push(buildActorAssignedNotification(task, assignees, actor));
    }

    if (notifications.length === 0) {
        return;
    }

    try {
        await createBulkNotifications(notifications, authToken);
    } catch (error) {
        console.error(`Failed to send task assignment notifications for task ${task._id}: ${error.message}`);
    }
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function makeActivity(user, action, field = null, oldValue = null, newValue = null) {
    return {
        userId:   user?.id   || 'system',
        userName: user?.name || 'System',
        action,
        field,
        oldValue: oldValue !== undefined ? String(oldValue ?? '') : null,
        newValue: newValue !== undefined ? String(newValue ?? '') : null,
    };
}

/**
 * Create a new task
 */
async function createTask(data, reporter = null, authToken = null) {
    const taskData = { ...data };

    // Attach reporter from JWT user if not supplied in body
    if (reporter && !taskData.reporter) {
        taskData.reporter = {
            id:    reporter.id,
            name:  reporter.name,
            email: reporter.email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(reporter.name)}&background=144bb8&color=fff`,
        };
    }

    // Seed first activity entry
    taskData.activity = [
        makeActivity(reporter, 'created', null, null, taskData.title),
    ];

    const task = new Task(taskData);
    const savedTask = await task.save();
    await sendAssignmentNotifications(savedTask, savedTask.assignees, reporter, authToken);
    return savedTask;
}

/**
 * Get all tasks with optional filters
 * Supported filters: status, priority, assigneeId, reporterId, project, sprint, board
 */
async function getAllTasks(filters = {}) {
    const query = {};

    if (filters.status)     query.status           = filters.status;
    if (filters.priority)   query.priority         = filters.priority;
    if (filters.assigneeId) query['assignees.id']  = filters.assigneeId;
    if (filters.reporterId) query['reporter.id']   = filters.reporterId;
    // Legacy support for old field names
    if (filters.assignedTo) query['assignees.id']  = filters.assignedTo;
    if (filters.createdBy)  query['reporter.id']   = filters.createdBy;
    if (filters.project)    query.project          = filters.project;
    if (filters.sprint)     query.sprint           = filters.sprint;
    if (filters.board)      query.board            = filters.board;

    return await Task.find(query).sort({ createdAt: -1 });
}

/**
 * Get a single task by ID
 */
async function getTaskById(id) {
    return await Task.findById(id);
}

/**
 * Update a task fully (PUT) — tracks field changes in activity log
 */
async function updateTask(id, data, user = null, authToken = null) {
    const task = await Task.findById(id);
    if (!task) return null;

    const TRACKED = ['title', 'description', 'status', 'priority', 'deadline', 'progress', 'project', 'sprint'];
    const activities = [];

    const deadlineChanged = data.deadline !== undefined && String(task.deadline ?? '') !== String(data.deadline ?? '');

    TRACKED.forEach((field) => {
        if (data[field] !== undefined && String(task[field] ?? '') !== String(data[field] ?? '')) {
            activities.push(makeActivity(user, 'updated', field, task[field], data[field]));
        }
    });

    if (deadlineChanged) {
        const newDeadlineIso = data.deadline ? new Date(data.deadline).toISOString() : null;
        task.notificationDispatches = newDeadlineIso
            ? (task.notificationDispatches || []).filter((d) => d.key.endsWith(`:${newDeadlineIso}`))
            : [];
    }

    Object.assign(task, data);
    if (activities.length) task.activity.push(...activities);

    const savedTask = await task.save();

    if (deadlineChanged && savedTask.deadline) {
        try {
            await triggerDeadlineReminderForTask(savedTask, authToken);
        } catch (error) {
            console.error(`Failed to trigger deadline reminder after update for task ${savedTask._id}: ${error.message}`);
        }
    }

    return savedTask;
}

/**
 * Partially update a task (PATCH) — used for drag-drop status change
 */
async function patchTask(id, data, user = null, authToken = null) {
    const task = await Task.findById(id);
    if (!task) return null;

    const TRACKED = ['title', 'description', 'status', 'priority', 'deadline', 'progress'];
    const activities = [];

    const deadlineChanged = data.deadline !== undefined && String(task.deadline ?? '') !== String(data.deadline ?? '');

    TRACKED.forEach((field) => {
        if (data[field] !== undefined && String(task[field] ?? '') !== String(data[field] ?? '')) {
            activities.push(makeActivity(user, 'updated', field, task[field], data[field]));
        }
    });

    if (deadlineChanged) {
        const newDeadlineIso = data.deadline ? new Date(data.deadline).toISOString() : null;
        task.notificationDispatches = newDeadlineIso
            ? (task.notificationDispatches || []).filter((d) => d.key.endsWith(`:${newDeadlineIso}`))
            : [];
    }

    Object.keys(data).forEach((k) => { task[k] = data[k]; });
    if (activities.length) task.activity.push(...activities);

    const savedTask = await task.save();

    if (deadlineChanged && savedTask.deadline) {
        try {
            await triggerDeadlineReminderForTask(savedTask, authToken);
        } catch (error) {
            console.error(`Failed to trigger deadline reminder after patch for task ${savedTask._id}: ${error.message}`);
        }
    }

    return savedTask;
}

/**
 * Delete a task by ID
 */
async function deleteTask(id) {
    return await Task.findByIdAndDelete(id);
}

// ─── Assignees ────────────────────────────────────────────────────────────────

/**
 * Add an assignee to a task (prevents duplicates)
 */
async function addAssignee(taskId, assignee, user = null, authToken = null) {
    const task = await Task.findById(taskId);
    if (!task) return null;

    const alreadyAssigned = task.assignees.some((a) => a.id === assignee.id);
    if (alreadyAssigned) {
        const err = new Error('User is already assigned to this task.');
        err.status = 409;
        throw err;
    }

    task.assignees.push(assignee);
    task.activity.push(makeActivity(user, 'assigned', 'assignees', null, assignee.name));
    const savedTask = await task.save();

    try {
        await createNotification(buildTaskAssignedNotification(savedTask, assignee, user), authToken);
    } catch (error) {
        console.error(`Failed to send assignment notification for task ${savedTask._id}: ${error.message}`);
    }

    if (user?.id && user.id !== assignee.id) {
        try {
            await createNotification(buildActorAssignedNotification(savedTask, [assignee], user), authToken);
        } catch (error) {
            console.error(`Failed to send actor assignment notification for task ${savedTask._id}: ${error.message}`);
        }
    }

    return savedTask;
}

/**
 * Remove an assignee from a task
 */
async function removeAssignee(taskId, assigneeId, user = null) {
    const task = await Task.findById(taskId);
    if (!task) return null;

    const removed = task.assignees.find((a) => a.id === assigneeId);
    task.assignees = task.assignees.filter((a) => a.id !== assigneeId);

    if (removed) {
        task.activity.push(makeActivity(user, 'unassigned', 'assignees', removed.name, null));
    }

    return await task.save();
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/**
 * Add a comment to a task
 */
async function addComment(taskId, text, user) {
    const task = await Task.findById(taskId);
    if (!task) return null;

    const comment = {
        authorId:   user.id,
        authorName: user.name,
        avatar:     `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=144bb8&color=fff`,
        text,
    };

    task.comments.push(comment);
    task.activity.push(makeActivity(user, 'commented', 'comments', null, text.slice(0, 60)));
    return await task.save();
}

/**
 * Delete a comment from a task
 */
async function deleteComment(taskId, commentId, user) {
    const task = await Task.findById(taskId);
    if (!task) return null;

    const idx = task.comments.findIndex((c) => c._id.toString() === commentId);
    if (idx === -1) {
        const err = new Error('Comment not found.');
        err.status = 404;
        throw err;
    }

    task.comments.splice(idx, 1);
    task.activity.push(makeActivity(user, 'deleted_comment', 'comments', null, null));
    return await task.save();
}

// ─── Time Logging ─────────────────────────────────────────────────────────────

/**
 * Log hours worked on a task
 */
async function logTime(taskId, hours, note, user) {
    const task = await Task.findById(taskId);
    if (!task) return null;

    task.timeLogs.push({
        userId:      user.id,
        userName:    user.name,
        hoursLogged: hours,
        note:        note || '',
        date:        new Date(),
    });

    task.activity.push(makeActivity(user, 'logged_time', 'timeLogs', null, `${hours}h`));
    return await task.save();
}

/**
 * Get task counts grouped by status (for analytics/reporting)
 */
async function getTaskStats(filters = {}) {
    const query = {};
    if (filters.reporterId || filters.createdBy) query['reporter.id'] = filters.reporterId || filters.createdBy;
    if (filters.assigneeId || filters.assignedTo) query['assignees.id'] = filters.assigneeId || filters.assignedTo;
    if (filters.project)    query.project    = filters.project;

    const stats = await Task.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    // Normalise into { todo: N, in_progress: N, done: N }
    const result = { todo: 0, in_progress: 0, done: 0, total: 0 };
    stats.forEach(({ _id, count }) => {
        if (_id in result) result[_id] = count;
        result.total += count;
    });

    return result;
}

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    patchTask,
    deleteTask,
    addAssignee,
    removeAssignee,
    addComment,
    deleteComment,
    logTime,
    getTaskStats,
};
