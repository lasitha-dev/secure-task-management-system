const { validationResult } = require('express-validator');
const taskService = require('../services/taskService');
const { getAllUsers, searchUsers } = require('../services/userService');

// ─── Helper ────────────────────────────────────────────────────────────────────
function handleValidationErrors(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null;
}

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
const getAllTasks = async (req, res) => {
    try {
        const { status, priority, assignedTo, project, sprint, board } = req.query;
        const filters = {};

        if (status)     filters.status     = status;
        if (priority)   filters.priority   = priority;
        if (assignedTo) filters.assignedTo = assignedTo;
        if (project)    filters.project    = project;
        if (sprint)     filters.sprint     = sprint;
        if (board)      filters.board      = board;

        const tasks = await taskService.getAllTasks(filters);

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
const getTaskById = async (req, res) => {
    try {
        const task = await taskService.getTaskById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        res.status(200).json({ success: true, task });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'Invalid task ID.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
const createTask = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    try {
        const authToken = req.headers.authorization?.split(' ')[1] || null;
        const { title, description, status, priority, deadline, assignees, progress, tags, project, sprint, estimatedHours, board } = req.body;

        const task = await taskService.createTask(
            {
                title,
                description,
                status,
                priority,
                deadline: deadline || null,
                assignees: assignees || [],
                progress: progress || 0,
                tags: tags || [],
                board: board || null,
                project: project || 'General',
                sprint: sprint || null,
                estimatedHours: estimatedHours || null,
            },
            req.user,
            authToken,
        );

        res.status(201).json({ success: true, message: 'Task created successfully.', task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
const updateTask = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    try {
        const authToken = req.headers.authorization?.split(' ')[1] || null;
        const task = await taskService.updateTask(req.params.id, req.body, req.user, authToken);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        res.status(200).json({ success: true, message: 'Task updated successfully.', task });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'Invalid task ID.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
// Used by drag-and-drop to update status only (or any partial update)
const patchTask = async (req, res) => {
    try {
        const authToken = req.headers.authorization?.split(' ')[1] || null;
        const task = await taskService.patchTask(req.params.id, req.body, req.user, authToken);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        res.status(200).json({ success: true, message: 'Task patched successfully.', task });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'Invalid task ID.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
    try {
        const task = await taskService.deleteTask(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        res.status(200).json({ success: true, message: 'Task deleted successfully.' });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'Invalid task ID.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/tasks/stats ─────────────────────────────────────────────────────
const getTaskStats = async (req, res) => {
    try {
        const stats = await taskService.getTaskStats(req.query);
        res.status(200).json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/tasks/users ────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || null;
        const users = await getAllUsers(token);
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/tasks/users/search?q= ───────────────────────────────────────────────────
const searchUsersHandler = async (req, res) => {
    try {
        const { q = '', limit } = req.query;
        const token = req.headers.authorization?.split(' ')[1] || null;
        const users = await searchUsers(q, limit ? parseInt(limit, 10) : 10, token);
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/tasks/:id/assignees ───────────────────────────────────────────────────
const addAssignee = async (req, res) => {
    try {
        const authToken = req.headers.authorization?.split(' ')[1] || null;
        const { id: assigneeId, name, email, role, avatar } = req.body;
        if (!assigneeId || !name) {
            return res.status(400).json({ success: false, message: 'assignee id and name are required.' });
        }
        const task = await taskService.addAssignee(
            req.params.id,
            { id: assigneeId, name, email: email || '', role: role || 'member', avatar: avatar || '' },
            req.user,
            authToken,
        );
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        res.status(200).json({ success: true, message: 'Assignee added.', task });
    } catch (error) {
        if (error.kind === 'ObjectId' || error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid task ID.' });
        }
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

// ─── DELETE /api/tasks/:id/assignees/:userId ────────────────────────────────────────
const removeAssignee = async (req, res) => {
    try {
        const task = await taskService.removeAssignee(req.params.id, req.params.userId, req.user);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        res.status(200).json({ success: true, message: 'Assignee removed.', task });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/tasks/:id/comments ───────────────────────────────────────────────────
const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, message: 'Comment text is required.' });
        }
        const task = await taskService.addComment(req.params.id, text.trim(), req.user);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        res.status(201).json({ success: true, message: 'Comment added.', task });
    } catch (error) {
        if (error.kind === 'ObjectId' || error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid task ID.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DELETE /api/tasks/:id/comments/:commentId ───────────────────────────────────────
const deleteComment = async (req, res) => {
    try {
        const task = await taskService.deleteComment(req.params.id, req.params.commentId, req.user);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        res.status(200).json({ success: true, message: 'Comment deleted.', task });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/tasks/:id/time-logs ──────────────────────────────────────────────────
const logTime = async (req, res) => {
    try {
        const { hours, note } = req.body;
        if (!hours || isNaN(hours) || Number(hours) <= 0) {
            return res.status(400).json({ success: false, message: 'hours must be a positive number.' });
        }
        const task = await taskService.logTime(req.params.id, Number(hours), note || '', req.user);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        res.status(201).json({ success: true, message: 'Time logged.', task });
    } catch (error) {
        if (error.kind === 'ObjectId' || error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid task ID.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    patchTask,
    deleteTask,
    getTaskStats,
    getUsers,
    searchUsersHandler,
    addAssignee,
    removeAssignee,
    addComment,
    deleteComment,
    logTime,
};
