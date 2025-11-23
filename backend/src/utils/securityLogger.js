/**
 * Security Event Logger
 *
 * Dedicated logging for security-related events to enable
 * monitoring, alerting, and forensic analysis.
 */

const { logger } = require('../config/logger');

/**
 * Security event types
 */
const SecurityEventType = {
  // Authentication events
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILURE: 'auth.login.failure',
  LOGOUT: 'auth.logout',
  TOKEN_REFRESH: 'auth.token.refresh',
  TOKEN_EXPIRED: 'auth.token.expired',
  TOKEN_INVALID: 'auth.token.invalid',

  // Authorization events
  ACCESS_DENIED: 'authz.access.denied',
  PRIVILEGE_ESCALATION_ATTEMPT: 'authz.privilege.escalation',

  // Rate limiting events
  RATE_LIMIT_EXCEEDED: 'rate.limit.exceeded',
  ADAPTIVE_BLOCK: 'rate.adaptive.block',

  // CSRF events
  CSRF_VALIDATION_FAILED: 'csrf.validation.failed',
  CSRF_TOKEN_EXPIRED: 'csrf.token.expired',

  // Input validation events
  VALIDATION_FAILED: 'input.validation.failed',
  INJECTION_ATTEMPT: 'input.injection.attempt',
  PATH_TRAVERSAL_ATTEMPT: 'input.path.traversal',

  // Session events
  SESSION_CREATED: 'session.created',
  SESSION_DESTROYED: 'session.destroyed',
  SESSION_TIMEOUT: 'session.timeout',

  // Suspicious activity
  SUSPICIOUS_PATTERN: 'suspicious.pattern',
  BRUTE_FORCE_DETECTED: 'suspicious.brute_force',

  // Docker security events
  DANGEROUS_OPERATION_BLOCKED: 'docker.dangerous.blocked',
  EXEC_ATTEMPT_BLOCKED: 'docker.exec.blocked',
  PRIVILEGED_CONTAINER_DETECTED: 'docker.privileged.detected',
};

/**
 * Log a security event
 *
 * @param {string} eventType - Type of security event (use SecurityEventType)
 * @param {Object} details - Event details
 * @param {string} details.ip - Client IP address
 * @param {string} [details.userId] - User ID if authenticated
 * @param {string} [details.username] - Username if available
 * @param {string} [details.path] - Request path
 * @param {string} [details.method] - HTTP method
 * @param {string} [details.userAgent] - User agent string
 * @param {Object} [details.metadata] - Additional metadata
 */
function logSecurityEvent(eventType, details = {}) {
  const {
    ip,
    userId,
    username,
    path,
    method,
    userAgent,
    metadata = {},
  } = details;

  // Determine severity based on event type
  const severity = getSeverity(eventType);

  const logData = {
    type: 'security_event',
    event: eventType,
    severity,
    timestamp: new Date().toISOString(),
    ip: sanitizeIP(ip),
    userId: userId || null,
    username: sanitizeUsername(username),
    path: sanitizePath(path),
    method: method || null,
    userAgent: truncate(userAgent, 200),
    metadata: sanitizeMetadata(metadata),
  };

  // Log at appropriate level
  switch (severity) {
    case 'critical':
    case 'high':
      logger.error(logData);
      break;
    case 'medium':
      logger.warn(logData);
      break;
    default:
      logger.info(logData);
  }

  return logData;
}

/**
 * Get severity level for an event type
 */
function getSeverity(eventType) {
  const criticalEvents = [
    SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT,
    SecurityEventType.INJECTION_ATTEMPT,
    SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
    SecurityEventType.BRUTE_FORCE_DETECTED,
  ];

  const highEvents = [
    SecurityEventType.ACCESS_DENIED,
    SecurityEventType.ADAPTIVE_BLOCK,
    SecurityEventType.DANGEROUS_OPERATION_BLOCKED,
    SecurityEventType.EXEC_ATTEMPT_BLOCKED,
  ];

  const mediumEvents = [
    SecurityEventType.LOGIN_FAILURE,
    SecurityEventType.TOKEN_INVALID,
    SecurityEventType.CSRF_VALIDATION_FAILED,
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecurityEventType.VALIDATION_FAILED,
    SecurityEventType.SUSPICIOUS_PATTERN,
  ];

  if (criticalEvents.includes(eventType)) return 'critical';
  if (highEvents.includes(eventType)) return 'high';
  if (mediumEvents.includes(eventType)) return 'medium';
  return 'low';
}

/**
 * Sanitize IP address (remove potential injection)
 */
function sanitizeIP(ip) {
  if (!ip || typeof ip !== 'string') return null;
  // Only allow valid IP characters
  return ip.replace(/[^0-9a-fA-F.:]/g, '').substring(0, 45);
}

/**
 * Sanitize username for logging
 */
function sanitizeUsername(username) {
  if (!username || typeof username !== 'string') return null;
  // Limit length and remove control characters
  return username.replace(/[\x00-\x1F\x7F]/g, '').substring(0, 50);
}

/**
 * Sanitize path for logging
 */
function sanitizePath(path) {
  if (!path || typeof path !== 'string') return null;
  // Remove query params that might contain sensitive data
  return path.split('?')[0].substring(0, 200);
}

/**
 * Sanitize metadata - remove sensitive fields
 */
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
  ];
  const sanitized = { ...metadata };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Truncate string to max length
 */
function truncate(str, maxLength) {
  if (!str || typeof str !== 'string') return null;
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

/**
 * Express middleware to extract common security log details from request
 */
function extractSecurityDetails(req) {
  return {
    ip: req.ip,
    userId: req.user?.id,
    username: req.user?.username,
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
  };
}

module.exports = {
  SecurityEventType,
  logSecurityEvent,
  extractSecurityDetails,
};
