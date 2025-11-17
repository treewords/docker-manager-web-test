const express = require('express');
const dockerService = require('../services/docker');
const auth = require('../middleware/auth');
const { logAction } = require('../config/logger');

const router = express.Router();

// All routes in this file are protected
router.use(auth);

// GET /api/networks -> list networks
router.get('/', async (req, res, next) => {
  try {
    const networks = await dockerService.listNetworks();
    res.json(networks);
  } catch (error) {
    next(error);
  }
});

// POST /api/networks -> create a new network
router.post('/', async (req, res, next) => {
  const { name, driver } = req.body;
  try {
    const network = await dockerService.createNetwork({
      Name: name,
      Driver: driver,
    });
    logAction('network', `Network created: ${name}`, 'success');
    res.status(201).json(network);
  } catch (error) {
    logAction('network', `Error creating network: ${name}`, 'error');
    next(error);
  }
});

// GET /api/networks/:id -> get network details
router.get('/:id', async (req, res, next) => {
  try {
    const network = await dockerService.inspectNetwork(req.params.id);
    res.json(network);
  } catch (error) {
    next(error);
  }
});

// POST /api/networks/:id/connect -> connect a container to a network
router.post('/:id/connect', async (req, res, next) => {
  const { containerId } = req.body;
  try {
    await dockerService.connectContainerToNetwork(req.params.id, containerId);
    logAction(
      'network',
      `Container ${containerId} connected to network ${req.params.id}`,
      'success',
    );
    res.status(200).send({ message: 'Container connected successfully' });
  } catch (error) {
    logAction(
      'network',
      `Error connecting container ${containerId} to network ${req.params.id}`,
      'error',
    );
    next(error);
  }
});

// POST /api/networks/:id/disconnect -> disconnect a container from a network
router.post('/:id/disconnect', async (req, res, next) => {
  const { containerId } = req.body;
  try {
    await dockerService.disconnectContainerFromNetwork(
      req.params.id,
      containerId,
    );
    logAction(
      'network',
      `Container ${containerId} disconnected from network ${req.params.id}`,
      'success',
    );
    res.status(200).send({ message: 'Container disconnected successfully' });
  } catch (error) {
    logAction(
      'network',
      `Error disconnecting container ${containerId} from network ${req.params.id}`,
      'error',
    );
    next(error);
  }
});

// DELETE /api/networks/:id -> remove a network
router.delete('/:id', async (req, res, next) => {
  try {
    await dockerService.removeNetwork(req.params.id);
    logAction('network', `Network removed: ${req.params.id}`, 'success');
    res.status(200).send({ message: 'Network removed successfully' });
  } catch (error) {
    logAction('network', `Error removing network: ${req.params.id}`, 'error');
    next(error);
  }
});

module.exports = router;
