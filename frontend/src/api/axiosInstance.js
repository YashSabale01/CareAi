import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('careai_token');
      localStorage.removeItem('careai_user');
      window.location.href = '/login';
    } else if (err.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }
    return Promise.reject(err);
  }
);

export default api;
