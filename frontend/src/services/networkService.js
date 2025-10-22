import api from './api';

export const getNetworks = async () => {
  try {
    const response = await api.get('/networks');
    return response.data;
  } catch (error) {
    console.error('Error fetching networks:', error);
    throw error;
  }
};

export const removeNetwork = async (networkId) => {
  try {
    const response = await api.delete(`/networks/${networkId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing network ${networkId}:`, error);
    throw error;
  }
};

export const inspectNetwork = async (id) => {
  try {
    const response = await api.get(`/networks/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error inspecting network ${id}:`, error);
    throw error;
  }
};

export const connectContainerToNetwork = async (networkId, containerId) => {
  try {
    const response = await api.post(`/networks/${networkId}/connect`, { containerId });
    return response.data;
  } catch (error)
 {
    console.error(`Error connecting container ${containerId} to network ${networkId}:`, error);
    throw error;
  }
};

export const disconnectContainerFromNetwork = async (networkId, containerId) => {
  try {
    const response = await api.post(`/networks/${networkId}/disconnect`, { containerId });
    return response.data;
  } catch (error) {
    console.error(`Error disconnecting container ${containerId} from network ${networkId}:`, error);
    throw error;
  }
};

export const createNetwork = async (networkData) => {
  try {
    const response = await api.post('/networks', networkData);
    return response.data;
  } catch (error) {
    console.error('Error creating network:', error);
    throw error;
  }
};