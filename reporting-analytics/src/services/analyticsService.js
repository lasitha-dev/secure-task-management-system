const TasksMirror = require('../models/TasksMirror');
const { TASK_STATUS, DAYS_OF_WEEK } = require('../utils/constants');
const {
    getDateRangeForPeriod,
    getPreviousPeriodDateRange,
    calculatePercentageChange,
    getDayName
} = require('../utils/helpers');

/**
 * Get summary statistics for a given period
 * @param {string} period - 'week' or 'month'
 * @returns {Promise<object>} - summary statistics
 */
const getSummary = async (period = 'week') => {
    try {
        // For current implementation, focus on current week
        // Calculate current week Monday to Sunday
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Calculate previous week
        const prevSunday = new Date(monday);
        prevSunday.setDate(monday.getDate() - 1);
        prevSunday.setHours(23, 59, 59, 999);
        const prevMonday = new Date(prevSunday);
        prevMonday.setDate(prevSunday.getDate() - 6);
        prevMonday.setHours(0, 0, 0, 0);

        // Current week stats
        const totalTasksCurrent = await TasksMirror.countDocuments({
            createdAt: { $gte: monday, $lte: sunday }
        });

        const completedTasksCurrent = await TasksMirror.countDocuments({
            status: TASK_STATUS.DONE,
            completedAt: { $gte: monday, $lte: sunday }
        });

        const productivityCurrent = totalTasksCurrent > 0 
            ? ((completedTasksCurrent / totalTasksCurrent) * 100).toFixed(2)
            : 0;

        // Previous week stats
        const totalTasksPrevious = await TasksMirror.countDocuments({
            createdAt: { $gte: prevMonday, $lte: prevSunday }
        });

        const completedTasksPrevious = await TasksMirror.countDocuments({
            status: TASK_STATUS.DONE,
            completedAt: { $gte: prevMonday, $lte: prevSunday }
        });

        const productivityPrevious = totalTasksPrevious > 0
            ? ((completedTasksPrevious / totalTasksPrevious) * 100)
            : 0;

        return {
            totalTasks: totalTasksCurrent,
            completedTasks: completedTasksCurrent,
            productivity: parseFloat(productivityCurrent),
            totalChange: calculatePercentageChange(totalTasksCurrent, totalTasksPrevious),
            completedChange: calculatePercentageChange(completedTasksCurrent, completedTasksPrevious),
            productivityChange: calculatePercentageChange(parseFloat(productivityCurrent), productivityPrevious)
        };
    } catch (error) {
        console.error('Error getting summary:', error);
        throw error;
    }
};

/**
 * Get weekly data - completed tasks by day of week
 * @returns {Promise<Array>} - array of daily task counts
 */
const getWeeklyData = async () => {
    try {
        // Calculate current week Monday to Sunday
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Get all tasks completed in the week
        const completedTasks = await TasksMirror.find({
            status: 'done',
            completedAt: { $gte: monday, $lte: sunday }
        });

        // Initialize day data
        const dayData = {};
        DAYS_OF_WEEK.forEach(day => {
            dayData[day] = 0;
        });

        // Count by day
        completedTasks.forEach(task => {
            const day = getDayName(new Date(task.completedAt));
            dayData[day]++;
        });

        // Format as array
        return DAYS_OF_WEEK.map(day => ({
            day: day.substring(0, 3),
            completed: dayData[day]
        }));
    } catch (error) {
        console.error('Error getting weekly data:', error);
        throw error;
    }
};

/**
 * Get task status breakdown
 * @returns {Promise<object>} - status breakdown with percentages
 */
const getStatusBreakdown = async () => {
    try {
        const completedCount = await TasksMirror.countDocuments({ status: TASK_STATUS.DONE });
        const inProgressCount = await TasksMirror.countDocuments({ status: TASK_STATUS.IN_PROGRESS });
        const todoCount = await TasksMirror.countDocuments({ status: TASK_STATUS.TODO });
        const total = completedCount + inProgressCount + todoCount;

        return {
            completed: {
                count: completedCount,
                percentage: total > 0 ? ((completedCount / total) * 100).toFixed(2) : 0
            },
            inProgress: {
                count: inProgressCount,
                percentage: total > 0 ? ((inProgressCount / total) * 100).toFixed(2) : 0
            },
            pending: {
                count: todoCount,
                percentage: total > 0 ? ((todoCount / total) * 100).toFixed(2) : 0
            },
            total
        };
    } catch (error) {
        console.error('Error getting status breakdown:', error);
        throw error;
    }
};

/**
 * Get user breakdown - productivity per user
 * @param {string} userId - optional user ID to filter for specific user
 * @returns {Promise<Array>} - array of user productivity stats
 */
const getUserBreakdown = async (userId = null) => {
    try {
        const matchStage = userId ? { assignedUserId: userId } : {};
        
        const userStats = await TasksMirror.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$assignedUserId',
                    userName: { $first: '$assignedUserName' },
                    totalTasks: { $sum: 1 },
                    completedTasks: {
                        $sum: {
                            $cond: [{ $eq: ['$status', TASK_STATUS.DONE] }, 1, 0]
                        }
                    }
                }
            },
            {
                $sort: { totalTasks: -1 }
            }
        ]);

        return userStats.map(user => ({
            userId: user._id,
            userName: user.userName,
            totalTasks: user.totalTasks,
            completedTasks: user.completedTasks,
            completionRate: user.totalTasks > 0 
                ? ((user.completedTasks / user.totalTasks) * 100).toFixed(2)
                : 0
        }));
    } catch (error) {
        console.error('Error getting user breakdown:', error);
        throw error;
    }
};

module.exports = {
    getSummary,
    getWeeklyData,
    getStatusBreakdown,
    getUserBreakdown
};
