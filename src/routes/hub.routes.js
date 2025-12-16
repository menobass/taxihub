const express = require('express');
const router = express.Router();
const hubService = require('../services/hub.service');

/**
 * GET /api/hubs
 * Returns list of available hubs for the hub selector
 */
router.get('/', (req, res) => {
  try {
    const hubs = hubService.getHubRegistry();
    
    res.json({
      success: true,
      hubs: hubs
    });
  } catch (error) {
    console.error('Failed to fetch hub registry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hub registry'
    });
  }
});

/**
 * GET /api/hubs/:community
 * Returns details for a specific hub by community username
 */
router.get('/:community', (req, res) => {
  try {
    const { community } = req.params;
    const hubs = hubService.getHubRegistry();
    const hub = hubs.find(h => h.communityUsername === community);
    
    if (!hub) {
      return res.status(404).json({
        success: false,
        error: 'Hub not found'
      });
    }
    
    res.json({
      success: true,
      hub: hub
    });
  } catch (error) {
    console.error('Failed to fetch hub:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hub'
    });
  }
});

module.exports = router;
