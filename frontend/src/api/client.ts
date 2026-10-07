import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: token qo'shish
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: data extractor
apiClient.interceptors.response.use(
  (response) => {
    // Agar server { success: true, data: ... } qaytarsa, to'g'ridan to'g'ri data ni olish
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Xatolik yuz berdi';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);
