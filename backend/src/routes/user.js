const express = require('express');
const auth = require('../middleware/auth');
const { logAction } = require('../config/logger');
const userStore = require('../services/user-store');

const router = express.Router();

// All routes in this file are protected
router.use(auth);

// GET /api/user/settings/git-token-status
router.get('/settings/git-token-status', async (req, res, next) => {
  try {
    const token = await userStore.getGitToken(req.user.username);
    res.json({ hasToken: !!token });
  } catch (error) {
    next(error);
  }
});

// POST /api/user/settings/git-token
router.post('/settings/git-token', async (req, res, next) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }

  try {
    await userStore.saveGitToken(req.user.username, token);
    logAction(req.user, 'save_git_token');
    res.status(200).json({ message: 'Git token saved successfully.' });
  } catch (error) {
    logAction(req.user, 'save_git_token_failed', { error: error.message });
    next(error);
  }
});

module.exports = router;