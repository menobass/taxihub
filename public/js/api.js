// API Base URL
const API_BASE = '/api';

// API client class
class API {
  constructor() {
    this.token = localStorage.getItem('token');
    this.currentHub = localStorage.getItem('currentHub') || null;
  }

  // Set current hub
  setCurrentHub(communityUsername) {
    this.currentHub = communityUsername;
    localStorage.setItem('currentHub', communityUsername);
  }

  // Get current hub
  getCurrentHub() {
    return this.currentHub;
  }

  // Clear current hub
  clearCurrentHub() {
    this.currentHub = null;
    localStorage.removeItem('currentHub');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Clear auth token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Get headers with auth and hub context
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.currentHub) {
      headers['X-Hub-Community'] = this.currentHub;
    }
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders()
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username, signature) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, signature })
    });
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  // Hub registry endpoints
  async getHubs() {
    return this.request('/hubs');
  }

  async getHub(communityUsername) {
    return this.request(`/hubs/${communityUsername}`);
  }

  async registerHub(data) {
    return this.request('/hubs/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Community endpoints
  async getCommunity() {
    return this.request('/community');
  }

  async getMembers(limit = 100, last = '') {
    const params = new URLSearchParams({ limit });
    if (last) params.append('last', last);
    return this.request(`/members?${params}`);
  }

  async getUserRole(username) {
    const params = new URLSearchParams({ username });
    return this.request(`/user-role?${params}`);
  }

  async getRoles(last = '') {
    const params = new URLSearchParams({ last });
    return this.request(`/roles?${params}`);
  }

  async updateRole(account, role) {
    return this.request('/role', {
      method: 'POST',
      body: JSON.stringify({ account, role })
    });
  }

  async muteUser(account, notes) {
    return this.request('/mute', {
      method: 'POST',
      body: JSON.stringify({ account, notes })
    });
  }

  async unmuteUser(account) {
    return this.request('/unmute', {
      method: 'POST',
      body: JSON.stringify({ account })
    });
  }

  async getPosts(sort = 'created', limit = 20, startAuthor = null, startPermlink = null) {
    const params = new URLSearchParams({ sort, limit });
    if (startAuthor && startPermlink) {
      params.append('startAuthor', startAuthor);
      params.append('startPermlink', startPermlink);
    }
    return this.request(`/posts?${params}`);
  }

  async pinPost(account, permlink, notes) {
    return this.request('/pin', {
      method: 'POST',
      body: JSON.stringify({ account, permlink, notes })
    });
  }

  async unpinPost(account, permlink) {
    return this.request('/unpin', {
      method: 'POST',
      body: JSON.stringify({ account, permlink })
    });
  }

  async getAccount(username) {
    return this.request(`/account/${username}`);
  }

  async getPostDetail(author, permlink) {
    const params = new URLSearchParams({ author, permlink });
    return this.request(`/post?${params}`);
  }
}

// Export API instance
const api = new API();
