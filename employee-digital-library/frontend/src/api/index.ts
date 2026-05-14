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
  getFeed: (page = 0, size = 20, postType?: string) =>
    api.get('/api/feed', { params: { page, size, ...(postType ? { postType } : {}) } }),
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
  create: (form: FormData) =>
    api.post('/api/content', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitForReview: (id: string) =>
    api.post(`/api/content/${id}/submit-review`),
  getCompliance: () =>
    api.get('/api/content/compliance'),
};

// ----- Notifications -----
export const notifApi = {
  getAll: (page = 0) =>
    api.get('/api/notifications', { params: { page } }),
  getUnreadCount: () =>
    api.get('/api/notifications/unread-count'),
  markAllRead: () =>
    api.post('/api/notifications/mark-all-read'),
  registerToken: (token: string) =>
    api.post('/api/notifications/register-token', { token }),
};

// ----- Quiz -----
export const quizApi = {
  getQuestions: (contentId: string) =>
    api.get(`/api/quiz/${contentId}/questions`),
  submitAttempt: (contentId: string, answers: { questionId: string; selectedAnswerIds: string[] }[]) =>
    api.post(`/api/quiz/${contentId}/attempt`, { answers }),
  getAttemptHistory: (contentId: string) =>
    api.get(`/api/quiz/${contentId}/attempts`),
};

// ----- Gamification -----
export const gamificationApi = {
  getMyProfile: () =>
    api.get('/api/gamification/me'),
  getSectionLeaderboard: (sectionId: string) =>
    api.get(`/api/gamification/leaderboard/section/${sectionId}`),
};

// ----- Certifications -----
export const certApi = {
  getMyCertifications: () =>
    api.get('/api/certifications/me'),
};

// ----- Feedback -----
export const feedbackApi = {
  submit: (data: { category: string; message: string; anonymous?: boolean }) =>
    api.post('/api/feedback', data),
  getAll: (page = 0) =>
    api.get('/api/feedback', { params: { page } }),
};

// ----- Support -----
export const supportApi = {
  create: (data: { ticketType: string; subject: string; description: string }) =>
    api.post('/api/support', data),
  getMyTickets: (page = 0) =>
    api.get('/api/support/me', { params: { page } }),
  getAll: (page = 0, status?: string) =>
    api.get('/api/support', { params: { page, ...(status ? { status } : {}) } }),
  resolve: (id: string) =>
    api.post(`/api/support/${id}/resolve`),
};

// ----- Company Pages -----
export const pagesApi = {
  getAll: () =>
    api.get('/api/pages'),
  getBySection: (section: string) =>
    api.get('/api/pages', { params: { section } }),
  getBySlug: (slug: string) =>
    api.get(`/api/pages/${slug}`),
};

// ----- Meta -----
export const metaApi = {
  getDepartments: () => api.get('/api/departments'),
  getCategories: () => api.get('/api/categories'),
  getSections: (departmentId?: string) =>
    api.get('/api/sections', { params: departmentId ? { departmentId } : {} }),
};
