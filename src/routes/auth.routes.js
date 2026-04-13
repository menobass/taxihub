const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const hiveUtils = require('../utils/hive.utils');
const cache = require('../utils/cache.utils');
const hiveService = require('../services/hive.service');

const CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Issue a one-time challenge for the given username.
 * The frontend must sign this challenge with Hive Keychain and return it to /login.
 */
router.post('/challenge', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    if (!hiveUtils.isValidUsername(username)) {
      return res.status(400).json({ error: 'Invalid Hive username format' });
    }

    const challenge = crypto.randomBytes(32).toString('hex');
    cache.set(`challenge:${username}`, { challenge, username }, CHALLENGE_TTL);

    res.json({ challenge });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
});

/**
 * Verify a signed challenge and issue a JWT.
 * Expects: { username, challenge, signature }
 * The signature must be the Hive Keychain result of signing the challenge string
 * with the account's posting key.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, challenge, signature } = req.body;

    if (!username || !challenge || !signature) {
      return res.status(400).json({ error: 'Username, challenge, and signature required' });
    }

    // Retrieve and validate the stored challenge
    const stored = cache.get(`challenge:${username}`);
    if (!stored || stored.challenge !== challenge) {
      return res.status(401).json({ error: 'Invalid or expired challenge' });
    }

    // Fetch the account's public posting key from the Hive blockchain
    const accounts = await hiveService.client.database.getAccounts([username]);
    if (!accounts || accounts.length === 0) {
      return res.status(401).json({ error: 'Hive account not found' });
    }
    const publicKey = accounts[0].posting.key_auths[0][0];

    // Verify the Keychain signature against the challenge
    const valid = hiveUtils.verifyKeychainSignature(username, challenge, signature, publicKey);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // One-time use — delete the challenge so it cannot be replayed
    cache.delete(`challenge:${username}`);

    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ success: true, token, username });
  } catch (error) {
    console.error('Login error:', error);
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
