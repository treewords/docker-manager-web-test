const express = require('express');
const dockerService = require('../services/docker');
const auth = require('../middleware/auth');
const { logAction } = require('../config/logger');
const { validateDockerName } = require('../middleware/validation');
const { dockerOperationsLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// All routes in this file are protected
router.use(auth);

// Apply rate limiting
router.use(dockerOperationsLimiter);

// Validate volume name for routes with :name parameter
router.param('name', (req, res, next, name) => {
  try {
    validateDockerName(name, 'Volume name');
    next();
  } catch (error) {
    error.status = 400;
    next(error);
  }
});

// GET /api/volumes -> list volumes
router.get('/', async (req, res, next) => {
  try {
    const volumes = await dockerService.listVolumes();
    res.json(volumes);
  } catch (error) {
    next(error);
  }
});

// POST /api/volumes -> create a volume
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      const error = new Error('Volume name is required');
      error.status = 400;
      throw error;
    }

    const validatedName = validateDockerName(name, 'Volume name');
    const volume = await dockerService.createVolume({ Name: validatedName });

    logAction(req.user, 'volume_create', { volumeName: validatedName });
    res.status(201).json(volume);
  } catch (error) {
    if (!error.status) {
      error.status = 400;
    }
    logAction(req.user, 'volume_create_failed', { volumeName: req.body.name, error: error.message });
    next(error);
  }
});

// DELETE /api/volumes/:name -> remove a volume
router.delete('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    await dockerService.removeVolume(name);

    logAction(req.user, 'volume_remove', { volumeName: name });
    res.status(200).json({ message: `Volume '${name}' removed successfully.` });
  } catch (error) {
    logAction(req.user, 'volume_remove_failed', { volumeName: req.params.name, error: error.message });
    next(error);
  }
});

module.exports = router;