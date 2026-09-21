const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const configurePassport = require('./config/passport');
const userRoutes = require('./routes/userRoutes');
const { errorHandler } = require('./middleware/errorHandler');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// HTTP request logging via morgan, piped to winston
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// Passport initialization (stateless JWT — no sessions)
configurePassport();
app.use(passport.initialize());

// Routes
app.use('/api/users', userRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'user-management' });
});

// Global Error Handler
app.use(errorHandler);

// Only start server and connect to DB when not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  app.listen(PORT, () => {
    logger.info(`User Management Service running on port ${PORT}`);
  });
}

module.exports = app;
