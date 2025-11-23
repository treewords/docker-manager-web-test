import { z } from 'zod';

/**
 * Client-side validation schemas using Zod
 * These provide immediate user feedback but server-side validation is the security boundary
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(254, 'Email is too long')
  .regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'Invalid email format'
  );

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Basic password (for login - less strict)
export const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .max(128, 'Password is too long');

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username is too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

// Docker container name validation
export const containerNameSchema = z
  .string()
  .max(128, 'Container name is too long')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/,
    'Container name must start with alphanumeric and can only contain letters, numbers, underscores, periods, and hyphens'
  )
  .optional()
  .or(z.literal(''));

// Docker image name validation
export const imageNameSchema = z
  .string()
  .min(1, 'Image name is required')
  .max(256, 'Image name is too long')
  .regex(
    /^[a-z0-9]+([._-][a-z0-9]+)*(\/[a-z0-9]+([._-][a-z0-9]+)*)*(:[\w][\w.-]{0,127})?$/i,
    'Invalid image name format'
  );

// Port mapping validation (e.g., "8080:80")
export const portMappingSchema = z
  .string()
  .regex(
    /^\d{1,5}:\d{1,5}$/,
    'Port mapping must be in format "host:container" (e.g., 8080:80)'
  )
  .refine(
    (val) => {
      const [host, container] = val.split(':').map(Number);
      return host >= 1 && host <= 65535 && container >= 1 && container <= 65535;
    },
    { message: 'Port numbers must be between 1 and 65535' }
  );

// Environment variable validation (e.g., "KEY=value")
export const envVarSchema = z
  .string()
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*=.+$/,
    'Environment variable must be in format "KEY=value"'
  )
  .refine(
    (val) => {
      const key = val.split('=')[0];
      // Block dangerous environment variables
      const dangerous = [
        'LD_PRELOAD',
        'LD_LIBRARY_PATH',
        'NODE_OPTIONS',
        'BASH_ENV',
        'ENV',
        'PROMPT_COMMAND'
      ];
      return !dangerous.includes(key.toUpperCase());
    },
    { message: 'This environment variable name is not allowed for security reasons' }
  );

// Volume path validation
export const volumePathSchema = z
  .string()
  .min(1, 'Volume path is required')
  .regex(
    /^\/[a-zA-Z0-9_.\/-]*$/,
    'Invalid volume path format'
  )
  .refine(
    (val) => {
      // Block dangerous paths
      const dangerous = ['/etc', '/root', '/proc', '/sys', '/dev', '/boot', '/bin', '/sbin', '/usr'];
      const normalized = val.replace(/\/+/g, '/').replace(/\/$/, '');
      return !dangerous.some(d => normalized === d || normalized.startsWith(d + '/'));
    },
    { message: 'This path is not allowed for security reasons' }
  );

// Network name validation
export const networkNameSchema = z
  .string()
  .min(1, 'Network name is required')
  .max(64, 'Network name is too long')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/,
    'Network name must start with alphanumeric character'
  );

// Volume name validation
export const volumeNameSchema = z
  .string()
  .min(1, 'Volume name is required')
  .max(64, 'Volume name is too long')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/,
    'Volume name must start with alphanumeric character'
  );

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Only HTTP and HTTPS URLs are allowed' }
  );

// Git repository URL validation
export const gitRepoSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && parsed.hostname === 'github.com';
      } catch {
        return false;
      }
    },
    { message: 'Only HTTPS GitHub URLs are allowed' }
  );

// Login form schema
export const loginFormSchema = z.object({
  username: usernameSchema,
  password: loginPasswordSchema
});

// Create container form schema
export const createContainerSchema = z.object({
  image: imageNameSchema,
  name: containerNameSchema,
  ports: z.array(portMappingSchema.or(z.literal(''))).optional(),
  envVars: z.array(envVarSchema.or(z.literal(''))).optional()
});

// Create network form schema
export const createNetworkSchema = z.object({
  name: networkNameSchema,
  driver: z.enum(['bridge', 'host', 'overlay', 'macvlan', 'none']).default('bridge')
});

// Create volume form schema
export const createVolumeSchema = z.object({
  name: volumeNameSchema
});

/**
 * Validate data against a schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {{ isValid: boolean, errors: Object, data: any }}
 */
export function validate(schema, data) {
  try {
    const validData = schema.parse(data);
    return { isValid: true, errors: {}, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, curr) => {
        const path = curr.path.join('.');
        acc[path || 'general'] = curr.message;
        return acc;
      }, {});
      return { isValid: false, errors, data: null };
    }
    return { isValid: false, errors: { general: 'Validation failed' }, data: null };
  }
}

/**
 * Validate a single field
 * @param {z.ZodSchema} schema - Zod schema for the field
 * @param {any} value - Value to validate
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateField(schema, value) {
  try {
    schema.parse(value);
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || 'Invalid value' };
    }
    return { isValid: false, error: 'Validation failed' };
  }
}

/**
 * React hook for form validation
 */
export function useFormValidation(schema) {
  const validateForm = (data) => validate(schema, data);

  const validateSingleField = (fieldSchema, value) => validateField(fieldSchema, value);

  return { validateForm, validateField: validateSingleField };
}

export default {
  // Schemas
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
  // Functions
  validate,
  validateField,
  useFormValidation
};
