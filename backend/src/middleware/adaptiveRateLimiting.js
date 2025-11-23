/**
 * Adaptive Rate Limiting Middleware
 *
 * Implements behavior-based rate limiting that adjusts based on
 * failed authentication attempts and suspicious activity patterns.
 */

const { logger } = require('../config/logger');

/**
 * Adaptive Rate Limiter Class
 * Tracks suspicious IPs and implements exponential backoff
 */
class AdaptiveRateLimiter {
  constructor(options = {}) {
    this.suspiciousIPs = new Map();
    this.options = {
      maxFailedAttempts: options.maxFailedAttempts || 3,
      initialBlockDuration: options.initialBlockDuration || 60 * 1000, // 1 minute
      maxBlockDuration: options.maxBlockDuration || 24 * 60 * 60 * 1000, // 24 hours
      decayTime: options.decayTime || 30 * 60 * 1000, // 30 minutes
      cleanupInterval: options.cleanupInterval || 60 * 60 * 1000, // 1 hour
    };

    // Start periodic cleanup
    this._cleanupInterval = setInterval(
      () => this.cleanup(),
      this.options.cleanupInterval,
    );
  }

  /**
   * Get middleware function
   */
  middleware() {
    return (req, res, next) => {
      const ip = this._getClientIP(req);
      const now = Date.now();

      // Check if IP is currently blocked
      const suspicionData = this.suspiciousIPs.get(ip);

      if (suspicionData) {
        const { blockUntil, failedAttempts } = suspicionData;

        // If blocked, reject request
        if (blockUntil && now < blockUntil) {
          const retryAfter = Math.ceil((blockUntil - now) / 1000);

          logger.warn('Adaptive rate limit: IP blocked', {
            ip,
            failedAttempts,
            retryAfter,
            path: req.path,
          });

          res.set('Retry-After', retryAfter);
          return res.status(429).json({
            error: 'Too many failed attempts',
            message:
              'Your IP has been temporarily blocked due to suspicious activity',
            retryAfter,
          });
        }
      }

      // Wrap response to track failures
      this._wrapResponse(req, res, ip);

      next();
    };
  }

  /**
   * Wrap response methods to track success/failure
   */
  _wrapResponse(req, res, ip) {
    const originalJson = res.json.bind(res);
    const self = this;

    res.json = function (data) {
      // Track authentication failures
      if (res.statusCode === 401 || res.statusCode === 403) {
        self._recordFailure(ip, req);
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        // Successful request - decay suspicion
        self._recordSuccess(ip);
      }

      return originalJson(data);
    };
  }

  /**
   * Record a failed attempt for an IP
   */
  _recordFailure(ip, req) {
    const now = Date.now();
    const current = this.suspiciousIPs.get(ip) || {
      failedAttempts: 0,
      lastFailed: null,
      blockUntil: null,
      firstFailed: now,
    };

    current.failedAttempts += 1;
    current.lastFailed = now;

    // Apply exponential backoff if threshold exceeded
    if (current.failedAttempts >= this.options.maxFailedAttempts) {
      const exponent = current.failedAttempts - this.options.maxFailedAttempts;
      const blockDuration = Math.min(
        this.options.initialBlockDuration * Math.pow(2, exponent),
        this.options.maxBlockDuration,
      );

      current.blockUntil = now + blockDuration;

      logger.warn('Adaptive rate limit: IP blocked due to failures', {
        ip,
        failedAttempts: current.failedAttempts,
        blockDuration: blockDuration / 1000,
        path: req.path,
      });
    }

    this.suspiciousIPs.set(ip, current);
  }

  /**
   * Record a successful request - decay suspicion
   */
  _recordSuccess(ip) {
    const current = this.suspiciousIPs.get(ip);
    if (!current) return;

    // Reduce failed attempts count on success
    current.failedAttempts = Math.max(0, current.failedAttempts - 1);

    // Clear block if no more failed attempts
    if (current.failedAttempts === 0) {
      this.suspiciousIPs.delete(ip);
    } else {
      current.blockUntil = null;
      this.suspiciousIPs.set(ip, current);
    }
  }

  /**
   * Get client IP, respecting proxy headers if trusted
   */
  _getClientIP(req) {
    // If behind a trusted proxy, use forwarded IP
    if (req.app.get('trust proxy')) {
      return req.ip;
    }
    return req.socket?.remoteAddress || req.ip;
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();

    for (const [ip, data] of this.suspiciousIPs.entries()) {
      // Remove entries that haven't had activity for decay time
      // and are not currently blocked
      if (
        data.lastFailed &&
        now - data.lastFailed > this.options.decayTime &&
        (!data.blockUntil || now > data.blockUntil)
      ) {
        this.suspiciousIPs.delete(ip);
      }
    }

    logger.debug('Adaptive rate limiter cleanup completed', {
      remainingEntries: this.suspiciousIPs.size,
    });
  }

  /**
   * Manually block an IP
   */
  blockIP(ip, duration = this.options.maxBlockDuration) {
    this.suspiciousIPs.set(ip, {
      failedAttempts: this.options.maxFailedAttempts,
      lastFailed: Date.now(),
      blockUntil: Date.now() + duration,
      firstFailed: Date.now(),
    });

    logger.info('IP manually blocked', { ip, duration });
  }

  /**
   * Unblock an IP
   */
  unblockIP(ip) {
    this.suspiciousIPs.delete(ip);
    logger.info('IP manually unblocked', { ip });
  }

  /**
   * Get current status for an IP
   */
  getStatus(ip) {
    const data = this.suspiciousIPs.get(ip);
    if (!data) {
      return { tracked: false };
    }

    return {
      tracked: true,
      failedAttempts: data.failedAttempts,
      isBlocked: data.blockUntil && Date.now() < data.blockUntil,
      blockRemaining: data.blockUntil
        ? Math.max(0, data.blockUntil - Date.now())
        : 0,
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }
  }
}

// Create singleton instance
const adaptiveLimiter = new AdaptiveRateLimiter();

// Export middleware and instance
module.exports = {
  AdaptiveRateLimiter,
  adaptiveLimiter,
  adaptiveRateLimitMiddleware: adaptiveLimiter.middleware(),
};
