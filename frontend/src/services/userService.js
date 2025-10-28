import api from './api';

/**
 * Checks if the user has a Git token configured.
 * @returns {Promise<{hasToken: boolean}>}
 */
export const getGitTokenStatus = async () => {
  try {
    const response = await api.get('/user/settings/git-token-status');
    return response.data;
  } catch (error) {
    console.error('Error fetching Git token status:', error);
    throw error;
  }
};

/**
 * Saves a GitHub PAT for the user.
 * @param {string} token - The GitHub Personal Access Token.
 * @returns {Promise<any>}
 */
export const saveGitToken = async (token) => {
  try {
    const response = await api.post('/user/settings/git-token', { token });
    return response.data;
  } catch (error) {
    console.error('Error saving Git token:', error);
    throw error;
  }
};