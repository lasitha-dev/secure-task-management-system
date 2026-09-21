const Task = require('../models/Task');
const { createNotification } = require('./notificationService');

const REMINDER_TYPES = Object.freeze({
    DUE_IN_48_HOURS: 'due_in_48_hours',
    DUE_IN_24_HOURS: 'due_in_24_hours',
    OVERDUE: 'overdue',
});

let schedulerHandle = null;

function buildReminderKey(task, assigneeId, reminderType) {
    return `${reminderType}:${assigneeId}:${new Date(task.deadline).toISOString()}`;
}

function hasDispatch(task, key) {
    return Array.isArray(task.notificationDispatches) && task.notificationDispatches.some((entry) => entry.key === key);
}

function resolveReminderType(deadline, now = new Date()) {
    const diffMs = new Date(deadline).getTime() - now.getTime();

    if (diffMs <= 0) {
        return REMINDER_TYPES.OVERDUE;
    }

    const hoursUntilDue = diffMs / (1000 * 60 * 60);

    if (hoursUntilDue <= 24) {
        return REMINDER_TYPES.DUE_IN_24_HOURS;
    }

    if (hoursUntilDue <= 48) {
        return REMINDER_TYPES.DUE_IN_48_HOURS;
    }

    return null;
}

function buildReminderNotification(task, assignee, reminderType) {
    const deadlineIso = new Date(task.deadline).toISOString();
    const titleByType = {
        [REMINDER_TYPES.DUE_IN_48_HOURS]: `Deadline in 48 hours: ${task.title}`,
        [REMINDER_TYPES.DUE_IN_24_HOURS]: `Deadline in 24 hours: ${task.title}`,
        [REMINDER_TYPES.OVERDUE]: `Task overdue: ${task.title}`,
    };
    const messageByType = {
        [REMINDER_TYPES.DUE_IN_48_HOURS]: `Your task \"${task.title}\" is due within 48 hours.`,
        [REMINDER_TYPES.DUE_IN_24_HOURS]: `Your task \"${task.title}\" is due within 24 hours.`,
        [REMINDER_TYPES.OVERDUE]: `Your task \"${task.title}\" is overdue. Please update it as soon as possible.`,
    };

    return {
        type: 'deadline_reminder',
        title: titleByType[reminderType],
        message: messageByType[reminderType],
        recipientId: assignee.id,
        priority: reminderType === REMINDER_TYPES.OVERDUE ? 'high' : 'medium',
        metadata: {
            taskId: task._id.toString(),
            taskTitle: task.title,
            boardId: task.board ? task.board.toString() : null,
            deadline: deadlineIso,
            reminderType,
            recipientEmail: assignee.email || null,
        },
    };
}

async function runDeadlineReminderCycle(authToken = null, now = new Date()) {
    const upperBound = new Date(now.getTime() + (48 * 60 * 60 * 1000));
    const tasks = await Task.find({
        deadline: { $ne: null, $lte: upperBound },
        status: { $ne: 'done' },
        'assignees.0': { $exists: true },
    });

    let notificationsSent = 0;

    for (const task of tasks) {
        const reminderType = resolveReminderType(task.deadline, now);
        if (!reminderType) {
            continue;
        }

        task.notificationDispatches = task.notificationDispatches || [];

        for (const assignee of task.assignees) {
            const key = buildReminderKey(task, assignee.id, reminderType);
            if (hasDispatch(task, key)) {
                continue;
            }

            try {
                await createNotification(buildReminderNotification(task, assignee, reminderType), authToken);
                task.notificationDispatches.push({
                    key,
                    type: reminderType,
                    recipientId: assignee.id,
                    sentAt: new Date(),
                });
                notificationsSent += 1;
            } catch (error) {
                console.error(`Failed to send deadline reminder for task ${task._id}: ${error.message}`);
            }
        }

        await task.save();
    }

    return { scannedTasks: tasks.length, notificationsSent };
}

async function triggerDeadlineReminderForTask(task, authToken = null, now = new Date()) {
    if (!task.deadline || !Array.isArray(task.assignees) || task.assignees.length === 0) {
        return;
    }

    const reminderType = resolveReminderType(task.deadline, now);
    if (!reminderType) {
        return;
    }

    task.notificationDispatches = task.notificationDispatches || [];

    for (const assignee of task.assignees) {
        const key = buildReminderKey(task, assignee.id, reminderType);
        if (hasDispatch(task, key)) {
            continue;
        }

        try {
            await createNotification(buildReminderNotification(task, assignee, reminderType), authToken);
            task.notificationDispatches.push({
                key,
                type: reminderType,
                recipientId: assignee.id,
                sentAt: new Date(),
            });
        } catch (error) {
            console.error(`Failed to send deadline reminder for task ${task._id}: ${error.message}`);
        }
    }

    await task.save();
}

function startDeadlineReminderScheduler(authTokenProvider = () => null) {
    if (schedulerHandle) {
        return schedulerHandle;
    }

    const intervalMs = Number(process.env.DEADLINE_REMINDER_INTERVAL_MS) || 15 * 60 * 1000;
    schedulerHandle = setInterval(async () => {
        try {
            await runDeadlineReminderCycle(authTokenProvider());
        } catch (error) {
            console.error(`Deadline reminder cycle failed: ${error.message}`);
        }
    }, intervalMs);

    return schedulerHandle;
}

function stopDeadlineReminderScheduler() {
    if (schedulerHandle) {
        clearInterval(schedulerHandle);
        schedulerHandle = null;
    }
}

module.exports = {
    REMINDER_TYPES,
    resolveReminderType,
    runDeadlineReminderCycle,
    triggerDeadlineReminderForTask,
    startDeadlineReminderScheduler,
    stopDeadlineReminderScheduler,
};