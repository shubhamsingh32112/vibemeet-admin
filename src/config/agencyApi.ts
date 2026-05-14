import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/** Axios instance for agency JWT — used for /agency/* and shared staff routes. */
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
    const status = error.response?.status;
    const url = String(error.config?.url ?? '');
    const isChangePassword = url.includes('/agency/change-password');
    if (status === 401 && !isChangePassword) {
      localStorage.removeItem('agencyToken');
      localStorage.removeItem('agencyUser');
      window.location.href = `${import.meta.env.BASE_URL}agency/login`;
    }
    return Promise.reject(error);
  }
);

export default agencyApi;
