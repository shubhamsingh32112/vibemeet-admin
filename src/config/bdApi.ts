import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const bdApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

bdApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bdToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

bdApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bdToken');
      localStorage.removeItem('bdUser');
      window.location.href = `${import.meta.env.BASE_URL}bd/login`;
    }
    return Promise.reject(error);
  }
);

export default bdApi;
