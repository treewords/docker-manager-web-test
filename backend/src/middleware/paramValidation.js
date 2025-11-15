/**
 * Middleware for validating Docker resource IDs from URL parameters
 */

const { validateContainerId } = require('./validation');

/**
 * Middleware to validate container ID from URL params
 */
const validateContainerIdParam = (req, res, next) => {
  const { id } = req.params;

  try {
    validateContainerId(id);
    next();
  } catch (error) {
    error.status = 400;
    next(error);
  }
};

/**
 * Middleware to validate image/network/volume ID/name from URL params
 * These can be either IDs or names, so we do basic validation
 */
const validateResourceIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    const error = new Error('Resource ID is required');
    error.status = 400;
    return next(error);
  }

  // Basic validation: alphanumeric, hyphens, underscores, dots, colons (for tags)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,255}$/.test(id)) {
    const error = new Error('Invalid resource ID format');
    error.status = 400;
    return next(error);
  }

  next();
};

module.exports = {
  validateContainerIdParam,
  validateResourceIdParam
};
