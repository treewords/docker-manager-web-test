const express = require('express');
const dockerService = require('../services/docker');
const auth = require('../middleware/auth');
const { logAction } = require('../config/logger');
const { getIO } = require('../services/socket');
const {
  validateImageName,
  validateGitRepository,
  validateDockerName,
} = require('../middleware/validation');
const {
  dockerOperationsLimiter,
  imagePullLimiter,
  imageBuildLimiter,
} = require('../middleware/rateLimiting');

const router = express.Router();

// All routes in this file are protected
router.use(auth);

// Apply rate limiting to all image operations
router.use(dockerOperationsLimiter);

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
router.post('/pull', imagePullLimiter, async (req, res, next) => {
  const { imageName } = req.body;

  try {
    // Validate image name
    if (!imageName) {
      const error = new Error('Image name is required');
      error.status = 400;
      throw error;
    }

    const validatedImageName = validateImageName(imageName);

    logAction(req.user, 'pull_image_start', { imageName: validatedImageName });

    // This can take a while, so we don't wait for it to finish here.
    // The client should ideally get feedback via WebSocket or another mechanism.
    // For this implementation, we'll just acknowledge the request.
    dockerService
      .pullImage(validatedImageName)
      .then(() => {
        logAction(req.user, 'pull_image_success', {
          imageName: validatedImageName,
        });
      })
      .catch((error) => {
        logAction(req.user, 'pull_image_failed', {
          imageName: validatedImageName,
          error: error.message,
        });
      });

    res
      .status(202)
      .json({ message: `Image pull for '${validatedImageName}' started.` });
  } catch (error) {
    // Ensure validation errors return 400 status
    if (!error.status) {
      error.status = 400;
    }
    next(error);
  }
});

// POST /api/images/build
router.post('/build', imageBuildLimiter, async (req, res, next) => {
  const { repoUrl, imageName, tag } = req.body;

  try {
    // Validate repository URL
    if (!repoUrl) {
      const error = new Error('Repository URL is required');
      error.status = 400;
      throw error;
    }
    const validatedRepoUrl = validateGitRepository(repoUrl);

    // Validate image name
    if (!imageName) {
      const error = new Error('Image name is required');
      error.status = 400;
      throw error;
    }
    // For build, we validate the base name part (without tag)
    validateDockerName(imageName, 'Image name');

    // Validate tag if provided
    if (tag) {
      validateDockerName(tag, 'Image tag');
    }

    const fullImageName = tag ? `${imageName}:${tag}` : imageName;
    const io = getIO();

    logAction(req.user, 'build_image_start', {
      repoUrl: validatedRepoUrl,
      imageName: fullImageName,
    });

    // Asynchronous operation, don't wait for it to finish
    dockerService
      .buildImage(validatedRepoUrl, fullImageName, req.user, io)
      .then(() => {
        logAction(req.user, 'build_image_success', {
          repoUrl: validatedRepoUrl,
          imageName: fullImageName,
        });
      })
      .catch((error) => {
        logAction(req.user, 'build_image_failed', {
          repoUrl: validatedRepoUrl,
          imageName: fullImageName,
          error: error.message,
        });
      });

    res.status(202).json({
      message: `Image build for '${fullImageName}' started from '${validatedRepoUrl}'.`,
    });
  } catch (error) {
    // Ensure validation errors return 400 status
    if (!error.status) {
      error.status = 400;
    }
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
    logAction(req.user, 'remove_image_failed', {
      imageId: id,
      error: error.message,
    });
    next(error);
  }
});

module.exports = router;
