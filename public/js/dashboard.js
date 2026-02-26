// Dashboard manager
class Dashboard {
  constructor() {
    this.currentView = 'overview';
    this.communityData = null;
    // Pagination state
    this.postsState = {
      currentSort: 'created',
      allPosts: [],
      lastAuthor: null,
      lastPermlink: null,
      hasMore: true,
      isLoading: false
    };
  }

  // Load community overview
  async loadOverview() {
    try {
      const community = await api.getCommunity();
      const subscribers = await api.getMembers(); // Returns [[account, role, title, date], ...]
      this.communityData = community;

      // Filter subscribers by role
      const allSubscribers = subscribers || [];
      const totalSubs = allSubscribers.length;
      const drivers = allSubscribers.filter(sub => sub[1] === 'member'); // role === 'member'
      const pendingSubscribers = allSubscribers.filter(sub => sub[1] === 'guest'); // role === 'guest' (pending approval)
      
      // Update stats
      document.getElementById('stat-subscribers').textContent = totalSubs;
      document.getElementById('stat-drivers').textContent = drivers.length;
      document.getElementById('stat-recent').textContent = pendingSubscribers.length;
      document.getElementById('stat-posts').textContent = community.num_pending || '0';
    } catch (error) {
      console.error('Failed to load overview:', error);
      this.showError(t('messages.operationFailed'));
    }
  }

  // Load subscribers (guests without 'member' role)
  async loadSubscribers() {
    try {
      const allMembers = await api.getMembers();
      // Subscribers are those with 'guest' role (not admin, mod, or member)
      const subscribers = allMembers.filter(m => m[1] === 'guest');
      const container = document.getElementById('subscribers-list');

      if (!subscribers || subscribers.length === 0) {
        container.innerHTML = `<p class="loading">${t('subscribers.noSubscribers')}</p>`;
        return;
      }

      // Sort by join date (most recent first)
      subscribers.sort((a, b) => new Date(b[3]) - new Date(a[3]));

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('subscribers.account')}</th>
              <th>${t('subscribers.userTitle')}</th>
              <th>${t('subscribers.joined')}</th>
              <th>${t('subscribers.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${subscribers.map(sub => `
              <tr>
                <td><strong>@${sub[0]}</strong></td>
                <td>${sub[2] || t('common.none')}</td>
                <td>${sub[3] ? new Date(sub[3]).toLocaleString() : 'N/A'}</td>
                <td>
                  <button class="btn btn-small btn-primary" data-action="promote" data-account="${sub[0]}">
                    ${t('subscribers.promoteToDriver')}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Add event listeners to promote buttons
      container.querySelectorAll('[data-action="promote"]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.promoteToDriver(btn.dataset.account);
        });
      });
    } catch (error) {
      console.error('Failed to load subscribers:', error);
      this.showError(t('messages.operationFailed'));
    }
  }

  // Load drivers (members with 'member' role)
  async loadDrivers() {
    try {
      const allMembers = await api.getMembers();
      const drivers = allMembers.filter(m => m[1] === 'member'); // role === 'member'
      const container = document.getElementById('drivers-list');

      if (!drivers || drivers.length === 0) {
        container.innerHTML = `<p class="loading">${t('drivers.noDrivers')}</p>`;
        return;
      }

      // Sort by join date (most recent first)
      drivers.sort((a, b) => new Date(b[3]) - new Date(a[3]));

      const isAdmin = auth.isAdmin();
      const actionsHeader = isAdmin ? `<th>${t('drivers.actions')}</th>` : '';

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('drivers.account')}</th>
              <th>${t('drivers.userTitle')}</th>
              <th>${t('drivers.joined')}</th>
              ${actionsHeader}
            </tr>
          </thead>
          <tbody>
            ${drivers.map(driver => `
              <tr>
                <td><strong>@${driver[0]}</strong></td>
                <td>${driver[2] || t('common.none')}</td>
                <td>${driver[3] ? new Date(driver[3]).toLocaleString() : 'N/A'}</td>
                ${isAdmin ? `
                <td>
                  <button class="btn btn-small btn-secondary" data-action="demote" data-account="${driver[0]}">
                    ${t('drivers.demote')}
                  </button>
                  <button class="btn btn-small btn-primary" data-action="promote-mod" data-account="${driver[0]}">
                    ${t('drivers.promoteToMod')}
                  </button>
                </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Add event listeners to action buttons (only if admin)
      if (isAdmin) {
        container.querySelectorAll('[data-action="demote"]').forEach(btn => {
          btn.addEventListener('click', () => {
            this.demoteDriver(btn.dataset.account);
          });
        });
        
        container.querySelectorAll('[data-action="promote-mod"]').forEach(btn => {
          btn.addEventListener('click', () => {
            this.promoteToMod(btn.dataset.account);
          });
        });
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
      this.showError(t('messages.operationFailed'));
    }
  }

  // Promote subscriber to driver
  async promoteToDriver(account) {
    if (confirm(t('subscribers.confirmPromote', { account }))) {
      await this.updateRole(account, 'member');
    }
  }

  // Demote driver to subscriber
  async demoteDriver(account) {
    if (confirm(t('drivers.confirmDemote', { account }))) {
      await this.updateRole(account, '');
    }
  }

  // Promote driver to moderator
  async promoteToMod(account) {
    if (confirm(t('drivers.confirmPromoteToMod', { account }))) {
      await this.updateRole(account, 'mod');
    }
  }

  // Load roles
  async loadRoles() {
    try {
      const roles = await api.getRoles();
      
      // Update lists
      this.updateRoleList('admins-list', roles.admins || []);
      this.updateRoleList('mods-list', roles.mods || []);
      this.updateRoleList('members-list', (roles.members || []).slice(0, 20)); // Limit to 20
      this.updateRoleList('muted-list', roles.muted || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
      this.showError('Failed to load roles');
    }
  }

  // Update role list
  updateRoleList(listId, accounts) {
    const list = document.getElementById(listId);
    
    if (!accounts || accounts.length === 0) {
      list.innerHTML = `<li style="color: #95a5a6;">${t('roles.none')}</li>`;
      return;
    }

    list.innerHTML = accounts.map(account => `
      <li>@${account}</li>
    `).join('');
  }

  // Load posts (reset pagination)
  async loadPosts() {
    const sort = document.getElementById('posts-sort').value;
    
    // Reset pagination when sort changes
    if (sort !== this.postsState.currentSort) {
      this.postsState.currentSort = sort;
      this.postsState.allPosts = [];
      this.postsState.lastAuthor = null;
      this.postsState.lastPermlink = null;
      this.postsState.hasMore = true;
    }
    
    // Load the first batch
    await this.loadMorePosts();
  }

  // Load more posts (pagination)
  async loadMorePosts() {
    if (this.postsState.isLoading || !this.postsState.hasMore) {
      return;
    }

    this.postsState.isLoading = true;
    const container = document.getElementById('posts-container');
    
    try {
      const newPosts = await api.getPosts(
        this.postsState.currentSort,
        20,
        this.postsState.lastAuthor,
        this.postsState.lastPermlink
      );

      if (!newPosts || newPosts.length === 0) {
        this.postsState.hasMore = false;
        if (this.postsState.allPosts.length === 0) {
          container.innerHTML = '<p class="loading">No posts found</p>';
        }
        return;
      }

      // Add new posts to state
      this.postsState.allPosts.push(...newPosts);
      
      // Update pagination markers
      const lastPost = newPosts[newPosts.length - 1];
      this.postsState.lastAuthor = lastPost.author;
      this.postsState.lastPermlink = lastPost.permlink;
      
      // If we got fewer posts than requested, we've reached the end
      if (newPosts.length < 20) {
        this.postsState.hasMore = false;
      }

      // Render all posts accumulated so far
      container.innerHTML = this.postsState.allPosts.map(post => `
        <div class="post-card" data-author="${post.author}" data-permlink="${post.permlink}">
          <div class="post-header">
            ${AvatarService.createAvatarImg(post.author, 'medium')}
            <div class="post-author-info">
              <span class="post-author">@${post.author}</span>
              <span class="post-timestamp">${new Date(post.created).toLocaleDateString()}</span>
            </div>
          </div>
          <h3 class="post-title">${post.title}</h3>
          <p class="post-excerpt">${post.body?.substring(0, 200)}...</p>
          <div class="post-footer">
            <span class="post-stat">💰 $${post.payout?.toFixed(2) || '0.00'}</span>
            <span class="post-stat">👍 ${post.stats?.total_votes || 0}</span>
            <span class="post-stat">💬 ${post.children || 0}</span>
          </div>
        </div>
      `).join('');

      // Add "Load More" button if there are more posts
      if (this.postsState.hasMore) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'btn btn-primary btn-load-more';
        loadMoreBtn.textContent = 'Load More Posts';
        loadMoreBtn.style.marginTop = '20px';
        loadMoreBtn.addEventListener('click', () => this.loadMorePosts());
        container.appendChild(loadMoreBtn);
      }

      // Setup avatar fallbacks
      AvatarService.setupFallbacks();

      // Add click event listeners to post cards
      container.querySelectorAll('.post-card').forEach(card => {
        card.addEventListener('click', () => {
          const author = card.dataset.author;
          const permlink = card.dataset.permlink;
          this.showPostDetail(author, permlink);
        });
      });
    } catch (error) {
      console.error('Failed to load posts:', error);
      this.showError('Failed to load posts');
    } finally {
      this.postsState.isLoading = false;
    }
  }

  // Show post detail modal
  async showPostDetail(author, permlink) {
    const modal = document.getElementById('post-modal');
    const content = document.getElementById('post-detail-content');
    
    modal.style.display = 'flex';
    content.innerHTML = '<p class="loading">Loading post...</p>';
    
    try {
      const post = await api.getPostDetail(author, permlink);
      
      // Render post details
      content.innerHTML = `
        <div class="post-detail-header">
          <div class="post-header">
            ${AvatarService.createAvatarImg(post.author, 'large')}
            <div class="post-author-info">
              <span class="post-author">@${post.author}</span>
              <span class="post-timestamp">${new Date(post.created).toLocaleString()}${post.category ? ` • ${post.category}` : ''}</span>
            </div>
          </div>
          <h2 class="post-detail-title">${post.title}</h2>
        </div>
        
        <div class="post-detail-body">
          ${this.renderMarkdown(post.body)}
        </div>
        
        <div class="post-detail-stats">
          <div>💰 Payout: $${post.payout?.toFixed(2) || '0.00'}</div>
          <div>👍 Votes: ${post.stats?.total_votes || 0}</div>
          <div>💬 Comments: ${post.children || 0}</div>
        </div>
        
        ${this.renderReplies(post.replies || [])}
      `;
      
      // Setup avatar fallbacks
      AvatarService.setupFallbacks();
    } catch (error) {
      console.error('Failed to load post detail:', error);
      content.innerHTML = '<p class="error">Failed to load post details</p>';
    }
  }

  // Render markdown (basic conversion)
  renderMarkdown(text) {
    if (!text) return '';
    
    // Convert markdown images
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    // Convert markdown links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Convert line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
  }

  // Render replies recursively
  renderReplies(replies, depth = 0) {
    if (!replies || replies.length === 0) {
      if (depth === 0) {
        return '<div class="post-replies"><h3>No comments yet</h3></div>';
      }
      return '';
    }
    
    const marginLeft = depth > 0 ? `margin-left: ${depth * 1.5}rem;` : '';
    
    return `
      <div class="post-replies" ${depth === 0 ? '' : `style="${marginLeft}"`}>
        ${depth === 0 ? `<h3>Comments (${replies.length})</h3>` : ''}
        ${replies.map(reply => `
          <div class="reply-item" style="${marginLeft}">
            <div class="reply-header">
              ${AvatarService.createAvatarImg(reply.author, 'small')}
              <div class="reply-author-info">
                <span class="username">@${reply.author}</span>
                <span class="reply-timestamp">${new Date(reply.created).toLocaleString()}</span>
              </div>
            </div>
            <div class="reply-body">${this.renderMarkdown(reply.body)}</div>
            ${reply.replies && reply.replies.length > 0 ? this.renderReplies(reply.replies, depth + 1) : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Update role
  async updateRole(account, role) {
    try {
      const result = await api.updateRole(account, role);
      this.showSuccess(`${t('messages.roleUpdated')} @${account}`);
      
      // Reload current view
      this.switchView(this.currentView);
    } catch (error) {
      this.showError(error.message || t('messages.roleUpdateFailed'));
    }
  }

  // Mute user
  async muteUser(account, notes) {
    try {
      await api.muteUser(account, notes);
      this.showSuccess(`${t('messages.userMuted')} @${account}`);
    } catch (error) {
      this.showError(error.message || t('messages.operationFailed'));
    }
  }

  // Unmute user
  async unmuteUser(account) {
    try {
      await api.unmuteUser(account);
      this.showSuccess(`${t('messages.userUnmuted')} @${account}`);
    } catch (error) {
      this.showError(error.message || t('messages.operationFailed'));
    }
  }

  // Switch view
  switchView(viewName) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.view === viewName) {
        item.classList.add('active');
      }
    });

    // Update active view
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');

    this.currentView = viewName;

    // Load data for view
    switch (viewName) {
      case 'overview':
        this.loadOverview();
        break;
      case 'subscribers':
        this.loadSubscribers();
        break;
      case 'drivers':
        this.loadDrivers();
        break;
      case 'roles':
        this.loadRoles();
        break;
      case 'posts':
        this.loadPosts();
        break;
    }
  }

  // Show role modal
  showRoleModal(account, currentRole) {
    // Implement modal logic here
    const newRole = prompt(`Change role for @${account} (current: ${currentRole})\nEnter: member, mod, or admin`);
    if (newRole && ['member', 'mod', 'admin'].includes(newRole)) {
      this.updateRole(account, newRole);
    }
  }

  // Show success message
  showSuccess(message) {
    alert(`✅ ${message}`);
  }

  // Show error message
  showError(message) {
    alert(`❌ ${message}`);
  }
}

// Export dashboard instance
const dashboard = new Dashboard();
