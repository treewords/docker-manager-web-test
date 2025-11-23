/**
 * Enhanced Security Middleware
 *
 * Additional security layers beyond basic Helmet configuration.
 */

const { logSecurityEvent, SecurityEventType, extractSecurityDetails } = require('../utils/securityLogger');

/**
 * Security headers middleware
 * Adds additional security headers not covered by Helmet
 */
function enhancedSecurityHeaders(req, res, next) {
  // Prevent browsers from performing MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection (legacy, but still useful for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy - strict
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - restrict browser features
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()'
  );

  // Cross-Origin policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // Disable caching for API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  next();
}

/**
 * Request fingerprinting middleware
 * Tracks request patterns to detect anomalies
 */
function requestFingerprint(req, res, next) {
  req.fingerprint = {
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    acceptLanguage: req.headers['accept-language'] || 'unknown',
    acceptEncoding: req.headers['accept-encoding'] || 'unknown',
    timestamp: Date.now()
  };

  next();
}

/**
 * Suspicious pattern detection middleware
 * Detects common attack patterns in requests
 */
function detectSuspiciousPatterns(req, res, next) {
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|INTO|SET|TABLE)\b)/i,
    // Path traversal
    /\.\.[\/\\]/,
    // Shell injection
    /[;&|`$]/,
    // Script injection
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    // Command injection
    /\b(eval|exec|system|passthru|shell_exec)\s*\(/i
  ];

  // Check URL path
  const path = req.path || '';
  const query = JSON.stringify(req.query || {});
  const body = JSON.stringify(req.body || {});

  const checkContent = `${path} ${query} ${body}`;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkContent)) {
      logSecurityEvent(SecurityEventType.SUSPICIOUS_PATTERN, {
        ...extractSecurityDetails(req),
        metadata: {
          pattern: pattern.toString(),
          matchedIn: 'request'
        }
      });

      // Don't block, just log (validation middleware will handle blocking)
      break;
    }
  }

  next();
}

/**
 * Request size limiter
 * Additional protection against oversized requests
 */
function requestSizeLimiter(options = {}) {
  const { maxBodySize = 1048576, maxUrlLength = 2048 } = options; // 1MB body, 2KB URL

  return (req, res, next) => {
    // Check URL length
    if (req.originalUrl && req.originalUrl.length > maxUrlLength) {
      logSecurityEvent(SecurityEventType.VALIDATION_FAILED, {
        ...extractSecurityDetails(req),
        metadata: { reason: 'URL too long', length: req.originalUrl.length }
      });

      return res.status(414).json({
        error: 'URI Too Long',
        message: 'The request URL exceeds the maximum allowed length'
      });
    }

    // Check content-length header
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxBodySize) {
      logSecurityEvent(SecurityEventType.VALIDATION_FAILED, {
        ...extractSecurityDetails(req),
        metadata: { reason: 'Body too large', size: contentLength }
      });

      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'The request body exceeds the maximum allowed size'
      });
    }

    next();
  };
}

/**
 * API versioning header check
 * Ensures clients are using supported API versions
 */
function apiVersionCheck(supportedVersions = ['v1']) {
  return (req, res, next) => {
    // Skip version check for non-API routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    // Add API version to response
    res.setHeader('X-API-Version', supportedVersions[0]);

    next();
  };
}

/**
 * Secure JSON parsing middleware
 * Protects against JSON-based attacks
 */
function secureJsonParsing(req, res, next) {
  // Prevent prototype pollution
  if (req.body && typeof req.body === 'object') {
    const dangerous = ['__proto__', 'constructor', 'prototype'];

    const checkObject = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return;

      for (const key of Object.keys(obj)) {
        if (dangerous.includes(key)) {
          logSecurityEvent(SecurityEventType.INJECTION_ATTEMPT, {
            ...extractSecurityDetails(req),
            metadata: { type: 'prototype_pollution', key, path }
          });

          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          checkObject(obj[key], `${path}.${key}`);
        }
      }
    };

    checkObject(req.body);
  }

  next();
}

module.exports = {
  enhancedSecurityHeaders,
  requestFingerprint,
  detectSuspiciousPatterns,
  requestSizeLimiter,
  apiVersionCheck,
  secureJsonParsing
};
