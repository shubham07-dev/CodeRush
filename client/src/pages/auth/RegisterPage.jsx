// ─────────────────────────────────────────────────────────
// Register Page – matches cream/brown Smart Campus OS theme
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';
import { DEPARTMENTS } from '../../constants.js';

const ROLES = [
  { value: 'student', label: '🎓 Student', description: 'Access classes, attendance & resources' },
  { value: 'teacher', label: '📚 Teacher', description: 'Manage courses, grades & mentoring' }
];

export default function RegisterPage({ onSwitch, onSuccess }) {
  const { register, loading, error, clearError } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    campus: '',
    enrollmentYear: '',
    section: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const [campuses, setCampuses] = useState([]);

  useEffect(() => {
    async function fetchCampuses() {
      try {
        const { data } = await api.get('/locations');
        setCampuses(data.data.locations);
        if (data.data.locations.length > 0) {
          setForm(f => ({ ...f, campus: data.data.locations[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load campuses');
      }
    }
    fetchCampuses();
  }, []);

  function handleChange(e) {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = { ...form };
      if (payload.role !== 'student') {
        delete payload.enrollmentYear;
        delete payload.section;
      }
      if (!payload.enrollmentYear) delete payload.enrollmentYear;
      
      await register(payload);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          <img src="/logo.png" alt="OmniCampus Logo" style={{ height: '56px', width: 'auto', transform: 'scale(1.2)' }} />
          <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
            OmniCampus
          </span>
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
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 chars, include a number"
              autoComplete="new-password"
              required
              minLength={6}
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
            <select
              id="register-dept"
              name="department"
              value={form.department}
              onChange={handleChange}
              className="auth-select"
            >
              <option value="" disabled>Select a department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-campus">Campus Location <span className="text-red-500">*</span></label>
          <div className="auth-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <select
              id="register-campus"
              name="campus"
              value={form.campus}
              onChange={handleChange}
              className="auth-select"
              required
            >
              <option value="" disabled>Select your campus</option>
              {campuses.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {form.role === 'student' && (
          <div className="auth-role-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="auth-field">
              <label htmlFor="register-year">Year</label>
              <div className="auth-input-wrap">
                <select id="register-year" name="enrollmentYear" value={form.enrollmentYear} onChange={handleChange} className="auth-select" required>
                  <option value="" disabled>Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
            </div>
            
            <div className="auth-field">
              <label htmlFor="register-section">Section</label>
              <div className="auth-input-wrap">
                <input
                  id="register-section"
                  type="text"
                  name="section"
                  value={form.section}
                  onChange={handleChange}
                  placeholder="e.g. A"
                  maxLength={10}
                  required
                />
              </div>
            </div>
          </div>
        )}

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
