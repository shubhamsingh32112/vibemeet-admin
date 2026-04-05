import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/** Axios instance for agent JWT — used for /agent/* and shared staff routes (e.g. /admin/creators/...). */
export const agentApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

agentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agentToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

agentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agentToken');
      localStorage.removeItem('agentUser');
      window.location.href = `${import.meta.env.BASE_URL}agent/login`;
    }
    return Promise.reject(error);
  }
);

export default agentApi;
