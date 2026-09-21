const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

/**
 * POST /api/sync/tasks
 * Triggers sync of task data from external service
 */
router.post('/tasks', syncController.triggerSync);

module.exports = router;
