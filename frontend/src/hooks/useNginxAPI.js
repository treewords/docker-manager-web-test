import { useState, useCallback } from 'react';
import nginxApiService from '../services/nginxApiService';
import { toast } from 'react-toastify';

const useNginxAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiCall = useCallback(async (apiCall, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(...args);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      setError(errorMessage);
      toast.error(errorMessage);
      throw err; // Re-throw to allow caller to handle if needed
    } finally {
      setLoading(false);
    }
  }, []);

  const getTasks = useCallback(() => handleApiCall(nginxApiService.getTasks), [handleApiCall]);
  const getTask = useCallback(id => handleApiCall(nginxApiService.getTask, id), [handleApiCall]);
  const createTask = useCallback(data => handleApiCall(nginxApiService.createTask, data), [handleApiCall]);
  const updateTask = useCallback((id, data) => handleApiCall(nginxApiService.updateTask, id, data), [handleApiCall]);
  const deleteTask = useCallback(id => handleApiCall(nginxApiService.deleteTask, id), [handleApiCall]);
  const getConfig = useCallback(id => handleApiCall(nginxApiService.getConfig, id), [handleApiCall]);
  const getMetrics = useCallback(id => handleApiCall(nginxApiService.getMetrics, id), [handleApiCall]);
  const getHealth = useCallback(() => handleApiCall(nginxApiService.getHealth), [handleApiCall]);

  return {
    loading,
    error,
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    getConfig,
    getMetrics,
    getHealth,
  };
};

export default useNginxAPI;
