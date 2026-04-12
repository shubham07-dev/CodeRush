// ─────────────────────────────────────────────────────────
// Auth Context – global authentication state via React context
// ─────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sc_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist user changes to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('sc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sc_user');
    }
  }, [user]);

  // ── Register ──────────────────────────────────────────
  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/register', payload);

      localStorage.setItem('sc_access_token', data.data.token);
      localStorage.setItem('sc_refresh_token', data.data.refreshToken);
      setUser(data.data.user);

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login ─────────────────────────────────────────────
  const login = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/login', payload);

      localStorage.setItem('sc_access_token', data.data.token);
      localStorage.setItem('sc_refresh_token', data.data.refreshToken);
      setUser(data.data.user);

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort – clear local state regardless
    }

    localStorage.removeItem('sc_access_token');
    localStorage.removeItem('sc_refresh_token');
    setUser(null);
  }, []);

  // ── Fetch current user profile ────────────────────────
  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch {
      // Token invalid – clear auth
      localStorage.removeItem('sc_access_token');
      localStorage.removeItem('sc_refresh_token');
      setUser(null);
    }
  }, []);

  // ── Clear error ───────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    fetchMe,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return ctx;
}
