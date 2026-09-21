const syncService = require('../services/syncService');

/**
 * Trigger manual sync of tasks
 */
const triggerSync = async (req, res, next) => {
    try {
        const result = await syncService.syncTasksFromExternal();
        res.status(200).json({ success: result.success, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    triggerSync
};
