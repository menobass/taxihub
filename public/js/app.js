// Main application
class App {
  constructor() {
    this.currentHub = null;
    this.init();
  }

  async init() {
    // Initialize i18n first
    await i18n.init();

    // Check authentication on load
    const isAuthenticated = await auth.verifySession();
    
    if (isAuthenticated) {
      // Check if user has a hub selected
      const savedHub = api.getCurrentHub();
      if (savedHub) {
        this.currentHub = savedHub;
        await this.showDashboard();
      } else {
        await this.showHubSelector();
      }
    } else {
      this.showLogin();
    }

    // Setup event listeners
    this.setupEventListeners();
    this.setupLanguageSwitcher();
  }

  setupEventListeners() {
    // Login
    const loginBtn = document.getElementById('keychain-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.handleLogin());
    }

    // Logout buttons (both in hub selector and dashboard)
    document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
    document.getElementById('hub-selector-logout')?.addEventListener('click', () => this.handleLogout());

    // Back to hub selector
    document.getElementById('back-to-hubs')?.addEventListener('click', () => {
      api.clearCurrentHub();
      this.showHubSelector();
    });

    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        dashboard.switchView(view);
      });
    });

    // Refresh buttons
    document.getElementById('refresh-members')?.addEventListener('click', () => {
      dashboard.loadMembers();
    });

    document.getElementById('refresh-roles')?.addEventListener('click', () => {
      dashboard.loadRoles();
    });

    // Role update
    document.getElementById('update-role-btn')?.addEventListener('click', () => {
      const account = document.getElementById('role-account').value.trim();
      const role = document.getElementById('role-select').value;

      if (!account || !role) {
        alert('Please enter account and select role');
        return;
      }

      dashboard.updateRole(account, role);
    });

    // Mute user
    document.getElementById('mute-user-btn')?.addEventListener('click', () => {
      const account = document.getElementById('mute-account').value.trim();
      const notes = document.getElementById('mute-notes').value.trim();

      if (!account) {
        alert('Please enter account name');
        return;
      }

      dashboard.muteUser(account, notes || 'Policy violation');
    });

    // Unmute user
    document.getElementById('unmute-user-btn')?.addEventListener('click', () => {
      const account = document.getElementById('unmute-account').value.trim();

      if (!account) {
        alert('Please enter account name');
        return;
      }

      dashboard.unmuteUser(account);
    });

    // Posts sort
    document.getElementById('posts-sort')?.addEventListener('change', () => {
      dashboard.loadPosts();
    });

    // Member search
    document.getElementById('member-search')?.addEventListener('input', (e) => {
      this.filterMembers(e.target.value);
    });

    // Post modal close button
    document.getElementById('post-modal-close')?.addEventListener('click', () => {
      document.getElementById('post-modal').style.display = 'none';
    });

    // Close modal when clicking outside
    document.getElementById('post-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'post-modal') {
        document.getElementById('post-modal').style.display = 'none';
      }
    });

    // Register Hub Modal
    this.setupRegisterHubModal();
  }

  setupRegisterHubModal() {
    const modal = document.getElementById('register-hub-modal');
    const openBtn = document.getElementById('register-hub-btn');
    const closeBtn = document.getElementById('register-modal-close');
    const cancelBtn = document.getElementById('register-cancel');
    const form = document.getElementById('register-hub-form');

    // Open modal
    openBtn?.addEventListener('click', () => {
      modal.style.display = 'flex';
      this.resetRegisterForm();
    });

    // Close modal
    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    cancelBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Close when clicking outside
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Form submission
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegisterHub();
    });
  }

  resetRegisterForm() {
    const form = document.getElementById('register-hub-form');
    form?.reset();
    document.getElementById('register-error').style.display = 'none';
    document.getElementById('register-success').style.display = 'none';
    document.getElementById('register-submit').disabled = false;
  }

  async handleRegisterHub() {
    const hiveTag = document.getElementById('register-hive-tag').value.trim();
    const name = document.getElementById('register-name').value.trim();
    const latitude = document.getElementById('register-latitude').value.trim();
    const longitude = document.getElementById('register-longitude').value.trim();

    const errorEl = document.getElementById('register-error');
    const successEl = document.getElementById('register-success');
    const submitBtn = document.getElementById('register-submit');

    // Validation
    if (!hiveTag || !hiveTag.startsWith('hive-')) {
      errorEl.textContent = t('registerHub.invalidTag');
      errorEl.style.display = 'block';
      return;
    }

    if (!name) {
      errorEl.textContent = t('registerHub.invalidName');
      errorEl.style.display = 'block';
      return;
    }

    // Hide previous messages
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>${t('common.loading')}</span>`;

    try {
      const payload = {
        hiveTag,
        name,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      };

      const response = await api.registerHub(payload);

      if (response.success) {
        successEl.textContent = t('registerHub.success');
        successEl.style.display = 'block';

        // Refresh hubs list after short delay
        setTimeout(() => {
          document.getElementById('register-hub-modal').style.display = 'none';
          this.loadHubs();
        }, 1500);
      } else {
        throw new Error(response.message || t('registerHub.error'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      errorEl.textContent = error.message || t('registerHub.error');
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span data-i18n="registerHub.submit">${t('registerHub.submit')}</span>`;
    }
  }

  setupLanguageSwitcher() {
    // Dashboard language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lang = e.target.dataset.lang;
        await i18n.changeLanguage(lang);
        
        // Update active state
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Login page language buttons
    document.querySelectorAll('.lang-btn-login').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lang = e.target.dataset.lang;
        await i18n.changeLanguage(lang);
        
        // Update active state
        document.querySelectorAll('.lang-btn-login').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Set initial active state based on current language
    const currentLang = i18n.getCurrentLanguage();
    document.querySelectorAll(`[data-lang="${currentLang}"]`).forEach(btn => {
      btn.classList.add('active');
    });

    // Listen for language change events
    window.addEventListener('languageChanged', () => {
      // Reload current view to apply translations
      if (dashboard.currentView) {
        dashboard.switchView(dashboard.currentView);
      }
    });
  }

  async handleLogin() {
    try {
      await auth.loginWithKeychain();
      await this.showHubSelector();
    } catch (error) {
      alert(t('messages.loginFailed') + `: ${error.message}`);
    }
  }

  handleLogout() {
    auth.logout();
    api.clearCurrentHub();
    this.currentHub = null;
    this.showLogin();
  }

  showLogin() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('hub-selector-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.remove('active');
  }

  async showHubSelector() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('hub-selector-screen').classList.add('active');
    document.getElementById('dashboard-screen').classList.remove('active');
    
    // Update username display in hub selector
    document.getElementById('hub-selector-username').textContent = `@${auth.getUsername()}`;
    
    // Load hubs
    await this.loadHubs();
  }

  async loadHubs() {
    const container = document.getElementById('hubs-grid');
    container.innerHTML = `<p class="loading">${t('common.loading')}</p>`;
    
    try {
      const response = await api.getHubs();
      const hubs = response.hubs || [];
      
      if (hubs.length === 0) {
        container.innerHTML = `<p class="loading">${t('hubSelector.noHubs')}</p>`;
        return;
      }
      
      container.innerHTML = hubs.map(hub => `
        <div class="hub-card" data-community="${hub.communityUsername}">
          <div class="hub-card-header">
            ${AvatarService.createAvatarImg(hub.communityUsername, 'large')}
            <div class="hub-card-info">
              <h3>${hub.communityName}</h3>
              <div class="location">📍 ${hub.location === 'Global' ? t('hubSelector.global') : hub.location}</div>
            </div>
          </div>
          <p class="hub-card-description">${hub.description || t('hubSelector.noDescription')}</p>
          <div class="hub-card-stats">
            <div class="hub-card-stat">
              <span class="stat-icon">👥</span>
              <span class="stat-value">${hub.subscribers || 0}</span>
              <span>${t('hubSelector.subscribers')}</span>
            </div>
            <div class="hub-card-stat">
              <span class="stat-icon">✍️</span>
              <span class="stat-value">${hub.activePosters || 0}</span>
              <span>${t('hubSelector.authors')}</span>
            </div>
          </div>
          <div class="hub-card-footer">
            <div class="hub-card-owner">
              ${AvatarService.createAvatarImg(hub.owner, 'small')}
              <span>@${hub.owner}</span>
            </div>
            <span class="hub-card-language">${hub.language?.toUpperCase() || 'EN'}</span>
          </div>
        </div>
      `).join('');
      
      // Setup avatar fallbacks
      AvatarService.setupFallbacks();
      
      // Add click listeners to hub cards
      container.querySelectorAll('.hub-card').forEach(card => {
        card.addEventListener('click', () => {
          const community = card.dataset.community;
          this.selectHub(community, hubs.find(h => h.communityUsername === community));
        });
      });
    } catch (error) {
      console.error('Failed to load hubs:', error);
      container.innerHTML = `<p class="loading error">${t('messages.operationFailed')}</p>`;
    }
  }

  async selectHub(communityUsername, hubData) {
    api.setCurrentHub(communityUsername);
    this.currentHub = hubData;
    await this.showDashboard();
  }

  async showDashboard() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('hub-selector-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');
    
    // Update hub name in navbar
    const hubName = this.currentHub?.communityName || 'TaxiHub';
    document.getElementById('current-hub-name').textContent = `🚕 ${hubName}`;
    
    // Update username display
    document.getElementById('username-display').textContent = `@${auth.getUsername()}`;
    
    // Fetch and set user role
    try {
      const roleData = await api.getUserRole(auth.getUsername());
      auth.setUserRole(roleData.role || 'none');
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      auth.setUserRole('none');
    }
    
    // Apply role-based UI
    this.applyRoleBasedUI();
    
    // Load initial view
    dashboard.switchView('overview');
  }

  applyRoleBasedUI() {
    const isAdmin = auth.isAdmin();
    const role = auth.getUserRole();
    
    // Hide menu items for non-admins: Subscribers, Roles, Moderation
    const adminOnlyViews = ['subscribers', 'roles', 'moderation'];
    adminOnlyViews.forEach(view => {
      const menuItem = document.querySelector(`[data-view="${view}"]`);
      if (menuItem) {
        menuItem.closest('li').style.display = isAdmin ? '' : 'none';
      }
    });
    
    // Show/hide admin-only elements throughout the page
    document.querySelectorAll('[data-admin-only]').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });

    // Update role badge next to username
    const roleDisplay = document.getElementById('role-display');
    if (roleDisplay) {
      // Use translated role label
      const roleLabel = t(`roleLabels.${role}`) || role;
      roleDisplay.textContent = roleLabel;
      roleDisplay.className = `role-badge role-${role}`;
    }
  }

  filterMembers(query) {
    const rows = document.querySelectorAll('#members-tbody tr');
    const searchTerm = query.toLowerCase();

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new App();
  });
} else {
  new App();
}
