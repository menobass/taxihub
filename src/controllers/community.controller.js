const hiveService = require('../services/hive.service');
const hubService = require('../services/hub.service');

/**
 * Get community information
 */
exports.getCommunity = async (req, res) => {
  try {
    const result = await hiveService.getCommunityDetails(req.hub);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch community details' });
  }
};

/**
 * Get user's role in the community
 */
exports.getUserRole = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const result = await hiveService.listSubscribers(req.hub, 100, '');
    
    if (result.success) {
      // Find the user in subscribers list
      const user = result.data.find(sub => sub[0] === username);
      
      if (user) {
        res.json({ 
          username: user[0],
          role: user[1],  // guest, member, mod, admin, owner
          title: user[2],
          joined: user[3]
        });
      } else {
        // User not found in community - they're not subscribed
        res.json({ username, role: 'none', title: null, joined: null });
      }
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user role' });
  }
};

/**
 * Get community members/subscribers
 */
exports.getMembers = async (req, res) => {
  try {
    const { limit = 100, last = '' } = req.query;
    const result = await hiveService.listSubscribers(req.hub, parseInt(limit), last);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

/**
 * Get community roles (admins, mods, etc.)
 */
exports.getRoles = async (req, res) => {
  try {
    const { last = '' } = req.query;
    const result = await hiveService.listCommunityRoles(req.hub, last);
    
    if (result.success) {
      // Transform [[account, role, title], ...] into categorized object
      const roles = {
        admins: [],
        mods: [],
        members: [],
        muted: []
      };
      
      result.data.forEach(([account, role, title]) => {
        // Skip the community owner account (it's not a person)
        if (role === 'owner') return;
        
        switch (role) {
          case 'admin':
            roles.admins.push(account);
            break;
          case 'mod':
            roles.mods.push(account);
            break;
          case 'member':
            roles.members.push(account);
            break;
          case 'muted':
            roles.muted.push(account);
            break;
        }
      });
      
      res.json(roles);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

/**
 * Update user role
 */
exports.updateRole = async (req, res) => {
  try {
    const { account, role } = req.body;

    if (!account || !role) {
      return res.status(400).json({ error: 'Account and role are required' });
    }

    const validRoles = ['member', 'mod', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: member, mod, or admin' });
    }

    // Verify account exists
    const exists = await hiveService.accountExists(account);
    if (!exists) {
      return res.status(404).json({ error: 'Account not found on Hive blockchain' });
    }

    const result = await hiveService.setRole(req.hub, account, role);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Successfully set ${account} to ${role}`,
        result: result.result 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

/**
 * Mute a user
 */
exports.muteUser = async (req, res) => {
  try {
    const { account, notes } = req.body;

    if (!account) {
      return res.status(400).json({ error: 'Account is required' });
    }

    const result = await hiveService.muteUser(req.hub, account, notes || 'Policy violation');
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Successfully muted ${account}`,
        result: result.result 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to mute user' });
  }
};

/**
 * Unmute a user
 */
exports.unmuteUser = async (req, res) => {
  try {
    const { account } = req.body;

    if (!account) {
      return res.status(400).json({ error: 'Account is required' });
    }

    const result = await hiveService.unmuteUser(req.hub, account);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Successfully unmuted ${account}`,
        result: result.result 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to unmute user' });
  }
};

/**
 * Get community posts
 */
exports.getPosts = async (req, res) => {
  try {
    const { sort = 'created', limit = 20 } = req.query;
    const result = await hiveService.getCommunityPosts(req.hub, sort, parseInt(limit));
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

/**
 * Create a post
 */
exports.createPost = async (req, res) => {
  try {
    const { title, body, tags } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const result = await hiveService.createPost(req.hub, title, body, tags || []);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Successfully created post',
        author: result.author,
        permlink: result.permlink,
        result: result.result 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
};

/**
 * Pin a post
 */
exports.pinPost = async (req, res) => {
  try {
    const { account, permlink, notes } = req.body;

    if (!account || !permlink) {
      return res.status(400).json({ error: 'Account and permlink are required' });
    }

    const result = await hiveService.pinPost(req.hub, account, permlink, notes);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Successfully pinned post',
        result: result.result 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to pin post' });
  }
};

/**
 * Unpin a post
 */
exports.unpinPost = async (req, res) => {
  try {
    const { account, permlink } = req.body;

    if (!account || !permlink) {
      return res.status(400).json({ error: 'Account and permlink are required' });
    }

    const result = await hiveService.unpinPost(req.hub, account, permlink);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Successfully unpinned post',
        result: result.result 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to unpin post' });
  }
};

/**
 * Get post details with replies
 */
exports.getPostDetail = async (req, res) => {
  try {
    const { author, permlink } = req.query;

    if (!author || !permlink) {
      return res.status(400).json({ error: 'Author and permlink are required' });
    }

    const result = await hiveService.getPostDetail(author, permlink);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post details' });
  }
};

/**
 * Get user account details
 */
exports.getAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const result = await hiveService.getAccount(username);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};
