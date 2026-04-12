// ─────────────────────────────────────────────────────────
// Dashboard Page – role-specific content after login
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

// Role badge colours (keeping within the cream/sand palette)
const ROLE_THEMES = {
  student: { emoji: '🎓', accent: '#b49359', label: 'Student' },
  teacher: { emoji: '📚', accent: '#8d774f', label: 'Teacher' },
  admin: { emoji: '🛡️', accent: '#7f6438', label: 'Admin' }
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  const theme = ROLE_THEMES[user?.role] || ROLE_THEMES.student;

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchDashboard() {
      try {
        const { data } = await api.get(`/dashboard/${user.role}`);
        if (!cancelled) setDashboard(data.data);
      } catch {
        // fallback – show basic info
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    }

    fetchDashboard();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  return (
    <div className="dashboard-shell">
      {/* ── Top bar ────────────────────────────────── */}
      <header className="dash-header">
        <div className="dash-brand">
          <span className="brand-dot" />
          <span>Smart Campus OS</span>
        </div>

        <div className="dash-user-area">
          <div className="dash-avatar" style={{ background: `linear-gradient(135deg, ${theme.accent}, #f4e8d1)` }}>
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="dash-user-info">
            <span className="dash-user-name">{user.fullName}</span>
            <span className="dash-user-role">
              {theme.emoji} {theme.label}
            </span>
          </div>
          <button className="btn-outline dash-logout" type="button" onClick={logout} id="logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Greeting section ──────────────────────── */}
      <section className="dash-hero">
        <div className="dash-hero-orb" />
        <h1>
          {dashboard?.headline || `Welcome back, ${user.fullName.split(' ')[0]}`}
        </h1>
        <p>
          {dashboard?.subtitle || 'Your personalised campus intelligence workspace is ready.'}
        </p>
        <div className="dash-role-badge" style={{ borderColor: theme.accent }}>
          {theme.emoji} {theme.label} Portal
        </div>
      </section>

      {/* ── Quick stats ───────────────────────────── */}
      {dashLoading ? (
        <div className="dash-loading">
          <div className="auth-spinner" />
          <span>Loading your dashboard…</span>
        </div>
      ) : dashboard ? (
        <>
          <section className="dash-stats-row">
            {dashboard.quickStats?.map((stat) => (
              <div key={stat.label} className="dash-stat-card">
                <span className="dash-stat-value">{stat.value}</span>
                <span className="dash-stat-label">{stat.label}</span>
                <span className="dash-stat-trend">{stat.trend}</span>
              </div>
            ))}
          </section>

          <section className="dash-focus">
            <h3 className="dash-section-title">Focus Areas</h3>
            <div className="dash-focus-row">
              {dashboard.focusCards?.map((card) => (
                <div key={card.title} className="dash-focus-card">
                  <div className="dash-focus-value">{card.value}</div>
                  <div className="dash-focus-title">{card.title}</div>
                  <div className="dash-focus-note">{card.note}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="dash-stats-row">
          <div className="dash-stat-card">
            <span className="dash-stat-value">{user.email}</span>
            <span className="dash-stat-label">Email</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-value">{user.role}</span>
            <span className="dash-stat-label">Role</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-value">{user.department || '—'}</span>
            <span className="dash-stat-label">Department</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-value">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
            <span className="dash-stat-label">Member Since</span>
          </div>
        </section>
      )}

      {/* ── Account details card ──────────────────── */}
      <section className="dash-account">
        <h3 className="dash-section-title">Account Details</h3>
        <div className="dash-account-grid">
          <div className="dash-account-item">
            <span className="dash-account-key">Full Name</span>
            <span className="dash-account-val">{user.fullName}</span>
          </div>
          <div className="dash-account-item">
            <span className="dash-account-key">Email</span>
            <span className="dash-account-val">{user.email}</span>
          </div>
          <div className="dash-account-item">
            <span className="dash-account-key">Role</span>
            <span className="dash-account-val">{theme.emoji} {theme.label}</span>
          </div>
          <div className="dash-account-item">
            <span className="dash-account-key">Department</span>
            <span className="dash-account-val">{user.department || 'Not specified'}</span>
          </div>
          <div className="dash-account-item">
            <span className="dash-account-key">Last Login</span>
            <span className="dash-account-val">
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString()
                : 'First session'}
            </span>
          </div>
          <div className="dash-account-item">
            <span className="dash-account-key">Account Created</span>
            <span className="dash-account-val">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
