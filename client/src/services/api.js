import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('docsign_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('docsign_token');
      localStorage.removeItem('docsign_user');
      // Only redirect if not already on auth pages or public pages
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register') &&
        !window.location.pathname.includes('/shared/')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// ─── Document API ──────────────────────────────────
export const docAPI = {
  upload: (formData) =>
    api.post('/docs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params) => api.get('/docs', { params }),
  getById: (id) => api.get(`/docs/${id}`),
  getFileUrl: (id) => {
    const token = localStorage.getItem('docsign_token');
    return `${API_BASE_URL}/docs/${id}/file?token=${token}`;
  },
  getDownloadUrl: (id) => {
    const token = localStorage.getItem('docsign_token');
    return `${API_BASE_URL}/docs/${id}/download?token=${token}`;
  },
  delete: (id) => api.delete(`/docs/${id}`),
  toggleShare: (id) => api.post(`/docs/${id}/share`),
};

// ─── Signature API ─────────────────────────────────
export const signatureAPI = {
  create: (data) => api.post('/signatures', data),
  getByDoc: (docId) => api.get(`/signatures/${docId}`),
  update: (id, data) => api.put(`/signatures/${id}`, data),
  delete: (id) => api.delete(`/signatures/${id}`),
};

// ─── Stats API ─────────────────────────────────────
export const statsAPI = {
  get: () => api.get('/stats'),
};

// ─── Audit API ─────────────────────────────────────
export const auditAPI = {
  getByDoc: (docId, params) => api.get(`/audit/${docId}`, { params }),
};

// ─── Public / Share API ────────────────────────────
export const publicAPI = {
  getSharedDoc: (token) => axios.get(`${API_BASE_URL}/public/${token}`),
  getSharedFileUrl: (token) => `${API_BASE_URL}/public/${token}/file`,
  signPublic: (token, sigId, data) =>
    axios.put(`${API_BASE_URL}/public/${token}/sign/${sigId}`, data),
};

export default api;
