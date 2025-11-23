/**
 * Secure Token Storage
 *
 * Security-focused token management that stores access tokens in memory
 * rather than localStorage to prevent XSS token theft.
 *
 * For refresh tokens, use httpOnly cookies managed by the backend.
 */

class SecureTokenStorage {
  constructor() {
    // Store access token in memory only (lost on page refresh - intentional for security)
    this._accessToken = null;
    this._tokenExpiry = null;
    this._refreshTimeout = null;
    this._onTokenRefreshFailed = null;
  }

  /**
   * Validate JWT token format
   */
  isValidJWT(token) {
    if (!token || typeof token !== 'string') return false;
    return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token);
  }

  /**
   * Parse JWT payload without verification (client-side use only)
   */
  parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to parse JWT:', e);
      return null;
    }
  }

  /**
   * Set access token with automatic expiry handling
   */
  setAccessToken(token) {
    if (!this.isValidJWT(token)) {
      throw new Error('Invalid token format');
    }

    this._accessToken = token;

    // Parse expiry from token
    const payload = this.parseJWT(token);
    if (payload && payload.exp) {
      this._tokenExpiry = payload.exp * 1000; // Convert to milliseconds

      // Clear any existing refresh timeout
      if (this._refreshTimeout) {
        clearTimeout(this._refreshTimeout);
      }

      // Schedule token refresh 1 minute before expiry
      const expiresIn = this._tokenExpiry - Date.now();
      const refreshIn = Math.max(0, expiresIn - 60000);

      if (refreshIn > 0 && this._onTokenRefreshFailed) {
        this._refreshTimeout = setTimeout(() => {
          this.refreshAccessToken();
        }, refreshIn);
      }
    }

    return this;
  }

  /**
   * Get current access token
   */
  getAccessToken() {
    // Check if token has expired
    if (this._tokenExpiry && Date.now() > this._tokenExpiry) {
      this.clearTokens();
      return null;
    }
    return this._accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry() {
    return this._tokenExpiry;
  }

  /**
   * Get time remaining until token expires (in seconds)
   */
  getTimeRemaining() {
    if (!this._tokenExpiry) return 0;
    return Math.max(0, Math.floor((this._tokenExpiry - Date.now()) / 1000));
  }

  /**
   * Set callback for when token refresh fails
   */
  onRefreshFailed(callback) {
    this._onTokenRefreshFailed = callback;
    return this;
  }

  /**
   * Clear all tokens
   */
  clearTokens() {
    this._accessToken = null;
    this._tokenExpiry = null;

    if (this._refreshTimeout) {
      clearTimeout(this._refreshTimeout);
      this._refreshTimeout = null;
    }

    // Also clear sessionStorage for backward compatibility
    try {
      sessionStorage.removeItem('authToken');
    } catch (e) {
      // Ignore errors if sessionStorage is not available
    }

    return this;
  }

  /**
   * Attempt to refresh the access token
   * Note: This requires backend support for refresh tokens via httpOnly cookies
   */
  async refreshAccessToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include' // Send httpOnly refresh token cookie
      });

      if (response.ok) {
        const { token } = await response.json();
        this.setAccessToken(token);
        return token;
      } else {
        // Refresh failed
        this.clearTokens();
        if (this._onTokenRefreshFailed) {
          this._onTokenRefreshFailed();
        }
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      if (this._onTokenRefreshFailed) {
        this._onTokenRefreshFailed();
      }
      return null;
    }
  }

  /**
   * Get user info from token
   */
  getUserFromToken() {
    const token = this.getAccessToken();
    if (!token) return null;

    const payload = this.parseJWT(token);
    return payload?.user || null;
  }
}

// Singleton instance
export const tokenStorage = new SecureTokenStorage();

/**
 * Setup Axios interceptor for automatic token attachment
 */
export function setupAuthInterceptor(axiosInstance) {
  // Request interceptor - attach token
  axiosInstance.interceptors.request.use(
    config => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  // Response interceptor - handle 401 errors
  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      // If 401 and not already retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await tokenStorage.refreshAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, will redirect to login
        }
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
}

export default tokenStorage;
