const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const syncRoutes = require('./routes/syncRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { authMiddleware } = require('./middleware/authMiddleware');
const { syncTasksFromExternal } = require('./services/syncService');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5004;

// Connect to Database
connectDB();

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(rateLimiter);
app.use(authMiddleware);

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sync', syncRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'reporting-analytics' });
});

// Auto-sync tasks on startup and schedule periodic sync
if (process.env.NODE_ENV !== 'test') {
    (async () => {
        try {
            await syncTasksFromExternal();
        } catch (error) {
            console.error('Failed to sync on startup:', error.message);
        }
    })();

    // Schedule periodic sync every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('⏳ Running scheduled sync...');
        try {
            await syncTasksFromExternal();
        } catch (error) {
            console.error('Scheduled sync failed:', error.message);
        }
    });
}

// Global Error Handler (must be last)
app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Reporting & Analytics Service running on port ${PORT}`);
    });
}

module.exports = app;
