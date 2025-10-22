const express = require('express');
const router = express.Router();
const nginxTaskStore = require('../services/nginx-task-store');
const nginxManager = require('../services/nginx-manager');
const nginxMetricsCollector = require('../services/nginx-metrics-collector');
const nginxConfigGenerator = require('../services/nginx-config-generator');
const authMiddleware = require('../middleware/auth');
const { validateNginxTask } = require('../middleware/nginx-validator');
const logger = require('../utils/logger');
const { logAction } = require('../middleware/audit');

// All routes in this file are protected
router.use(authMiddleware);

// POST /api/nginx/tasks - Create a new Nginx task
router.post('/tasks', validateNginxTask, async (req, res, next) => {
  try {
    const task = await nginxTaskStore.addTask(req.body);
    logAction(req.user.username, 'create_nginx_task', { taskId: task.id, domain: task.domain });
    // Asynchronously apply the config without waiting
    nginxManager.applyNginxConfig(task.id).catch(err => {
      logger.error(`Async applyNginxConfig failed for task ${task.id}: ${err.message}`);
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// GET /api/nginx/tasks - Get all Nginx tasks with filtering
router.get('/tasks', async (req, res, next) => {
  try {
    const { status, domain, limit, offset } = req.query;
    const tasks = await nginxTaskStore.getTasks({ status, domain, limit, offset });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// GET /api/nginx/tasks/:id - Get a single Nginx task
router.get('/tasks/:id', async (req, res, next) => {
  try {
    const task = await nginxTaskStore.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// PUT /api/nginx/tasks/:id - Update an Nginx task
router.put('/tasks/:id', validateNginxTask, async (req, res, next) => {
  try {
    const updatedTask = await nginxTaskStore.updateTask(req.params.id, {
      ...req.body,
      status: 'pending', // Set to pending for reprocessing
    });
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    logAction(req.user.username, 'update_nginx_task', { taskId: updatedTask.id });
    // Asynchronously apply the new config
    nginxManager.applyNginxConfig(updatedTask.id).catch(err => {
      logger.error(`Async applyNginxConfig failed for updated task ${updatedTask.id}: ${err.message}`);
    });
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/nginx/tasks/:id - Delete an Nginx task
router.delete('/tasks/:id', async (req, res, next) => {
  try {
    await nginxManager.deleteNginxConfig(req.params.id);
    logAction(req.user.username, 'delete_nginx_task', { taskId: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/nginx/config/:id - Get the generated Nginx config
router.get('/config/:id', async (req, res, next) => {
  try {
    const task = await nginxTaskStore.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const upstreamBlock = nginxConfigGenerator.generateUpstreamBlock(task);
    const serverBlock = nginxConfigGenerator.generateServerBlock(task);
    const config = `${upstreamBlock}\n${serverBlock}`;
    res.header('Content-Type', 'text/plain').send(config);
  } catch (error) {
    next(error);
  }
});

// POST /api/nginx/validate - Validate Nginx syntax
router.post('/validate', async (req, res, next) => {
    try {
        // This is a simplified validation. A real implementation would
        // write a temporary file and test it inside the container.
        await nginxManager._execInNginx(['nginx', '-t']);
        res.json({ valid: true });
    } catch (error) {
        res.status(400).json({ valid: false, error: error.message });
    }
});

// GET /api/nginx/metrics/:id - Get metrics for a task
router.get('/metrics/:id', async (req, res, next) => {
  try {
    const { timeWindow } = req.query;
    const metrics = await nginxMetricsCollector.getTaskMetrics(req.params.id, { timeWindow });
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// GET /api/nginx/health - Get overall system health
router.get('/health', async (req, res, next) => {
  try {
    const { tasks: pendingTasks } = await nginxTaskStore.getTasks({ status: 'pending' });
    const { tasks: failedTasks } = await nginxTaskStore.getTasks({ status: 'failed' });

    let nginxStatus = 'unknown';
    try {
        await nginxManager._findNginxContainer();
        nginxStatus = 'running';
    } catch(e) {
        nginxStatus = 'not_found';
    }

    res.json({
      nginxStatus,
      pendingTasks: pendingTasks.length,
      failedTasks: failedTasks.length,
      lastReloadTime: nginxManager.lastReloadTime,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
