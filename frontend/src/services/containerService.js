import api from './api';

export const getContainers = async () => {
  try {
    const response = await api.get('/containers');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const pauseContainer = async (containerId) => {
    try {
        const response = await api.post(`/containers/${containerId}/pause`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const startContainer = async (containerId) => {
    try {
        const response = await api.post(`/containers/${containerId}/start`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const stopContainer = async (containerId) => {
    try {
        const response = await api.post(`/containers/${containerId}/stop`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const restartContainer = async (containerId) => {
    try {
        const response = await api.post(`/containers/${containerId}/restart`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const removeContainer = async (containerId) => {
    try {
        const response = await api.delete(`/containers/${containerId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const unpauseContainer = async (containerId) => {
    try {
        const response = await api.post(`/containers/${containerId}/unpause`);
        return response.data;
    } catch (error) {
        throw error;
    }
};