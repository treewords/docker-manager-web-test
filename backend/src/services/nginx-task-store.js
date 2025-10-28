const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const tasksFilePath = process.env.NGINX_TASKS_FILE_PATH || path.join(__dirname, '..', '..', 'data', 'nginx-tasks.json');

/**
 * Reads all Nginx tasks from the JSON file.
 * @returns {Promise<Array>} A promise that resolves to an array of tasks.
 */
async function getTasks() {
  try {
    const data = await fs.readFile(tasksFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // Return an empty array if the file doesn't exist
    }
    throw error;
  }
}

/**
 * Writes tasks to the JSON file.
 * @param {Array} tasks - The array of tasks to write.
 * @returns {Promise<void>}
 */
async function writeTasks(tasks) {
  await fs.writeFile(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf8');
}

/**
 * Adds a new Nginx task.
 * @param {object} taskData - The data for the new task.
 * @returns {Promise<object>} The newly created task.
 */
async function addTask(taskData) {
  const tasks = await getTasks();
  const newTask = {
    id: uuidv4(),
    ...taskData,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  await writeTasks(tasks);
  return newTask;
}

/**
 * Updates the status of an Nginx task to "deleting".
 * @param {string} taskId - The ID of the task to update.
 * @returns {Promise<void>}
 */
async function updateTaskStatusToDelete(taskId) {
    const tasks = await getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
        throw new Error('Task not found');
    }
    tasks[taskIndex].status = 'deleting';
    await writeTasks(tasks);
}

module.exports = {
  getTasks,
  addTask,
  updateTaskStatusToDelete,
};
