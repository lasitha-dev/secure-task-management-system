const axios = require('axios');
const jwt = require('jsonwebtoken');
const TasksMirror = require('../models/TasksMirror');

/**
 * Sync tasks from external service (via API Gateway)
 * @returns {Promise<object>} - sync result
 */
const syncTasksFromExternal = async () => {
    try {
        console.log('🔄 Starting task sync...');

        // Fetch tasks via API Gateway (or directly if configured)
        const taskServiceUrl = process.env.TASK_SERVICE_URL || 'http://localhost:5000/api/tasks';
        
        // Generate an internal service token
        const token = jwt.sign(
            { id: 'internal-sync-service', name: 'Sync Service', role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        const response = await axios.get(taskServiceUrl, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // task-management API returns data in the 'tasks' field
        const tasksData = response.data?.tasks || response.data?.data || response.data || [];
        
        if (!Array.isArray(tasksData)) {
            throw new Error('Invalid data format received from task service');
        }

        const tasks = tasksData.map(task => ({
            taskId: task._id || task.taskId,
            title: task.title,
            status: task.status,
            assignedUserId: task.assignedTo?._id || task.assignedTo || 'Unassigned',
            assignedUserName: task.assignedTo?.name || 'Unassigned',
            createdAt: task.createdAt,
            completedAt: task.completedAt || (task.status === 'done' ? task.updatedAt : null)
        }));

        // Clear old data before inserting fresh data
        await TasksMirror.deleteMany({});

        // Upsert tasks to TasksMirror collection
        for (const task of tasks) {
            await TasksMirror.updateOne(
                { taskId: task.taskId },
                { $set: task },
                { upsert: true }
            );
        }

        console.log(`✅ Sync completed: ${tasks.length} tasks upserted`);
        return {
            success: true,
            message: `Synced ${tasks.length} tasks`,
            count: tasks.length
        };
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        return {
            success: false,
            message: error.message
        };
    }
};

module.exports = {
    syncTasksFromExternal
};
