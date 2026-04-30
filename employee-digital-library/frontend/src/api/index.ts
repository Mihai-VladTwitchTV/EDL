import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
      // Navigation reset is handled by the auth store
    }
    return Promise.reject(error);
  }
);

export default api;

// ----- Auth -----
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (data: object) =>
    api.post('/api/auth/register', data),
};

// ----- Feed -----
export const feedApi = {
  getFeed: (page = 0, size = 20) =>
    api.get('/api/feed', { params: { page, size } }),
  getMandatoryPending: () =>
    api.get('/api/feed/mandatory-pending'),
};

// ----- Content -----
export const contentApi = {
  search: (q: string, page = 0, size = 20) =>
    api.get('/api/content/search', { params: { q, page, size } }),
  byCategory: (categoryId: string, page = 0) =>
    api.get(`/api/content/category/${categoryId}`, { params: { page } }),
  getById: (id: string) =>
    api.get(`/api/content/${id}`),
  acknowledge: (id: string) =>
    api.post(`/api/content/${id}/acknowledge`),
  complete: (id: string) =>
    api.post(`/api/content/${id}/complete`),
  updateProgress: (id: string, pct: number) =>
    api.patch(`/api/content/${id}/progress`, { pct }),
  submitRequest: (data: { searchTerm?: string; description: string }) =>
    api.post('/api/content-requests', data),
};

// ----- Notifications -----
export const notifApi = {
  getAll: (page = 0) =>
    api.get('/api/notifications', { params: { page } }),
  getUnreadCount: () =>
    api.get('/api/notifications/unread-count'),
  markAllRead: () =>
    api.post('/api/notifications/mark-all-read'),
};
