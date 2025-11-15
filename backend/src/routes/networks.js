const express = require('express');
const dockerService = require('../services/docker');
const auth = require('../middleware/auth');
const { logAction } = require('../config/logger');
const { validateDockerName, validateNetworkDriver } = require('../middleware/validation');
const { dockerOperationsLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// All routes in this file are protected
router.use(auth);

// Apply rate limiting
router.use(dockerOperationsLimiter);

// Validate network ID/name for routes with :id parameter
router.param('id', (req, res, next, id) => {
  try {
    if (!id || typeof id !== 'string') {
      const error = new Error('Network ID is required');
      error.status = 400;
      throw error;
    }
    // Network IDs/names: alphanumeric, hyphens, underscores
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,255}$/.test(id)) {
      const error = new Error('Invalid network ID format');
      error.status = 400;
      throw error;
    }
    next();
  } catch (error) {
    next(error);
  }
});

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
        // Validate network name
        if (!name) {
            const error = new Error('Network name is required');
            error.status = 400;
            throw error;
        }
        const validatedName = validateDockerName(name, 'Network name');

        // Validate driver
        const validatedDriver = validateNetworkDriver(driver);

        const network = await dockerService.createNetwork({
            Name: validatedName,
            Driver: validatedDriver
        });

        logAction(req.user, 'network_create', { networkName: validatedName, driver: validatedDriver });
        res.status(201).json(network);
    } catch (error) {
        if (!error.status) {
            error.status = 400;
        }
        logAction(req.user, 'network_create_failed', { networkName: name, error: error.message });
        next(error);
    }
});

// GET /api/networks/:id -> get network details
router.get('/:id', async (req, res, next) => {
    try {
        const network = await dockerService.inspectNetwork(req.params.id);
        logAction(req.user, 'network_inspect', { networkId: req.params.id });
        res.json(network);
    } catch (error) {
        next(error);
    }
});

// POST /api/networks/:id/connect -> connect a container to a network
router.post('/:id/connect', async (req, res, next) => {
    const { containerId } = req.body;
    try {
        if (!containerId) {
            const error = new Error('Container ID is required');
            error.status = 400;
            throw error;
        }

        await dockerService.connectContainerToNetwork(req.params.id, containerId);
        logAction(req.user, 'network_connect', { networkId: req.params.id, containerId });
        res.status(200).send({ message: 'Container connected successfully' });
    } catch (error) {
        if (!error.status) {
            error.status = 400;
        }
        logAction(req.user, 'network_connect_failed', { networkId: req.params.id, containerId, error: error.message });
        next(error);
    }
});

// POST /api/networks/:id/disconnect -> disconnect a container from a network
router.post('/:id/disconnect', async (req, res, next) => {
    const { containerId } = req.body;
    try {
        if (!containerId) {
            const error = new Error('Container ID is required');
            error.status = 400;
            throw error;
        }

        await dockerService.disconnectContainerFromNetwork(req.params.id, containerId);
        logAction(req.user, 'network_disconnect', { networkId: req.params.id, containerId });
        res.status(200).send({ message: 'Container disconnected successfully' });
    } catch (error) {
        if (!error.status) {
            error.status = 400;
        }
        logAction(req.user, 'network_disconnect_failed', { networkId: req.params.id, containerId, error: error.message });
        next(error);
    }
});

// DELETE /api/networks/:id -> remove a network
router.delete('/:id', async (req, res, next) => {
    try {
        await dockerService.removeNetwork(req.params.id);
        logAction(req.user, 'network_remove', { networkId: req.params.id });
        res.status(200).send({ message: 'Network removed successfully' });
    } catch (error) {
        logAction(req.user, 'network_remove_failed', { networkId: req.params.id, error: error.message });
        next(error);
    }
});

module.exports = router;