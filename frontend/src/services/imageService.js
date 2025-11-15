import api from './api';

export const getImages = async () => {
  try {
    const response = await api.get('/images');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeImage = async (imageId) => {
  try {
    const response = await api.delete(`/images/${imageId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const buildImage = async (repoUrl, imageName, tag) => {
  try {
    const response = await api.post('/images/build', { repoUrl, imageName, tag });
    return response.data;
  } catch (error) {
    throw error;
  }
};