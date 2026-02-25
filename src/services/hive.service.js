const dhive = require('@hiveio/dhive');

class HiveService {
  constructor() {
    const rpcNodes = process.env.HIVE_RPC_NODES.split(',');
    this.client = new dhive.Client(rpcNodes);
    
    // Store posting keys securely (encrypted in production)
    this.postingKeys = new Map();
  }

  /**
   * Get or create client for hub
   */
  getClientForHub(hub) {
    return this.client; // RPC client is shared
  }

  /**
   * Get posting key for hub admin
   * In production, these should be encrypted in hub config
   */
  getPostingKey(hub) {
    // Check if key is cached
    if (this.postingKeys.has(hub.adminAccount)) {
      return this.postingKeys.get(hub.adminAccount);
    }

    // For MVP, fall back to env variable
    // In production, decrypt from hub config
    const keyString = process.env.HIVE_POSTING_KEY || hub.postingKey;
    
    if (!keyString) {
      throw new Error('No posting key available for hub admin');
    }

    const privateKey = dhive.PrivateKey.fromString(keyString);
    this.postingKeys.set(hub.adminAccount, privateKey);
    
    return privateKey;
  }

  /**
   * Get community details and metadata
   */
  async getCommunityDetails(hub) {
    try {
      const community = await this.client.call('bridge', 'get_community', {
        name: hub.community
      });
      return { success: true, data: community };
    } catch (error) {
      console.error('Failed to fetch community details:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List community subscribers with pagination
   * Note: list_subscribers does NOT accept 'sort' parameter
   * It returns subscribers in alphabetical order by default
   */
  async listSubscribers(hub, limit = 100, last = '') {
    try {
      const params = {
        community: hub.community,
        limit
      };
      
      // Only add 'last' if it's not empty (for pagination)
      if (last) {
        params.last = last;
      }
      
      const members = await this.client.call('bridge', 'list_subscribers', params);
      return { success: true, data: members };
    } catch (error) {
      console.error('Failed to list subscribers:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get roles for community (admins, mods, members, muted)
   */
  async listCommunityRoles(hub, last = '') {
    try {
      const roles = await this.client.call('bridge', 'list_community_roles', {
        community: hub.community,
        last
      });
      return { success: true, data: roles };
    } catch (error) {
      console.error('Failed to list community roles:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set user role (promote/demote)
   * @param {Object} hub - Hub configuration
   * @param {string} account - Target account
   * @param {string} role - Role: 'member', 'mod', 'admin'
   */
  async setRole(hub, account, role) {
    try {
      const json = [
        'setRole',
        {
          community: hub.community,
          account,
          role
        }
      ];

      const operation = ['custom_json', {
        required_auths: [],
        required_posting_auths: [hub.adminAccount],
        id: 'community',
        json: JSON.stringify(json)
      }];

      const privateKey = this.getPostingKey(hub);
      const result = await this.client.broadcast.sendOperations([operation], privateKey);
      return { success: true, result };
    } catch (error) {
      console.error('Failed to set role:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mute a user in the community
   * @param {Object} hub - Hub configuration
   * @param {string} account - Account to mute
   * @param {string} notes - Reason for muting
   */
  async muteUser(hub, account, notes) {
    try {
      const json = [
        'mutePost',
        {
          community: hub.community,
          account,
          notes
        }
      ];

      const operation = ['custom_json', {
        required_auths: [],
        required_posting_auths: [hub.adminAccount],
        id: 'community',
        json: JSON.stringify(json)
      }];

      const privateKey = this.getPostingKey(hub);
      const result = await this.client.broadcast.sendOperations([operation], privateKey);
      return { success: true, result };
    } catch (error) {
      console.error('Failed to mute user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unmute a user in the community
   * @param {Object} hub - Hub configuration
   * @param {string} account - Account to unmute
   */
  async unmuteUser(hub, account) {
    try {
      const json = [
        'unmutePost',
        {
          community: hub.community,
          account
        }
      ];

      const operation = ['custom_json', {
        required_auths: [],
        required_posting_auths: [hub.adminAccount],
        id: 'community',
        json: JSON.stringify(json)
      }];

      const privateKey = this.getPostingKey(hub);
      const result = await this.client.broadcast.sendOperations([operation], privateKey);
      return { success: true, result };
    } catch (error) {
      console.error('Failed to unmute user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Pin a post in the community
   */
  async pinPost(hub, account, permlink, notes = '') {
    try {
      const json = [
        'flagPost',
        {
          community: hub.community,
          account,
          permlink,
          notes
        }
      ];

      const operation = ['custom_json', {
        required_auths: [],
        required_posting_auths: [hub.adminAccount],
        id: 'community',
        json: JSON.stringify(json)
      }];

      const privateKey = this.getPostingKey(hub);
      const result = await this.client.broadcast.sendOperations([operation], privateKey);
      return { success: true, result };
    } catch (error) {
      console.error('Failed to pin post:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unpin a post in the community
   */
  async unpinPost(hub, account, permlink) {
    try {
      const json = [
        'unflagPost',
        {
          community: hub.community,
          account,
          permlink
        }
      ];

      const operation = ['custom_json', {
        required_auths: [],
        required_posting_auths: [hub.adminAccount],
        id: 'community',
        json: JSON.stringify(json)
      }];

      const privateKey = this.getPostingKey(hub);
      const result = await this.client.broadcast.sendOperations([operation], privateKey);
      return { success: true, result };
    } catch (error) {
      console.error('Failed to unpin post:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get community posts with various sorting options
   */
  async getCommunityPosts(hub, sort = 'created', limit = 20, observer = null) {
    try {
      // Note: get_ranked_posts has a max limit of 20
      const safeLimit = Math.min(limit, 20);
      
      const posts = await this.client.call('bridge', 'get_ranked_posts', {
        sort,
        tag: hub.community,  // Note: uses 'tag' not 'community'
        limit: safeLimit,
        observer: observer || hub.adminAccount
      });
      return { success: true, data: posts };
    } catch (error) {
      console.error('Failed to fetch community posts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get posts by a specific account
   */
  async getAccountPosts(hub, account, limit = 20) {
    try {
      const posts = await this.client.call('bridge', 'get_account_posts', {
        sort: 'posts',
        account,
        limit,
        observer: hub.adminAccount
      });
      return { success: true, data: posts };
    } catch (error) {
      console.error('Failed to fetch account posts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get post details with replies/comments
   */
  async getPostDetail(author, permlink) {
    try {
      const result = await this.client.call('bridge', 'get_discussion', {
        author,
        permlink
      });

      // API returns a flat map keyed by "author/permlink" where replies are string keys,
      // not nested objects. Recursively resolve them into a proper nested tree.
      const postKey = `${author}/${permlink}`;
      const post = result[postKey];

      if (!post) {
        throw new Error('Post not found');
      }

      const resolveReplies = (item) => {
        if (!item.replies || item.replies.length === 0) return item;
        return {
          ...item,
          replies: item.replies
            .map(key => result[key])
            .filter(Boolean)
            .map(resolveReplies)
        };
      };

      return { success: true, data: resolveReplies(post) };
    } catch (error) {
      console.error('Failed to fetch post detail:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a post in the community
   */
  async createPost(hub, title, body, tags = [], options = {}) {
    try {
      const permlink = options.permlink || this.generatePermlink(title);
      const json_metadata = {
        tags: ['taxihub', hub.slug, ...tags],
        app: 'taxihub/1.0.0',
        format: 'markdown'
      };

      const operation = ['comment', {
        parent_author: '',
        parent_permlink: tags[0] || 'taxihub',
        author: hub.adminAccount,
        permlink,
        title,
        body,
        json_metadata: JSON.stringify(json_metadata)
      }];

      const privateKey = this.getPostingKey(hub);
      const result = await this.client.broadcast.sendOperations([operation], privateKey);
      
      return { 
        success: true, 
        result,
        permlink,
        author: hub.adminAccount
      };
    } catch (error) {
      console.error('Failed to create post:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate permlink from title
   */
  generatePermlink(title) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 255);
    
    const timestamp = Date.now().toString(36);
    return `${slug}-${timestamp}`;
  }

  /**
   * Verify if an account exists
   */
  async accountExists(username) {
    try {
      const accounts = await this.client.database.getAccounts([username]);
      return accounts.length > 0;
    } catch (error) {
      console.error('Failed to check account existence:', error);
      return false;
    }
  }

  /**
   * Get account details
   */
  async getAccount(username) {
    try {
      const accounts = await this.client.database.getAccounts([username]);
      if (accounts.length === 0) {
        return { success: false, error: 'Account not found' };
      }
      return { success: true, data: accounts[0] };
    } catch (error) {
      console.error('Failed to fetch account:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new HiveService();
