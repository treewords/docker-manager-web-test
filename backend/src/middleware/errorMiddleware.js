const { logger } = require('../config/logger');

const errorMiddleware = (err, req, res, next) => {
  // Log full error details server-side for debugging
  logger.error(`Error occurred:`, {
    status: err.status || 500,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.username : 'unauthenticated',
  });

  // Determine status code
  const statusCode = err.status || 500;

  // Generic error messages for client to prevent information leakage
  const clientMessage = getClientSafeMessage(statusCode, err);

  res.status(statusCode).json({
    error: {
      message: clientMessage,
      status: statusCode,
    },
  });
};

// Return safe, generic messages to clients while logging details server-side
const getClientSafeMessage = (statusCode, err) => {
  // For client errors (4xx), we can be more specific
  if (statusCode >= 400 && statusCode < 500) {
    // Check if this is a known validation or authentication error
    if (statusCode === 401) return 'Authentication required';
    if (statusCode === 403) return 'Access denied';
    if (statusCode === 404) return 'Resource not found';
    if (statusCode === 429) return 'Too many requests. Please try again later.';

    // For 400 Bad Request, we can pass through the message if it's safe
    // (e.g., validation errors) but sanitize it first
    if (statusCode === 400 && err.message) {
      // Only return message if it doesn't contain system paths or stack traces
      const sanitizedMessage = err.message.replace(/\/[^\s]+/g, '[path]');
      return sanitizedMessage;
    }

    return 'Bad request';
  }

  // For server errors (5xx), always return generic message
  return 'An internal error occurred. Please try again later.';
};

module.exports = errorMiddleware;
