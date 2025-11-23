import api from './api';

export const getSecurityStatus = async () => {
  try {
    const response = await api.get('/security/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching security status:', error);
    throw error;
  }
};
