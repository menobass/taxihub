const fs = require('fs');
const path = require('path');

class HubService {
  constructor() {
    this.hubsDir = path.join(__dirname, '../../hubs');
    this.hubCache = new Map();
  }

  /**
   * Load hub configuration from file
   */
  loadHub(slug) {
    // Check cache first
    if (this.hubCache.has(slug)) {
      return this.hubCache.get(slug);
    }

    const hubPath = path.join(this.hubsDir, `${slug}.json`);
    
    if (!fs.existsSync(hubPath)) {
      return null;
    }

    try {
      const hubData = JSON.parse(fs.readFileSync(hubPath, 'utf8'));
      
      if (!hubData.active) {
        return null;
      }

      this.hubCache.set(slug, hubData);
      return hubData;
    } catch (error) {
      console.error(`Failed to load hub ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get all active hubs
   */
  getAllHubs() {
    if (!fs.existsSync(this.hubsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.hubsDir);
    const hubs = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const slug = file.replace('.json', '');
        const hub = this.loadHub(slug);
        if (hub) {
          hubs.push(hub);
        }
      }
    }

    return hubs;
  }

  /**
   * Create new hub configuration
   */
  createHub(hubData) {
    const slug = hubData.slug;
    const hubPath = path.join(this.hubsDir, `${slug}.json`);

    if (fs.existsSync(hubPath)) {
      throw new Error('Hub already exists');
    }

    // Validate required fields
    const required = ['slug', 'name', 'community', 'adminAccount'];
    for (const field of required) {
      if (!hubData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Add metadata
    const hub = {
      ...hubData,
      createdAt: new Date().toISOString(),
      active: true,
      settings: hubData.settings || {
        allowDriverPosts: true,
        requireApproval: false,
        maxPostsPerDay: 1
      },
      branding: hubData.branding || {
        primaryColor: '#e31337',
        logo: ''
      }
    };

    // Ensure hubs directory exists
    if (!fs.existsSync(this.hubsDir)) {
      fs.mkdirSync(this.hubsDir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(hubPath, JSON.stringify(hub, null, 2));
    
    // Clear cache
    this.hubCache.delete(slug);

    return hub;
  }

  /**
   * Update hub configuration
   */
  updateHub(slug, updates) {
    const hub = this.loadHub(slug);
    
    if (!hub) {
      throw new Error('Hub not found');
    }

    const updatedHub = {
      ...hub,
      ...updates,
      slug: hub.slug, // Prevent slug changes
      updatedAt: new Date().toISOString()
    };

    const hubPath = path.join(this.hubsDir, `${slug}.json`);
    fs.writeFileSync(hubPath, JSON.stringify(updatedHub, null, 2));

    // Clear cache
    this.hubCache.delete(slug);

    return updatedHub;
  }

  /**
   * Deactivate hub
   */
  deactivateHub(slug) {
    return this.updateHub(slug, { active: false });
  }

  /**
   * Get hub registry (list of available hubs for selector)
   */
  getHubRegistry() {
    const registryPath = path.join(this.hubsDir, 'registry.json');
    
    if (!fs.existsSync(registryPath)) {
      return [];
    }

    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      // Return only active hubs, sorted by name
      return (registry.hubs || [])
        .filter(hub => hub.active)
        .sort((a, b) => a.communityName.localeCompare(b.communityName));
    } catch (error) {
      console.error('Failed to load hub registry:', error);
      return [];
    }
  }

  /**
   * Validate hub slug format
   */
  isValidSlug(slug) {
    return /^[a-z0-9-]+$/.test(slug);
  }

  /**
   * Generate slug from name
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.hubCache.clear();
  }
}

module.exports = new HubService();
