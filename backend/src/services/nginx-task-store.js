const NginxTask = require('../models/nginxTask');

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
  return NginxTask.create(taskData);
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
