/**
 * CSRF Protection Middleware
 *
 * Implements double-submit cookie pattern for CSRF protection.
 * The token is sent both as a cookie and must be included in request headers.
 */

const crypto = require('crypto');
const { logger } = require('../config/logger');

// In-memory store for CSRF tokens (in production, consider Redis)
const tokenStore = new Map();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a cryptographically secure CSRF token
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Clean up expired tokens periodically
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (now - data.created > TOKEN_EXPIRY) {
      tokenStore.delete(token);
    }
  }
}

// Run cleanup every 15 minutes
setInterval(cleanupExpiredTokens, 15 * 60 * 1000);

/**
 * CSRF protection middleware
 * Validates that the CSRF token in the header matches the cookie
 */
function csrfProtection(req, res, next) {
  // Skip CSRF for safe (read-only) methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get token from cookie and header
  const cookieToken = req.cookies?.['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];

  // Validate tokens exist and match
  if (!cookieToken || !headerToken) {
    logger.warn('CSRF validation failed: Missing token', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken
    });

    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Please refresh the page and try again'
    });
  }

  if (cookieToken !== headerToken) {
    logger.warn('CSRF validation failed: Token mismatch', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });

    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Please refresh the page and try again'
    });
  }

  // Validate token is in our store and not expired
  const tokenData = tokenStore.get(cookieToken);
  if (!tokenData || Date.now() - tokenData.created > TOKEN_EXPIRY) {
    logger.warn('CSRF validation failed: Token expired or invalid', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });

    return res.status(403).json({
      error: 'CSRF token expired',
      message: 'Please refresh the page and try again'
    });
  }

  next();
}

/**
 * Endpoint handler to set/refresh CSRF token
 */
function setCSRFToken(req, res) {
  const token = generateCSRFToken();

  // Store token with creation timestamp
  tokenStore.set(token, {
    created: Date.now(),
    ip: req.ip
  });

  // Set cookie (readable by JavaScript for header inclusion)
  res.cookie('csrf-token', token, {
    httpOnly: false, // Client needs to read this for header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY,
    path: '/'
  });

  res.json({ csrfToken: token });
}

/**
 * Middleware to ensure CSRF token exists (sets one if not present)
 */
function ensureCSRFToken(req, res, next) {
  if (!req.cookies?.['csrf-token']) {
    const token = generateCSRFToken();
    tokenStore.set(token, {
      created: Date.now(),
      ip: req.ip
    });

    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY,
      path: '/'
    });
  }
  next();
}

module.exports = {
  csrfProtection,
  setCSRFToken,
  ensureCSRFToken,
  generateCSRFToken
};
