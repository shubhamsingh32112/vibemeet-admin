import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const agencyApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

agencyApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agencyToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

agencyApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agencyToken');
      localStorage.removeItem('agencyUser');
      window.location.href = `${import.meta.env.BASE_URL}agency/login`;
    }
    return Promise.reject(error);
  }
);

export default agencyApi;
