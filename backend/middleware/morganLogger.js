const morgan = require('morgan');
const logger = require('../utils/logger');

// Create a stream object with a 'write' function that will be used by Morgan
const stream = {
  write: (message) => {
    // Remove trailing newline
    logger.info(message.trim());
  },
};

// Skip logging for health checks and static files
const skip = (req, res) => {
  return (
    req.url === '/health' ||
    req.url.startsWith('/static') ||
    req.url.startsWith('/uploads')
  );
};

// Create morgan middleware with custom format
const morganMiddleware = morgan(
  (tokens, req, res) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      contentLength: tokens.res(req, res, 'content-length'),
      responseTime: `${tokens['response-time'](req, res)} ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });
  },
  {
    stream,
    skip,
  }
);

// HTTP request logger (simpler format for console)
const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    skip,
  }
);

module.exports = {
  morganMiddleware,
  httpLogger,
};

