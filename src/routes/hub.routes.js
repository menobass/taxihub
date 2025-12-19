const express = require('express');
const router = express.Router();
const hubService = require('../services/hub.service');
const hiveService = require('../services/hive.service');

// External API base URL for community registry
const COMMUNITIES_API_URL = process.env.COMMUNITIES_API_URL || 'https://menosoft.xyz/hivetaxi/api/communities';

/**
 * GET /api/hubs
 * Returns list of available hubs for the hub selector
 * Fetches from external API and enriches with Hive blockchain data
 */
router.get('/', async (req, res) => {
  try {
    // Fetch communities from external API
    const response = await fetch(COMMUNITIES_API_URL);
    const data = await response.json();
    
    if (!data.communities || !Array.isArray(data.communities)) {
      return res.json({ success: true, hubs: [] });
    }
    
    // Enrich each community with Hive blockchain data
    const enrichedHubs = await Promise.all(
      data.communities.map(async (community) => {
        try {
          // Fetch community details from Hive blockchain
          const hiveData = await hiveService.client.call('bridge', 'get_community', {
            name: community.hiveTag
          });
          
          return {
            communityUsername: community.hiveTag,
            communityName: community.name,
            location: community.latitude && community.longitude 
              ? `${community.latitude}, ${community.longitude}` 
              : 'Global',
            latitude: community.latitude ? parseFloat(community.latitude) : null,
            longitude: community.longitude ? parseFloat(community.longitude) : null,
            // Data from Hive blockchain
            description: hiveData?.about || hiveData?.title || '',
            owner: hiveData?.team?.[0]?.[0] || hiveData?.admins?.[0] || 'unknown',
            language: hiveData?.lang || 'en',
            subscribers: hiveData?.subscribers || 0,
            activePosters: hiveData?.num_authors || 0,
            pendingPosts: hiveData?.num_pending || 0,
            createdAt: hiveData?.created || null,
            active: true
          };
        } catch (hiveError) {
          console.error(`Failed to fetch Hive data for ${community.hiveTag}:`, hiveError.message);
          // Return basic data if Hive fetch fails
          return {
            communityUsername: community.hiveTag,
            communityName: community.name,
            location: community.latitude && community.longitude 
              ? `${community.latitude}, ${community.longitude}` 
              : 'Global',
            latitude: community.latitude ? parseFloat(community.latitude) : null,
            longitude: community.longitude ? parseFloat(community.longitude) : null,
            description: '',
            owner: 'unknown',
            language: 'en',
            subscribers: 0,
            active: true
          };
        }
      })
    );
    
    // Sort by name
    enrichedHubs.sort((a, b) => a.communityName.localeCompare(b.communityName));
    
    res.json({
      success: true,
      hubs: enrichedHubs
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
router.get('/:community', async (req, res) => {
  try {
    const { community } = req.params;
    
    // Fetch from external API
    const response = await fetch(COMMUNITIES_API_URL);
    const data = await response.json();
    
    const communityData = data.communities?.find(c => c.hiveTag === community);
    
    if (!communityData) {
      return res.status(404).json({
        success: false,
        error: 'Hub not found'
      });
    }
    
    // Enrich with Hive blockchain data
    let hiveData = {};
    try {
      hiveData = await hiveService.client.call('bridge', 'get_community', {
        name: community
      });
    } catch (hiveError) {
      console.error(`Failed to fetch Hive data for ${community}:`, hiveError.message);
    }
    
    const hub = {
      communityUsername: communityData.hiveTag,
      communityName: communityData.name,
      location: communityData.latitude && communityData.longitude 
        ? `${communityData.latitude}, ${communityData.longitude}` 
        : 'Global',
      latitude: communityData.latitude ? parseFloat(communityData.latitude) : null,
      longitude: communityData.longitude ? parseFloat(communityData.longitude) : null,
      description: hiveData?.about || hiveData?.title || '',
      owner: hiveData?.team?.[0]?.[0] || hiveData?.admins?.[0] || 'unknown',
      language: hiveData?.lang || 'en',
      subscribers: hiveData?.subscribers || 0,
      activePosters: hiveData?.num_authors || 0,
      pendingPosts: hiveData?.num_pending || 0,
      createdAt: hiveData?.created || null,
      active: true
    };
    
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

/**
 * POST /api/hubs/register
 * Register a new community hub
 * Proxies request to external API
 */
router.post('/register', async (req, res) => {
  try {
    const { hiveTag, name, latitude, longitude } = req.body;
    
    // Validation
    if (!hiveTag || !hiveTag.startsWith('hive-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Hive community tag'
      });
    }
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Display name is required'
      });
    }
    
    // Verify the community exists on Hive blockchain
    try {
      const hiveData = await hiveService.client.call('bridge', 'get_community', {
        name: hiveTag
      });
      
      if (!hiveData || !hiveData.name) {
        return res.status(400).json({
          success: false,
          error: 'Community not found on Hive blockchain'
        });
      }
    } catch (hiveError) {
      console.error('Hive verification failed:', hiveError);
      return res.status(400).json({
        success: false,
        error: 'Failed to verify community on Hive blockchain'
      });
    }
    
    // Build external API URL for registration
    const REGISTER_API_URL = process.env.REGISTER_API_URL || 'https://menosoft.xyz/api/communities/register';
    const HIVETAXI_API_KEY = process.env.HIVETAXI_API_KEY;
    
    if (!HIVETAXI_API_KEY) {
      console.error('HIVETAXI_API_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: API key not set'
      });
    }
    
    // Register with external API
    const response = await fetch(REGISTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': HIVETAXI_API_KEY
      },
      body: JSON.stringify({
        hiveTag,
        name: name.trim(),
        latitude: latitude || null,
        longitude: longitude || null
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Registration failed');
    }
    
    res.json({
      success: true,
      message: 'Community registered successfully',
      community: data.community || { hiveTag, name }
    });
    
  } catch (error) {
    console.error('Failed to register community:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register community'
    });
  }
});

module.exports = router;
