const express = require('express');
const { body, validationResult } = require('express-validator');
const { getTasks, addTask, updateTaskStatusToDelete } = require('../services/nginx-task-store');
const { logger } = require('../config/logger');

const router = express.Router();

/**
 * Validates a domain name.
 * @param {string} d The domain to validate.
 * @returns {boolean} True if the domain is valid, false otherwise.
 */
function validateDomain(d) {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/.test(d);
}

/**
 * @route   GET /api/nginx/tasks
 * @desc    Get all Nginx tasks
 * @access  Private
 */
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await getTasks();
    res.json(tasks);
  } catch (error) {
    logger.error('Error getting Nginx tasks', { error: error.message, stack: error.stack });
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST /api/nginx/tasks
 * @desc    Add a new Nginx task
 * @access  Private
 */
router.post(
  '/tasks',
  [
    body('domain', 'A valid domain is required')
      .not().isEmpty()
      .custom((value) => {
        if (!validateDomain(value)) {
          throw new Error('Invalid domain format');
        }
        return true;
      }),
    body('proxyPass', 'A valid Proxy Pass URL is required').isURL(),
    body('enableSSL', 'Enable SSL is required').isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newTask = await addTask(req.body);
      res.status(201).json(newTask);
    } catch (error) {
      logger.error('Error adding Nginx task', { error: error.message, stack: error.stack });
      res.status(500).send('Server error');
    }
  }
);

/**
 * @route   PATCH /api/nginx/tasks/:id/delete
 * @desc    Update an Nginx task status to "deleting"
 * @access  Private
 */
router.patch('/tasks/:id/delete', async (req, res) => {
    try {
        await updateTaskStatusToDelete(req.params.id);
        res.json({ msg: 'Task status updated to deleting' });
    } catch (error) {
        logger.error(`Error updating Nginx task with id: ${req.params.id}`, { error: error.message, stack: error.stack });
        if (error.message === 'Task not found') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;
