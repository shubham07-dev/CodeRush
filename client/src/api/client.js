// ─────────────────────────────────────────────────────────
// API Client – Axios instance with interceptors
// ─────────────────────────────────────────────────────────

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// ── Request interceptor: attach access token ────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sc_access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-refresh on 401 ───────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Attempt refresh only once and not on auth endpoints themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('sc_refresh_token');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken
          });

          // Persist new tokens
          localStorage.setItem('sc_access_token', data.data.token);
          localStorage.setItem('sc_refresh_token', data.data.refreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.data.token}`;

          return api(originalRequest);
        } catch {
          // Refresh failed – clear everything
          localStorage.removeItem('sc_access_token');
          localStorage.removeItem('sc_refresh_token');
          localStorage.removeItem('sc_user');
          window.location.href = '/';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
