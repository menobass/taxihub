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
   * Note: images.hive.blog always returns a default avatar, so errors should be rare.
   * This is mainly for debugging and network issues.
   */
  setupFallbacks() {
    document.querySelectorAll('img.avatar').forEach(img => {
      if (!img.dataset.fallbackSet) {
        img.dataset.fallbackSet = 'true';
        img.addEventListener('error', function(e) {
          // Log what's actually failing
          console.warn('Avatar load error for:', this.dataset.username, 'URL:', this.src);
          
          // Prevent infinite loop if fallback also fails
          if (!this.dataset.fallbackAttempted) {
            this.dataset.fallbackAttempted = 'true';
            // Use a simple SVG data URI as fallback
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23cccccc"/%3E%3Ctext x="50" y="50" font-size="40" text-anchor="middle" dy=".35em" fill="%23666666"%3E' + (this.dataset.username ? this.dataset.username.charAt(0).toUpperCase() : '?') + '%3C/text%3E%3C/svg%3E';
          }
        });
      }
    });
  }
};

// Make available globally
window.AvatarService = AvatarService;
