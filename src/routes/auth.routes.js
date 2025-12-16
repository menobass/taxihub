const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

/**
 * Login endpoint (placeholder for Hive Keychain integration)
 * In production, this will verify Keychain signatures
 */
router.post('/login', async (req, res) => {
  try {
    const { username, signature } = req.body;

    if (!username || !signature) {
      return res.status(400).json({ error: 'Username and signature required' });
    }

    // TODO: Verify Hive Keychain signature
    // For now, generate JWT for development
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      username
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Verify token endpoint
 */
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
