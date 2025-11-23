import React, { createContext, useState, useEffect, useCallback } from 'react';
import api, { initializeCSRF } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // We initialize the token from sessionStorage to allow for page reloads.
  // Note: For higher security, in-memory is better, but this is a demo.
  const [token, setToken] = useState(sessionStorage.getItem('authToken'));
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize CSRF token on mount
  useEffect(() => {
    const init = async () => {
      await initializeCSRF();
      setIsInitialized(true);
    };
    init();
  }, []);

  const login = useCallback(async (username, password) => {
    // Re-initialize CSRF before login
    await initializeCSRF();

    const response = await api.post('/auth/login', { username, password });
    const { token: newToken } = response.data;
    setToken(newToken);
    sessionStorage.setItem('authToken', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    // Refresh CSRF token after successful login
    await initializeCSRF();
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    sessionStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];

    // Refresh CSRF token after logout
    initializeCSRF();
  }, []);

  // Set the initial auth header if a token exists
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, login, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};