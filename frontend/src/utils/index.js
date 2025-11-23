/**
 * Security Utilities Index
 *
 * Central export point for all security-related utilities
 */

// Sanitization utilities for XSS prevention
export {
  sanitizeHTML,
  sanitizeHTMLStrict,
  sanitizeText,
  sanitizeInput,
  sanitizeURL,
  SafeHTML,
  useSanitizedContent
} from './sanitize';

// Validation schemas and utilities
export {
  emailSchema,
  passwordSchema,
  loginPasswordSchema,
  usernameSchema,
  containerNameSchema,
  imageNameSchema,
  portMappingSchema,
  envVarSchema,
  volumePathSchema,
  networkNameSchema,
  volumeNameSchema,
  urlSchema,
  gitRepoSchema,
  loginFormSchema,
  createContainerSchema,
  createNetworkSchema,
  createVolumeSchema,
  validate,
  validateField,
  useFormValidation
} from './validation';

// Secure token storage
export {
  tokenStorage,
  setupAuthInterceptor
} from './secureStorage';
