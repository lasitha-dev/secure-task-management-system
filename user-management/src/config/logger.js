const winston = require('winston');

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json, errors } = format;

// Custom format for development: colorized, human-readable
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, path, method, statusCode }) => {
    let log = `[${timestamp}] ${level}: ${message}`;
    if (statusCode) log += ` | Status: ${statusCode}`;
    if (method && path) log += ` | ${method} ${path}`;
    if (stack) log += `\n${stack}`;
    return log;
  })
);

// Structured JSON format for production
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [new transports.Console()],
  exitOnError: false,
});

module.exports = logger;
