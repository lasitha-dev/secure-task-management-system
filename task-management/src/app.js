const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const boardRoutes = require('./routes/boardRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { startDeadlineReminderScheduler } = require('./services/deadlineReminderService');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Connect to Database
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Middleware
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/boards', boardRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'task-management' });
});

// Global Error Handler
app.use(errorHandler);

// Only start server if this file is run directly (not during tests)
if (require.main === module) {
    startDeadlineReminderScheduler();
    app.listen(PORT, () => {
        console.log(`Task Management Service running on port ${PORT}`);
    });
}

module.exports = app;
