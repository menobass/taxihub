const hubService = require('../services/hub.service');

/**
 * Middleware to load hub context
 * Supports: 
 *   1. X-Hub-Community header (community username like hive-138395)
 *   2. Falls back to default hub from environment
 */
module.exports = (req, res, next) => {
  // Check for hub community in header first
  const hubCommunity = req.headers['x-hub-community'];
  
  let hub = null;
  let hubSlug = null;
  
  if (hubCommunity) {
    // Look up hub by community username in registry
    const registry = hubService.getHubRegistry();
    const registryHub = registry.find(h => h.communityUsername === hubCommunity);
    
    if (registryHub) {
      // Try to load the hub config file based on community username
      // Convert hive-138395 to a slug format for file lookup
      const slugFromCommunity = hubCommunity.replace('hive-', 'hive-');
      
      // For now, create a hub object from registry + defaults
      hub = {
        slug: hubCommunity,
        name: registryHub.communityName,
        community: hubCommunity,
        adminAccount: registryHub.owner,
        language: registryHub.language,
        active: registryHub.active,
        settings: {
          allowDriverPosts: true,
          requireApproval: false,
          maxPostsPerDay: 1
        }
      };
      hubSlug = hubCommunity;
    }
  }
  
  // Fall back to default hub
  if (!hub) {
    hubSlug = process.env.DEFAULT_HUB_SLUG || 'global-taxi';
    hub = hubService.loadHub(hubSlug);
  }

  if (!hub) {
    return res.status(404).json({ 
      error: 'Hub not found',
      message: `Requested hub is not configured. Please check your hub configuration.`
    });
  }

  // Attach hub to request object
  req.hub = hub;
  req.hubSlug = hubSlug;

  next();
};
