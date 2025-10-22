/**
 * Application Configuration
 *
 * IMPORTANT: You must update these values before deployment.
 */
const config = {
  /**
   * The base URL for the backend API.
   * - For development, this should point to your local backend server.
   * - For production, this should be the public URL of your deployed backend API.
   *
   * @example 'https://api.your-domain.com'
   */
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
};

export default config;