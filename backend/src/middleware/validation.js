/**
 * Input validation middleware for Docker operations
 * Prevents injection attacks and ensures data integrity
 */

const path = require('path');

// ============================================================================
// VALIDATION RULES
// ============================================================================

// Docker name validation (container, network, volume names)
const DOCKER_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,254}$/;

// Docker image name validation (registry/repo:tag format)
const DOCKER_IMAGE_REGEX = /^([a-z0-9]+(?:[._-][a-z0-9]+)*(?::[0-9]+)?\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[a-zA-Z0-9_.-]+)?$/;

// Container ID validation (12 or 64 character hex string)
const CONTAINER_ID_REGEX = /^[a-f0-9]{12}$|^[a-f0-9]{64}$/;

// Port validation (1-65535)
const PORT_REGEX = /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

// Environment variable name validation (alphanumeric + underscore)
const ENV_VAR_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// Dangerous environment variables that should be blocked
const DANGEROUS_ENV_VARS = [
  'LD_PRELOAD',
  'LD_LIBRARY_PATH',
  'LD_AUDIT',
  'PYTHONPATH',
  'PATH', // Blocking PATH modification
  'NODE_OPTIONS',
  'BASH_ENV',
  'ENV',
  'PERL5LIB',
  'PERLLIB'
];

// Allowed volume mount paths (whitelist approach)
// In production, configure this via environment variable
const getAllowedVolumePaths = () => {
  const envPaths = process.env.ALLOWED_VOLUME_PATHS;
  if (envPaths) {
    return envPaths.split(',').map(p => p.trim());
  }

  // Default safe paths - very restrictive
  return [
    '/var/lib/docker/volumes',
    '/opt/app-data',
    '/home/*/data',
    '/tmp/docker-data'
  ];
};

// Blocked volume paths - critical system directories
const BLOCKED_VOLUME_PATHS = [
  '/',
  '/boot',
  '/dev',
  '/etc',
  '/proc',
  '/root',
  '/sys',
  '/var/run',
  '/var/run/docker.sock',
  '/usr',
  '/bin',
  '/sbin',
  '/lib',
  '/lib64'
];

// Allowed Docker image registries (whitelist)
const getAllowedRegistries = () => {
  const envRegistries = process.env.ALLOWED_REGISTRIES;
  if (envRegistries) {
    return envRegistries.split(',').map(r => r.trim());
  }

  // Default: only Docker Hub
  return [
    'docker.io',
    'registry.hub.docker.com',
    '' // Images without registry prefix default to Docker Hub
  ];
};

// Allowed Git repository domains (whitelist)
const getAllowedGitDomains = () => {
  const envDomains = process.env.ALLOWED_GIT_DOMAINS;
  if (envDomains) {
    return envDomains.split(',').map(d => d.trim());
  }

  // Default: only GitHub
  return [
    'github.com',
    'raw.githubusercontent.com'
  ];
};

// Allowed network drivers
const ALLOWED_NETWORK_DRIVERS = ['bridge', 'host', 'overlay', 'macvlan', 'none'];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Docker container/network/volume name
 */
const validateDockerName = (name, fieldName = 'name') => {
  if (!name) {
    throw new Error(`${fieldName} is required`);
  }

  if (typeof name !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  if (!DOCKER_NAME_REGEX.test(name)) {
    throw new Error(
      `${fieldName} must start with alphanumeric character and contain only alphanumeric, underscore, dot, and hyphen (max 255 chars)`
    );
  }

  return name;
};

/**
 * Validate Docker image name
 */
const validateImageName = (imageName) => {
  if (!imageName) {
    throw new Error('Image name is required');
  }

  if (typeof imageName !== 'string') {
    throw new Error('Image name must be a string');
  }

  if (!DOCKER_IMAGE_REGEX.test(imageName.toLowerCase())) {
    throw new Error('Invalid Docker image name format');
  }

  // Check if registry is allowed
  const allowedRegistries = getAllowedRegistries();
  const imageRegistry = getImageRegistry(imageName);

  if (!allowedRegistries.includes(imageRegistry)) {
    throw new Error(
      `Registry '${imageRegistry}' is not allowed. Allowed registries: ${allowedRegistries.join(', ')}`
    );
  }

  return imageName;
};

/**
 * Extract registry from image name
 */
const getImageRegistry = (imageName) => {
  // Format: [registry/]repo[:tag]
  const parts = imageName.split('/');

  if (parts.length === 1) {
    return ''; // No registry specified, defaults to Docker Hub
  }

  // Check if first part contains a port or dot (indicates registry)
  if (parts[0].includes('.') || parts[0].includes(':')) {
    return parts[0];
  }

  return ''; // First part is likely username/org, not registry
};

/**
 * Validate container ID
 */
const validateContainerId = (id) => {
  if (!id) {
    throw new Error('Container ID is required');
  }

  if (!CONTAINER_ID_REGEX.test(id)) {
    throw new Error('Invalid container ID format');
  }

  return id;
};

/**
 * Validate port number
 */
const validatePort = (port, allowPrivileged = false) => {
  const portNum = parseInt(port, 10);

  if (isNaN(portNum)) {
    throw new Error('Port must be a number');
  }

  if (!PORT_REGEX.test(portNum.toString())) {
    throw new Error('Port must be between 1 and 65535');
  }

  // Block privileged ports (1-1024) unless explicitly allowed
  if (!allowPrivileged && portNum <= 1024) {
    throw new Error('Privileged ports (1-1024) are not allowed');
  }

  return portNum;
};

/**
 * Validate port mapping (host:container format)
 */
const validatePortMapping = (mapping) => {
  if (!mapping || typeof mapping !== 'string') {
    throw new Error('Port mapping must be a string in format "host:container"');
  }

  const parts = mapping.split(':');
  if (parts.length !== 2) {
    throw new Error('Port mapping must be in format "host:container"');
  }

  const [hostPort, containerPort] = parts;

  // Validate both ports
  validatePort(hostPort, false); // Host ports: no privileged
  validatePort(containerPort, true); // Container ports: allow privileged

  return mapping;
};

/**
 * Validate environment variable
 */
const validateEnvironmentVariable = (envVar) => {
  if (!envVar || typeof envVar !== 'string') {
    throw new Error('Environment variable must be a string in format "KEY=value"');
  }

  const [key, ...valueParts] = envVar.split('=');
  const value = valueParts.join('='); // Rejoin in case value contains =

  if (!key || value === undefined) {
    throw new Error('Environment variable must be in format "KEY=value"');
  }

  // Validate key format
  if (!ENV_VAR_NAME_REGEX.test(key)) {
    throw new Error(
      `Invalid environment variable name '${key}'. Must start with letter or underscore and contain only alphanumeric and underscore`
    );
  }

  // Check for dangerous variables
  if (DANGEROUS_ENV_VARS.includes(key.toUpperCase())) {
    throw new Error(`Environment variable '${key}' is not allowed for security reasons`);
  }

  // Basic value sanitization - block null bytes and control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)) {
    throw new Error('Environment variable value contains invalid control characters');
  }

  return envVar;
};

/**
 * Validate volume mount path
 */
const validateVolumePath = (volumePath) => {
  if (!volumePath || typeof volumePath !== 'string') {
    throw new Error('Volume path is required');
  }

  // Normalize path
  const normalizedPath = path.normalize(volumePath);

  // Check blocked paths
  for (const blockedPath of BLOCKED_VOLUME_PATHS) {
    if (normalizedPath === blockedPath || normalizedPath.startsWith(blockedPath + '/')) {
      throw new Error(`Volume path '${volumePath}' is not allowed for security reasons`);
    }
  }

  // Check if path is in allowed list
  const allowedPaths = getAllowedVolumePaths();
  let isAllowed = false;

  for (const allowedPath of allowedPaths) {
    // Support wildcard patterns like /home/*/data
    const regex = new RegExp('^' + allowedPath.replace(/\*/g, '[^/]+') + '($|/)');
    if (regex.test(normalizedPath)) {
      isAllowed = true;
      break;
    }
  }

  if (!isAllowed) {
    throw new Error(
      `Volume path '${volumePath}' is not in the allowed paths list. Contact administrator to allow this path.`
    );
  }

  return normalizedPath;
};

/**
 * Validate Git repository URL
 */
const validateGitRepository = (repoUrl) => {
  if (!repoUrl || typeof repoUrl !== 'string') {
    throw new Error('Repository URL is required');
  }

  // Parse URL
  let parsedUrl;
  try {
    parsedUrl = new URL(repoUrl);
  } catch (e) {
    throw new Error('Invalid repository URL format');
  }

  // Only allow HTTPS
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Only HTTPS Git repositories are allowed');
  }

  // Check if domain is allowed
  const allowedDomains = getAllowedGitDomains();
  if (!allowedDomains.includes(parsedUrl.hostname)) {
    throw new Error(
      `Git repository domain '${parsedUrl.hostname}' is not allowed. Allowed domains: ${allowedDomains.join(', ')}`
    );
  }

  return repoUrl;
};

/**
 * Validate network driver
 */
const validateNetworkDriver = (driver) => {
  if (!driver) {
    return 'bridge'; // Default
  }

  if (!ALLOWED_NETWORK_DRIVERS.includes(driver)) {
    throw new Error(
      `Network driver '${driver}' is not allowed. Allowed drivers: ${ALLOWED_NETWORK_DRIVERS.join(', ')}`
    );
  }

  return driver;
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  validateDockerName,
  validateImageName,
  validateContainerId,
  validatePort,
  validatePortMapping,
  validateEnvironmentVariable,
  validateVolumePath,
  validateGitRepository,
  validateNetworkDriver,

  // Export for testing
  DOCKER_NAME_REGEX,
  DOCKER_IMAGE_REGEX,
  CONTAINER_ID_REGEX,
  PORT_REGEX
};
