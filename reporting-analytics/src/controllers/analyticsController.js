const analyticsService = require('../services/analyticsService');
const TasksMirror = require('../models/TasksMirror');

/**
 * Get summary statistics
 */
const getSummary = async (req, res, next) => {
    try {
        const { period = 'week' } = req.query;
        const summary = await analyticsService.getSummary(period);
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
};

/**
 * Get weekly data
 */
const getWeeklyData = async (req, res, next) => {
    try {
        const weeklyData = await analyticsService.getWeeklyData();
        res.status(200).json({ success: true, data: weeklyData });
    } catch (error) {
        next(error);
    }
};

/**
 * Get status breakdown
 */
const getStatusBreakdown = async (req, res, next) => {
    try {
        const breakdown = await analyticsService.getStatusBreakdown();
        res.status(200).json({ success: true, data: breakdown });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user breakdown
 */
const getUserBreakdown = async (req, res, next) => {
    try {
        const userBreakdown = await analyticsService.getUserBreakdown();
        res.status(200).json({ success: true, data: userBreakdown });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user's personal stats
 */
const getMyStats = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const userName = req.user.userName;
        
        const myTasks = await TasksMirror.find({ assignedUserId: userId });
        const myCompleted = myTasks.filter(t => t.status === 'done').length;
        const myTotal = myTasks.length;
        const myProductivity = myTotal > 0 ? ((myCompleted / myTotal) * 100).toFixed(1) : 0;
        
        res.json({
            success: true,
            data: {
                userId,
                userName,
                totalTasks: myTotal,
                completedTasks: myCompleted,
                productivity: myProductivity,
                tasks: myTasks
            }
        });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getSummary,
    getWeeklyData,
    getStatusBreakdown,
    getUserBreakdown,
    getMyStats
};
