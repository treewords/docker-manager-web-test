import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import jwtDecode from 'jwt-decode';
import { getGitTokenStatus, saveGitToken } from '../services/userService';

const UserSettingsPage = () => {
  const { token } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [gitToken, setGitToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [message, setMessage] = useState('');

  let username = 'Guest';
  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      username = decodedToken.user.username;
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }

  useEffect(() => {
    const checkTokenStatus = async () => {
      try {
        const { hasToken } = await getGitTokenStatus();
        setHasToken(hasToken);
      } catch (error) {
        setMessage('Failed to check Git token status.');
      }
    };
    checkTokenStatus();
  }, []);

  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!gitToken) {
      setMessage('Please enter a token.');
      return;
    }
    try {
      await saveGitToken(gitToken);
      setHasToken(true);
      setGitToken('');
      setMessage('Git token saved successfully!');
    } catch (error) {
      setMessage('Failed to save Git token.');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-text-primary dark:text-dark-text-primary">User Settings</h1>
      <div className="bg-white dark:bg-dark-surface shadow-md rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Profile</h2>
          <p className="text-text-secondary dark:text-dark-text-secondary">
            You are logged in as: <span className="font-medium text-primary dark:text-dark-primary">{username}</span>
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Appearance</h2>
          <div className="flex items-center justify-between mt-4">
            <span className="text-text-secondary dark:text-dark-text-secondary">
              Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </span>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-dark-primary border border-transparent rounded-md shadow-sm hover:bg-opacity-80 focus:outline-none"
            >
              Toggle Theme
            </button>
          </div>
        </div>

        <div className="mt-6 border-t pt-6 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Git Integration</h2>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Provide a GitHub Personal Access Token to build images from private repositories.
          </p>
          <form onSubmit={handleSaveToken} className="mt-4 space-y-4">
            <div>
              <label htmlFor="git-token" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Personal Access Token
              </label>
              <input
                type="password"
                id="git-token"
                value={gitToken}
                onChange={(e) => setGitToken(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-text-primary dark:text-dark-text-primary bg-background dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary"
                placeholder="ghp_..."
              />
            </div>
            {message && <p className="text-sm text-green-600">{message}</p>}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${hasToken ? 'text-green-600' : 'text-gray-500'}`}>
                {hasToken ? 'Token is configured' : 'No token configured'}
              </span>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-dark-primary border border-transparent rounded-md shadow-sm hover:bg-opacity-80 focus:outline-none"
              >
                Save Token
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;