const logger = require('../utils/logger');

function notFound(req, res, next) {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  res.status(404).json({ message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Server error';
  
  // Log error details
  logger.error('Error occurred:', {
    status,
    message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  if (process.env.NODE_ENV !== 'production') {
    // minimal debug info in non-prod
    return res.status(status).json({ message, stack: err.stack });
  }
  return res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };


