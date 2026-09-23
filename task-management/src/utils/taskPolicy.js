/**
 * TaskPolicy
 * -----------------------------------------------------------------------------
 * Enforces Object-Level Authorization (IDOR/BOLA mitigation) for tasks.
 *
 * Rules:
 *  - Admins (user.role === 'Admin' or 'admin') can perform any action.
 *  - Reporters (task.reporter.id) can update and delete.
 *  - Assignees (task.assignees[].id) can update, but cannot delete.
 *  - Other users are denied (return false).
 * -----------------------------------------------------------------------------
 */
class TaskPolicy {
    /**
     * Determine if a user is permitted to update a task.
     *
     * @param {Object} user - The authenticated user object (e.g. req.user).
     * @param {Object} task - The Mongoose Task document or plain task object.
     * @returns {boolean} True if update is allowed, false otherwise.
     */
    static canUpdate(user, task) {
        if (!user || !task) {
            return false;
        }

        // Admins (user.role === 'Admin') can do anything
        if (user.role === 'Admin' || String(user.role).toLowerCase() === 'admin') {
            return true;
        }

        const userId = String(user.id || user._id || '');
        if (!userId) {
            return false;
        }

        // Reporters can update
        const reporterId = task.reporter ? String(task.reporter.id || task.reporter._id || '') : '';
        if (reporterId && reporterId === userId) {
            return true;
        }

        // Assignees can update
        if (Array.isArray(task.assignees)) {
            const isAssignee = task.assignees.some((assignee) => {
                const assigneeId = String(assignee?.id || assignee?._id || '');
                return assigneeId === userId;
            });
            if (isAssignee) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if a user is permitted to delete a task.
     *
     * @param {Object} user - The authenticated user object (e.g. req.user).
     * @param {Object} task - The Mongoose Task document or plain task object.
     * @returns {boolean} True if delete is allowed, false otherwise.
     */
    static canDelete(user, task) {
        if (!user || !task) {
            return false;
        }

        // Admins (user.role === 'Admin') can do anything
        if (user.role === 'Admin' || String(user.role).toLowerCase() === 'admin') {
            return true;
        }

        const userId = String(user.id || user._id || '');
        if (!userId) {
            return false;
        }

        // Reporters can delete
        const reporterId = task.reporter ? String(task.reporter.id || task.reporter._id || '') : '';
        if (reporterId && reporterId === userId) {
            return true;
        }

        // Assignees cannot delete (only reporters and admins can delete)
        return false;
    }

    // Instance method wrappers for flexibility
    canUpdate(user, task) {
        return TaskPolicy.canUpdate(user, task);
    }

    canDelete(user, task) {
        return TaskPolicy.canDelete(user, task);
    }
}

module.exports = TaskPolicy;
