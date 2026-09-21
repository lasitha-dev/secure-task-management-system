// Status enums
const TASK_STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'inProgress',
    DONE: 'done'
};

// Period enums
const PERIOD = {
    WEEK: 'week',
    MONTH: 'month',
    CUSTOM: 'custom'
};

// Report status enums
const REPORT_STATUS = {
    PROCESSING: 'processing',
    READY: 'ready'
};

// Mock user names for fake data generation
const MOCK_USERNAMES = [
    'Alice Johnson',
    'Bob Smith',
    'Carol Williams',
    'David Brown',
    'Emma Davis'
];

// Days of the week
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Frequency for generating random tasks in mock mode
const TASK_GENERATION_COUNT = 20;

module.exports = {
    TASK_STATUS,
    PERIOD,
    REPORT_STATUS,
    MOCK_USERNAMES,
    DAYS_OF_WEEK,
    TASK_GENERATION_COUNT
};
