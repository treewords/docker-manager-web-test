const express = require('express');
const { body, validationResult } = require('express-validator');
const { getTasks, addTask, updateTaskStatusToDelete } = require('../services/nginx-task-store');
const { logger } = require('../config/logger');

const router = express.Router();

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
    logger.error({ message: 'Error getting Nginx tasks', error });
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
    body('domain', 'Domain is required').not().isEmpty(),
    body('proxyPass', 'Proxy pass is required').not().isEmpty(),
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
      logger.error({ message: 'Error adding Nginx task', error });
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
        logger.error({ message: `Error updating Nginx task with id: ${req.params.id}`, error });
        if (error.message === 'Task not found') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;
