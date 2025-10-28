import api from './api';

export const getVolumes = async () => {
  try {
    const response = await api.get('/volumes');
    return response.data;
  } catch (error) {
    console.error('Error fetching volumes:', error);
    throw error;
  }
};

export const removeVolume = async (name) => {
  try {
    const response = await api.delete(`/volumes/${name}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing volume ${name}:`, error);
    throw error;
  }
};

export const createVolume = async (name) => {
  try {
    const response = await api.post('/volumes', { name });
    return response.data;
  } catch (error) {
    console.error('Error creating volume:', error);
    throw error;
  }
};