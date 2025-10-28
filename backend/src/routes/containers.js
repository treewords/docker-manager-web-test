const express = require('express');
const dockerService = require('../services/docker');
const auth = require('../middleware/auth');
const { logAction } = require('../config/logger');

const router = express.Router();

// All routes in this file are protected
router.use(auth);

// GET /api/containers -> list containers
router.get('/', async (req, res, next) => {
  try {
    const containers = await dockerService.listContainers();
    res.json(containers);
  } catch (error) {
    next(error);
  }
});

// POST /api/containers/:id/start
router.post('/:id/start', async (req, res, next) => {
  const { id } = req.params;
  try {
    await dockerService.startContainer(id);
    logAction(req.user, 'start_container', { containerId: id });
    res.status(200).json({ message: `Container ${id} started successfully.` });
  } catch (error) {
    logAction(req.user, 'start_container_failed', { containerId: id, error: error.message });
    next(error);
  }
});

// POST /api/containers/:id/stop
router.post('/:id/stop', async (req, res, next) => {
  const { id } = req.params;
  try {
    await dockerService.stopContainer(id);
    logAction(req.user, 'stop_container', { containerId: id });
    res.status(200).json({ message: `Container ${id} stopped successfully.` });
  } catch (error) {
    logAction(req.user, 'stop_container_failed', { containerId: id, error: error.message });
    next(error);
  }
});

// POST /api/containers/:id/restart
router.post('/:id/restart', async (req, res, next) => {
    const { id } = req.params;
    try {
        await dockerService.restartContainer(id);
        logAction(req.user, 'restart_container', { containerId: id });
        res.status(200).json({ message: `Container ${id} restarted successfully.` });
    } catch (error) {
        logAction(req.user, 'restart_container_failed', { containerId: id, error: error.message });
        next(error);
    }
});

// POST /api/containers/:id/pause
router.post('/:id/pause', async (req, res, next) => {
    const { id } = req.params;
    try {
        await dockerService.pauseContainer(id);
        logAction(req.user, 'pause_container', { containerId: id });
        res.status(200).json({ message: `Container ${id} paused successfully.` });
    } catch (error) {
        logAction(req.user, 'pause_container_failed', { containerId: id, error: error.message });
        next(error);
    }
});

// POST /api/containers/:id/unpause
router.post('/:id/unpause', async (req, res, next) => {
    const { id } = req.params;
    try {
        await dockerService.unpauseContainer(id);
        logAction(req.user, 'unpause_container', { containerId: id });
        res.status(200).json({ message: `Container ${id} unpaused successfully.` });
    } catch (error) {
        logAction(req.user, 'unpause_container_failed', { containerId: id, error: error.message });
        next(error);
    }
});

// DELETE /api/containers/:id
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    await dockerService.removeContainer(id);
    logAction(req.user, 'remove_container', { containerId: id });
    res.status(200).json({ message: `Container ${id} removed successfully.` });
  } catch (error) {
    logAction(req.user, 'remove_container_failed', { containerId: id, error: error.message });
    next(error);
  }
});

// POST /api/containers/create
router.post('/create', async (req, res, next) => {
  const { image, name, ports, env, volumes } = req.body;
  if (!image) {
    return res.status(400).json({ message: 'Image name is required.' });
  }
  try {
    const container = await dockerService.createContainer({ image, name, ports, env, volumes });
    logAction(req.user, 'create_container', { image, name, volumes, containerId: container.id });
    res.status(201).json({ message: 'Container created successfully.', containerId: container.id.substring(0, 12) });
  } catch (error) {
    logAction(req.user, 'create_container_failed', { image, name, volumes, error: error.message });
    next(error);
  }
});

// Note: The /:id/logs endpoint is handled by the WebSocket service, not a standard HTTP route.

module.exports = router;