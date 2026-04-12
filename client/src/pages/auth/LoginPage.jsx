// ─────────────────────────────────────────────────────────
// Login Page – matches cream/brown Smart Campus OS theme
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage({ onSwitch, onSuccess }) {
  const { login, loading, error, clearError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await login(form);
      onSuccess?.();
    } catch {
      // error is set by context
    }
  }

  return (
    <div className="auth-card">
      {/* Decorative floating orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-header">
        <div className="auth-logo">
          <span className="brand-dot" />
          <span>Smart Campus OS</span>
        </div>
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your campus portal</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" id="login-form">
        <div className="auth-field">
          <label htmlFor="login-email">Email Address</label>
          <div className="auth-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              id="login-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@campus.edu"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <div className="auth-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', color: '#9ca3af' }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary auth-submit"
          disabled={loading}
          id="login-submit"
        >
          {loading ? (
            <span className="auth-spinner" />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account?{' '}
        <button type="button" className="auth-link" onClick={onSwitch}>
          Create one
        </button>
      </p>
    </div>
  );
}
