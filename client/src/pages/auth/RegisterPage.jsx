// ─────────────────────────────────────────────────────────
// Register Page – matches cream/brown Smart Campus OS theme
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const ROLES = [
  { value: 'student', label: '🎓 Student', description: 'Access classes, attendance & resources' },
  { value: 'teacher', label: '📚 Teacher', description: 'Manage courses, grades & mentoring' },
  { value: 'admin', label: '🛡️ Admin', description: 'Institution-wide operations & analytics' }
];

export default function RegisterPage({ onSwitch, onSuccess }) {
  const { register, loading, error, clearError } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    department: ''
  });

  function handleChange(e) {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await register(form);
      onSuccess?.();
    } catch {
      // error is set by context
    }
  }

  return (
    <div className="auth-card auth-card-register">
      {/* Decorative floating orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-header">
        <div className="auth-logo">
          <span className="brand-dot" />
          <span>Smart Campus OS</span>
        </div>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join the intelligent campus network</p>
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

      <form onSubmit={handleSubmit} className="auth-form" id="register-form">
        <div className="auth-field">
          <label htmlFor="register-name">Full Name</label>
          <div className="auth-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            <input
              id="register-name"
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email Address</label>
          <div className="auth-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              id="register-email"
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
          <label htmlFor="register-password">Password</label>
          <div className="auth-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="register-password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 chars, include a number"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
        </div>

        {/* Role selector */}
        <div className="auth-field">
          <label>Select Your Role</label>
          <div className="auth-role-grid">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`auth-role-option${form.role === r.value ? ' active' : ''}`}
                htmlFor={`role-${r.value}`}
              >
                <input
                  type="radio"
                  id={`role-${r.value}`}
                  name="role"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="auth-role-label">{r.label}</span>
                <span className="auth-role-desc">{r.description}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-dept">Department (optional)</label>
          <div className="auth-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 20h20M4 20V8l8-5 8 5v12" />
              <path d="M9 20v-4h6v4" />
            </svg>
            <input
              id="register-dept"
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              autoComplete="organization"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary auth-submit"
          disabled={loading}
          id="register-submit"
        >
          {loading ? (
            <span className="auth-spinner" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" className="auth-link" onClick={onSwitch}>
          Sign in
        </button>
      </p>
    </div>
  );
}
