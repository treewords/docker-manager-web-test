const fs = require('fs').promises;
const NginxTask = require('../models/nginxTask');

const lockPath = '/var/lock/nginx-manager.lock';

/**
 * Reads all Nginx tasks from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of tasks.
 */
async function getTasks() {
  return NginxTask.findAll();
}

/**
 * Adds a new Nginx task.
 * @param {object} taskData - The data for the new task.
 * @returns {Promise<object>} The newly created task.
 */
async function addTask(taskData) {
  let lockHandle;
  try {
    // Acquire lock
    lockHandle = await fs.open(lockPath, 'wx');

    // Create the task in the database
    const task = await NginxTask.create(taskData);
    return task;
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error('Operation locked. Please try again later.');
    }
    throw error; // Re-throw other errors
  } finally {
    // Release lock
    if (lockHandle) {
      await lockHandle.close();
      await fs.unlink(lockPath).catch(() => {}); // Ignore errors on unlink
    }
  }
}

/**
 * Updates the status of an Nginx task to "deleting".
 * @param {string} taskId - The ID of the task to update.
 * @returns {Promise<void>}
 */
async function updateTaskStatusToDelete(taskId) {
  const task = await NginxTask.findByPk(taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  task.status = 'deleting';
  await task.save();
}

module.exports = {
  getTasks,
  addTask,
  updateTaskStatusToDelete,
};
