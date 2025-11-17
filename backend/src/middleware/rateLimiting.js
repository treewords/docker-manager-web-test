/**
 * Rate limiting middleware for Docker operations
 * Prevents abuse and DoS attacks on resource-intensive endpoints
 */

const rateLimit = require('express-rate-limit');

// Standard rate limiter for general Docker operations
const dockerOperationsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many Docker operations. Please try again in a minute.',
  skipSuccessfulRequests: false,
});

// Stricter rate limiter for resource-intensive operations (pull, build, create)
const resourceIntensiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message:
    'Too many resource-intensive operations. Please try again in a few minutes.',
  skipSuccessfulRequests: false,
});

// Very strict rate limiter for image builds (most resource-intensive)
const imageBuildLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 builds per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many image build requests. Please try again in 15 minutes.',
  skipSuccessfulRequests: false,
});

// Rate limiter for container creation
const containerCreateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 container creations per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message:
    'Too many container creation requests. Please try again in a few minutes.',
  skipSuccessfulRequests: false,
});

// Rate limiter for image pulls
const imagePullLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 pulls per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many image pull requests. Please try again in a few minutes.',
  skipSuccessfulRequests: false,
});

module.exports = {
  dockerOperationsLimiter,
  resourceIntensiveLimiter,
  imageBuildLimiter,
  containerCreateLimiter,
  imagePullLimiter,
};
