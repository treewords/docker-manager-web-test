import api from './api';

/**
 * Fetches all Nginx tasks from the backend.
 * @returns {Promise<Array>} A promise that resolves to an array of tasks.
 */
export const getNginxTasks = async () => {
  try {
    const response = await api.get('/nginx/tasks');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Adds a new Nginx task.
 * @param {object} taskData - The data for the new task.
 * @returns {Promise<object>} The newly created task.
 */
export const addNginxTask = async (taskData) => {
  try {
    const response = await api.post('/nginx/tasks', taskData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Updates the status of an Nginx task to "deleting".
 * @param {string} taskId - The ID of the task to update.
 * @returns {Promise<void>}
 */
export const updateNginxTaskStatusToDelete = async (taskId) => {
  try {
    await api.patch(`/nginx/tasks/${taskId}/delete`);
  } catch (error) {
    throw error;
  }
};
