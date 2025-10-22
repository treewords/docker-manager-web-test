const logger = require('../utils/logger');

const logAction = (username, action, details) => {
  logger.info({
    level: 'audit',
    message: `User '${username}' performed action '${action}'`,
    username,
    action,
    details,
    timestamp: new Date().toISOString()
  });
};

const auditMiddleware = (req, res, next) => {
  // This is a simple example. A more complex middleware could be developed
  // to automatically log actions based on route and method.
  // For now, we'll use the logAction function manually in the routes.
  next();
};

module.exports = {
  auditMiddleware,
  logAction
};
