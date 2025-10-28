const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logger } = require('../config/logger');

const dbPath = path.join(__dirname, '../../data/users.json');

/**
 * Ensures the data directory and users.json file exist.
 */
async function ensureDbFile() {
  try {
    await fs.access(dbPath);
  } catch (error) {
    // File does not exist, create it with an empty array
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify([]));
    logger.info('Created users.json because it did not exist.');
  }
}

/**
 * Reads all users from the JSON file.
 * @returns {Promise<Array>} A promise that resolves to an array of users.
 */
async function readUsers() {
  await ensureDbFile();
  const data = await fs.readFile(dbPath, 'utf8');
  if (!data) {
    return [];
  }
  return JSON.parse(data);
}

/**
 * Writes users to the JSON file.
 * @param {Array} users - The array of users to write.
 */
async function writeUsers(users) {
  await ensureDbFile();
  await fs.writeFile(dbPath, JSON.stringify(users, null, 2));
}

/**
 * Initializes the user store. Creates a default admin user if no users exist.
 */
async function init() {
  await ensureDbFile();
  const users = await readUsers();
  if (users.length === 0) {
    logger.info('No users found. Creating default admin user.');
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

    if (!adminPassword || adminPassword === 'changeme') {
        logger.warn('Default admin password is not set or is insecure. Please set ADMIN_PASSWORD in your .env file.');
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
  const users = await readUsers();
  return users.find(user => user.username === username);
}

/**
 * Adds a new user to the store with a hashed password.
 * @param {string} username - The new user's username.
 * @param {string} password - The new user's plain-text password.
 * @returns {Promise<Object>} The newly created user object.
 */
async function addUser(username, password) {
  const users = await readUsers();
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    throw new Error('User already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    username,
    password: hashedPassword,
  };

  users.push(newUser);
  await writeUsers(users);
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
  const users = await readUsers();
  const userIndex = users.findIndex(user => user.username === username);
  if (userIndex === -1) {
    throw new Error('User not found.');
  }

  // Ensure the user has a salt for encryption.
  if (!users[userIndex].salt) {
    users[userIndex].salt = crypto.randomBytes(16).toString('hex');
  }
  const salt = users[userIndex].salt;

  users[userIndex].gitToken = encrypt(token, salt);
  await writeUsers(users);
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