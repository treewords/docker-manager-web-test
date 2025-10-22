import React, { createContext, useState } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // We initialize the token from sessionStorage to allow for page reloads.
  // Note: For higher security, in-memory is better, but this is a demo.
  const [token, setToken] = useState(sessionStorage.getItem('authToken'));

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token } = response.data;
    setToken(token);
    sessionStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setToken(null);
    sessionStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  };

  // Set the initial auth header if a token exists
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};