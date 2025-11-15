import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: `${config.API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for all requests
  timeoutErrorMessage: 'Request timeout. Please check your connection and try again.',
});

// Interceptor to handle token expiration or other auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If a 401 Unauthorized response is received, the user's token is likely
      // invalid or expired. We'll clear the session and redirect to login.
      // This is a simple but effective way to handle session expiry.
      sessionStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;