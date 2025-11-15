const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logger } = require('../config/logger');
const User = require('../models/user');

/**
 * Validates password complexity
 * @param {string} password - The password to validate
 * @throws {Error} If password doesn't meet complexity requirements
 */
function validatePasswordComplexity(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    throw new Error('Password must contain at least one special character');
  }

  // Check against common passwords
  const commonPasswords = ['password', 'Password123!', 'Admin123!', '12345678', 'qwerty'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    throw new Error('Password is too common. Please choose a more unique password');
  }

  return true;
}

/**
 * Generates a random strong password
 * @returns {string} A strong random password
 */
function generateRandomPassword() {
  const length = 24;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';

  // Ensure at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*()_+-=[]{}|'[Math.floor(Math.random() * 18)]; // Special char

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Initializes the user store. Creates a default admin user if no users exist.
 */
async function init() {
  const userCount = await User.count();
  if (userCount === 0) {
    logger.info('No users found. Creating default admin user.');
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    let adminPassword = process.env.ADMIN_PASSWORD;

    // Generate random password if not set or if set to default insecure value
    if (!adminPassword || adminPassword === 'changeme') {
      adminPassword = generateRandomPassword();
      logger.warn('ADMIN_PASSWORD was not set or was insecure. Generated random password for admin user.');
      logger.warn('═══════════════════════════════════════════════════════════');
      logger.warn(`GENERATED ADMIN PASSWORD: ${adminPassword}`);
      logger.warn('═══════════════════════════════════════════════════════════');
      logger.warn('IMPORTANT: Save this password immediately! It will not be shown again.');
      logger.warn('Change this password after first login using the user settings page.');
    } else {
      // Validate provided password
      try {
        validatePasswordComplexity(adminPassword);
      } catch (error) {
        logger.error(`ADMIN_PASSWORD does not meet complexity requirements: ${error.message}`);
        logger.error('Generating a random password instead.');
        adminPassword = generateRandomPassword();
        logger.warn('═══════════════════════════════════════════════════════════');
        logger.warn(`GENERATED ADMIN PASSWORD: ${adminPassword}`);
        logger.warn('═══════════════════════════════════════════════════════════');
      }
    }

    await addUser(adminUsername, adminPassword);
    logger.info(`Default admin user '${adminUsername}' created.`);
  }
}

/**
 * Finds a user by their username.
 * @param {string} username - The username to search for.
 * @returns {Promise<Object|undefined>} The user object or undefined if not found.
 */
async function findUser(username) {
  return User.findOne({ where: { username } });
}

/**
 * Adds a new user to the store with a hashed password.
 * @param {string} username - The new user's username.
 * @param {string} password - The new user's plain-text password.
 * @returns {Promise<Object>} The newly created user object.
 */
async function addUser(username, password) {
  const existingUser = await findUser(username);
  if (existingUser) {
    throw new Error('User already exists.');
  }

  // Validate password complexity (skip for initial admin user)
  if (username !== process.env.ADMIN_USERNAME) {
    validatePasswordComplexity(password);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    username,
    password: hashedPassword,
  });
  return newUser;
}

/**
 * Validates a user's password.
 * @param {string} plainPassword - The plain-text password to validate.
 * @param {string} hashedPassword - The hashed password from the store.
 * @returns {Promise<boolean>} True if the password is valid, false otherwise.
 */
async function validatePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// --- Encryption/Decryption for Git Token ---
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Encrypts a text string using a user-specific salt.
 * @param {string} text - The text to encrypt.
 * @param {string} salt - The user's unique salt.
 * @returns {{iv: string, encryptedData: string, authTag: string}} The encrypted data parts.
 */
function encrypt(text, salt) {
  if (!process.env.ENCRYPTION_SECRET) {
    throw new Error('ENCRYPTION_SECRET is not defined in the environment variables.');
  }
  const key = crypto.pbkdf2Sync(process.env.ENCRYPTION_SECRET, salt, 100000, 32, 'sha512');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypts an encrypted text string using a user-specific salt.
 * @param {{iv: string, encryptedData: string, authTag: string}} data - The encrypted data object.
 * @param {string} salt - The user's unique salt.
 * @returns {string} The decrypted text.
 */
function decrypt(data, salt) {
  const key = crypto.pbkdf2Sync(process.env.ENCRYPTION_SECRET, salt, 100000, 32, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(data.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
  let decrypted = decipher.update(data.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Saves an encrypted GitHub PAT for a user.
 * @param {string} username - The user's username.
 * @param {string} token - The plain-text GitHub token.
 */
async function saveGitToken(username, token) {
  const user = await findUser(username);
  if (!user) {
    throw new Error('User not found.');
  }

  if (!user.salt) {
    user.salt = crypto.randomBytes(16).toString('hex');
  }

  user.gitToken = encrypt(token, user.salt);
  await user.save();
  logger.info(`Git token saved for user '${username}'.`);
}

/**
 * Retrieves and decrypts a GitHub PAT for a user.
 * @param {string} username - The user's username.
 * @returns {Promise<string|null>} The decrypted token, or null if not found or on error.
 */
async function getGitToken(username) {
  const user = await findUser(username);
  if (!user || !user.gitToken || !user.salt) {
    return null;
  }

  try {
    return decrypt(user.gitToken, user.salt);
  } catch (error) {
    logger.error(`Failed to decrypt token for user '${username}':`, error);
    return null;
  }
}

module.exports = {
  init,
  findUser,
  addUser,
  validatePassword,
  saveGitToken,
  getGitToken,
};
