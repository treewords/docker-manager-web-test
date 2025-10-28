const express = require('express');
const jwt = require('jsonwebtoken');
const userStore = require('../services/user-store');
const { logAction } = require('../config/logger');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await userStore.findUser(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await userStore.validatePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    logAction({ username }, 'login_success');
    res.json({ token });

  } catch (error) {
    logAction({ username }, 'login_failure', { error: error.message });
    next(error);
  }
});

module.exports = router;