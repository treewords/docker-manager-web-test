import axios from 'axios';
import config from '../config';

// CSRF token storage
let csrfToken = null;

const api = axios.create({
  baseURL: `${config.API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for CSRF
});

/**
 * Initialize CSRF token
 * Should be called on app startup
 */
export async function initializeCSRF() {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
    return null;
  }
}

/**
 * Get current CSRF token
 */
export function getCSRFToken() {
  return csrfToken;
}

// Request interceptor - attach CSRF token to non-GET requests
api.interceptors.request.use(
  (config) => {
    // Add CSRF token to state-changing requests
    if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors and CSRF refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      sessionStorage.removeItem('authToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 403 CSRF error - try to refresh token once
    if (error.response?.status === 403 &&
        error.response?.data?.error?.includes('CSRF') &&
        !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;

      try {
        await initializeCSRF();
        originalRequest.headers['X-CSRF-Token'] = csrfToken;
        return api(originalRequest);
      } catch (csrfError) {
        console.error('CSRF refresh failed:', csrfError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;