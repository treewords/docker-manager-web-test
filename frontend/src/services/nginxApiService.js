import axios from 'axios';
import config from '../config';

const API_URL = `${config.API_BASE_URL}/api/nginx`;

const getToken = () => localStorage.getItem('token');

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

const getTasks = async (params = {}) => {
  const response = await axiosInstance.get('/tasks', { params });
  return response.data;
};

const getTask = async (id) => {
  const response = await axiosInstance.get(`/tasks/${id}`);
  return response.data;
};

const createTask = async (taskData) => {
  const response = await axiosInstance.post('/tasks', taskData);
  return response.data;
};

const updateTask = async (id, taskData) => {
  const response = await axiosInstance.put(`/tasks/${id}`, taskData);
  return response.data;
};

const deleteTask = async (id) => {
  await axiosInstance.delete(`/tasks/${id}`);
};

const getConfig = async (id) => {
  const response = await axiosInstance.get(`/config/${id}`);
  return response.data;
};

const getMetrics = async (id, params = {}) => {
  const response = await axiosInstance.get(`/metrics/${id}`, { params });
  return response.data;
};

const validateConfig = async () => {
  const response = await axiosInstance.post('/validate');
  return response.data;
};

const getHealth = async () => {
  const response = await axiosInstance.get('/health');
  return response.data;
};

export default {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getConfig,
  getMetrics,
  validateConfig,
  getHealth,
};
