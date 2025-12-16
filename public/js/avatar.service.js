// Avatar Service - Utility for Hive user avatars
const AvatarService = {
  /**
   * Get avatar URL for a Hive username
   * @param {string} username - Hive username
   * @param {string} size - Size variant: 'small', 'medium', 'large', 'original'
   * @returns {string} Avatar image URL
   */
  getAvatarUrl(username, size = 'medium') {
    const u = (username || '').trim().toLowerCase();
    const sizeMap = {
      small: 'small',
      medium: 'medium', 
      large: 'large',
      original: 'original'
    };
    const sizeParam = sizeMap[size] || 'medium';
    return `https://images.hive.blog/u/${u}/avatar/${sizeParam}`;
  },

  /**
   * Get small avatar (for lists, comments)
   * @param {string} username 
   * @returns {string}
   */
  getSmallAvatar(username) {
    return this.getAvatarUrl(username, 'small');
  },

  /**
   * Get medium avatar (for posts, cards)
   * @param {string} username 
   * @returns {string}
   */
  getMediumAvatar(username) {
    return this.getAvatarUrl(username, 'medium');
  },

  /**
   * Get large avatar (for profiles)
   * @param {string} username 
   * @returns {string}
   */
  getLargeAvatar(username) {
    return this.getAvatarUrl(username, 'large');
  },

  /**
   * Create an avatar img element
   * @param {string} username 
   * @param {string} size - 'small', 'medium', 'large'
   * @param {string} cssClass - Additional CSS class
   * @returns {string} HTML img element
   */
  createAvatarImg(username, size = 'medium', cssClass = '') {
    const url = this.getAvatarUrl(username, size);
    const sizeClass = `avatar-${size}`;
    return `<img src="${url}" alt="@${username}" class="avatar ${sizeClass} ${cssClass}" data-username="${username}" />`;
  },

  /**
   * Create avatar with username link
   * @param {string} username 
   * @param {string} size 
   * @returns {string} HTML with avatar and username
   */
  createAvatarWithName(username, size = 'medium') {
    const avatar = this.createAvatarImg(username, size);
    return `
      <div class="avatar-with-name">
        ${avatar}
        <span class="username">@${username}</span>
      </div>
    `;
  },

  /**
   * Setup fallback handlers for avatar images (call after DOM update)
   */
  setupFallbacks() {
    document.querySelectorAll('img.avatar').forEach(img => {
      if (!img.dataset.fallbackSet) {
        img.dataset.fallbackSet = 'true';
        img.addEventListener('error', function() {
          this.src = '/assets/default-avatar.png';
        });
      }
    });
  }
};

// Make available globally
window.AvatarService = AvatarService;
