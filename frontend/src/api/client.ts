import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // Production / Vercel muhitida CORS bloklanishining oldini olish uchun Vercel proxy (/api/v1) ishlatiladi
  if (import.meta.env.PROD) {
    if (!envUrl || envUrl.includes('technova-it.uz') || envUrl === '/api/v1') {
      return '/api/v1';
    }
    return envUrl;
  }
  return envUrl || 'http://localhost:3000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

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
