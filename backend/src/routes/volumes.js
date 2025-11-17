const express = require('express');
const dockerService = require('../services/docker');
const auth = require('../middleware/auth');
const { logAction } = require('../config/logger');

const router = express.Router();

// All routes in this file are protected
router.use(auth);

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
      return res.status(400).json({ message: 'Volume name is required.' });
    }
    logAction(req.user.username, 'CREATE_VOLUME', { volumeName: name });
    const volume = await dockerService.createVolume({ Name: name });
    res.status(201).json(volume);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/volumes/:name -> remove a volume
router.delete('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    logAction(req.user.username, 'REMOVE_VOLUME', { volumeName: name });
    await dockerService.removeVolume(name);
    res.status(200).json({ message: `Volume '${name}' removed successfully.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
