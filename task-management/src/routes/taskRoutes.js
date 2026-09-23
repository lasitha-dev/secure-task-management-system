const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const {
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
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// ─── Validation rules ──────────────────────────────────────────────────────────
const getTasksQueryValidation = [
    query('status')
        .optional()
        .isIn(['todo', 'in_progress', 'completed', 'blocked', 'done'])
        .withMessage('Invalid status. Allowed values: todo, in_progress, completed, blocked, done'),
    query('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority. Allowed values: low, medium, high, urgent'),
    query('project')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Project must be between 1 and 100 characters'),
    query('board')
        .optional()
        .isMongoId()
        .withMessage('Board ID must be a valid MongoDB ObjectId'),
    query('sprint')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Sprint name must not exceed 100 characters'),
    query('assignedTo')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage('AssignedTo must not exceed 100 characters'),
];

const createTaskValidation = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('progress')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
];

const updateTaskValidation = [
    body('title')
        .optional()
        .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('progress')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
];

// ─── Routes ────────────────────────────────────────────────────────────────────

// Stats & Users (specific routes before :id to avoid conflicts)
router.get('/stats',               protect, getTasksQueryValidation, getTaskStats);
router.get('/users',               protect, getUsers);
router.get('/users/search',        protect, searchUsersHandler);

// CRUD
router.get('/',                    protect, getTasksQueryValidation, getAllTasks);
router.post('/',                   protect, createTaskValidation, createTask);
router.get('/:id',                 protect, getTaskById);
router.put('/:id',                 protect, updateTaskValidation, updateTask);
router.patch('/:id',               protect, updateTaskValidation, patchTask);
router.delete('/:id',              protect, deleteTask);

// Assignees
router.post('/:id/assignees',                  protect, addAssignee);
router.delete('/:id/assignees/:userId',        protect, removeAssignee);

// Comments
router.post('/:id/comments',                   protect, addComment);
router.delete('/:id/comments/:commentId',      protect, deleteComment);

// Time logging
router.post('/:id/time-logs',                  protect, logTime);

module.exports = router;

module.exports = router;
