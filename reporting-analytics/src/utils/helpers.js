const { DAYS_OF_WEEK } = require('./constants');

/**
 * Get the date range for a given period
 * @param {string} period - 'week' or 'month'
 * @returns {object} - { startDate, endDate }
 */
const getDateRangeForPeriod = (period) => {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date(now);

    if (period === 'week') {
        const currentDay = startDate.getDay();
        const firstDayOfWeek = startDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        startDate.setDate(firstDayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
};

/**
 * Get previous period date range
 * @param {string} period - 'week' or 'month'
 * @returns {object} - { startDate, endDate }
 */
const getPreviousPeriodDateRange = (period) => {
    const now = new Date();
    const prevStart = new Date();
    const prevEnd = new Date();

    if (period === 'week') {
        // Get last week's date range
        const currentDay = prevStart.getDay();
        const firstDayOfWeek = prevStart.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        prevStart.setDate(firstDayOfWeek - 7);
        prevStart.setHours(0, 0, 0, 0);
        prevEnd.setDate(firstDayOfWeek - 1);
        prevEnd.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
        // Get last month's date range
        prevStart.setMonth(prevStart.getMonth() - 1);
        prevStart.setDate(1);
        prevStart.setHours(0, 0, 0, 0);
        prevEnd.setDate(0);
        prevEnd.setHours(23, 59, 59, 999);
    }

    return { startDate: prevStart, endDate: prevEnd };
};

/**
 * Calculate percentage change
 * @param {number} current - current value
 * @param {number} previous - previous value
 * @returns {number} - percentage change
 */
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
};

/**
 * Generate a random date within the last 30 days
 * @returns {Date}
 */
const getRandomDate = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
};

/**
 * Get day of week from date
 * @param {Date} date
 * @returns {string} - day name
 */
const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
};

/**
 * Check if period is valid
 * @param {string} period
 * @returns {boolean}
 */
const isValidPeriod = (period) => {
    return ['week', 'month', 'custom'].includes(period);
};

module.exports = {
    getDateRangeForPeriod,
    getPreviousPeriodDateRange,
    calculatePercentageChange,
    getRandomDate,
    getDayName,
    isValidPeriod
};
