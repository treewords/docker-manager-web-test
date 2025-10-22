const express = require('express');
const dockerService = require('../services/docker');
const auth = require('../middleware/auth');
const { logAction } = require('../config/logger');

const router = express.Router();

// All routes in this file are protected
router.use(auth);

// GET /api/images -> list images
router.get('/', async (req, res, next) => {
  try {
    const images = await dockerService.listImages();
    res.json(images);
  } catch (error) {
    next(error);
  }
});

// POST /api/images/pull
router.post('/pull', async (req, res, next) => {
  const { imageName } = req.body;
  if (!imageName) {
    return res.status(400).json({ message: 'Image name is required.' });
  }

  try {
    logAction(req.user, 'pull_image_start', { imageName });
    // This can take a while, so we don't wait for it to finish here.
    // The client should ideally get feedback via WebSocket or another mechanism.
    // For this implementation, we'll just acknowledge the request.
    dockerService.pullImage(imageName)
      .then(() => {
        logAction(req.user, 'pull_image_success', { imageName });
      })
      .catch(error => {
        logAction(req.user, 'pull_image_failed', { imageName, error: error.message });
      });

    res.status(202).json({ message: `Image pull for '${imageName}' started.` });

  } catch (error) {
    // This catch block will likely not be hit for pull errors,
    // as the pull operation is async. It's here for synchronous errors.
    next(error);
  }
});

// POST /api/images/build
router.post('/build', async (req, res, next) => {
  const { repoUrl, imageName, tag } = req.body;
  if (!repoUrl || !imageName) {
    return res.status(400).json({ message: 'Repository URL and image name are required.' });
  }

  const fullImageName = tag ? `${imageName}:${tag}` : imageName;

  try {
    logAction(req.user, 'build_image_start', { repoUrl, imageName: fullImageName });

    // Asynchronous operation, don't wait for it to finish
    dockerService.buildImage(repoUrl, fullImageName, req.user)
      .then(() => {
        logAction(req.user, 'build_image_success', { repoUrl, imageName: fullImageName });
      })
      .catch(error => {
        logAction(req.user, 'build_image_failed', { repoUrl, imageName: fullImageName, error: error.message });
      });

    res.status(202).json({ message: `Image build for '${fullImageName}' started from '${repoUrl}'.` });

  } catch (error) {
    next(error);
  }
});

// DELETE /api/images/:id
router.delete('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        await dockerService.removeImage(id);
        logAction(req.user, 'remove_image', { imageId: id });
        res.status(200).json({ message: `Image ${id} removed successfully.` });
    } catch (error) {
        logAction(req.user, 'remove_image_failed', { imageId: id, error: error.message });
        next(error);
    }
});

module.exports = router;