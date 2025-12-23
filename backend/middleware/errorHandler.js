const logger = require('../utils/logger');
const { AppError } = require('../errors');

function notFound(req, res, next) {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
}

function errorHandler(err, req, res, next) {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Server error';
  
  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    status = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }
  
  const isOperational = err.isOperational || false;
  
  if (!isOperational) {
    logger.error('Error occurred:', {
      status,
      message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  } else {
    logger.warn('Operational error:', {
      status,
      message,
      method: req.method,
      url: req.originalUrl,
    });
  }
  
  const response = {
    success: false,
    message
  };
  
  if (process.env.NODE_ENV !== 'production' && !isOperational) {
    response.stack = err.stack;
  }
  
  return res.status(status).json(response);
}

module.exports = { notFound, errorHandler };


