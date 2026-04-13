// Authentication manager
class Auth {
  constructor() {
    this.username = localStorage.getItem('username');
    this.userRole = localStorage.getItem('userRole') || 'guest';
    this.isAuthenticated = !!api.token;
  }

  // Check if user is admin/mod/owner (can manage community)
  isAdmin() {
    return ['owner', 'admin', 'mod'].includes(this.userRole);
  }

  // Get user role
  getUserRole() {
    return this.userRole;
  }

  // Set user role
  setUserRole(role) {
    this.userRole = role;
    localStorage.setItem('userRole', role);
  }

  // Check if Hive Keychain is available
  isKeychainAvailable() {
    return typeof window.hive_keychain !== 'undefined';
  }

  // Login with Hive Keychain
  async loginWithKeychain() {
    if (!this.isKeychainAvailable()) {
      throw new Error('Hive Keychain extension not found. Please install it first.');
    }

    const username = prompt('Enter your Hive username:');
    if (!username) return;

    // Step 1: Get a one-time challenge from the backend
    const { challenge } = await api.getChallenge(username);

    // Step 2: Sign the challenge with the posting key via Keychain
    return new Promise((resolve, reject) => {
      window.hive_keychain.requestSignBuffer(
        username,
        challenge,
        'Posting',
        async (response) => {
          if (!response.success) {
            reject(new Error('Keychain signature rejected'));
            return;
          }
          try {
            // Step 3: Send the actual signature (response.result) to the backend
            const result = await api.login(username, challenge, response.result);

            if (result.success && result.token) {
              api.setToken(result.token);
              this.username = username;
              this.isAuthenticated = true;
              localStorage.setItem('username', username);
              resolve(result);
            } else {
              reject(new Error('Login failed'));
            }
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  // Logout
  logout() {
    api.clearToken();
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    this.username = null;
    this.userRole = 'guest';
    this.isAuthenticated = false;
  }

  // Verify session
  async verifySession() {
    if (!api.token) {
      return false;
    }

    try {
      await api.verifyToken();
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // Get current username
  getUsername() {
    return this.username;
  }
}

// Export auth instance
const auth = new Auth();
