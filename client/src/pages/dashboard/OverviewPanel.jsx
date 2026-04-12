// ─────────────────────────────────────────────────────────
// Overview Panel – the default dashboard home view
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

const ROLE_THEMES = {
  student: { emoji: '🎓', accent: '#b49359', label: 'Student' },
  teacher: { emoji: '📚', accent: '#8d774f', label: 'Teacher' },
  admin: { emoji: '🛡️', accent: '#7f6438', label: 'Admin' }
};

export default function OverviewPanel() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = ROLE_THEMES[user?.role] || ROLE_THEMES.student;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetch() {
      try {
        const { data } = await api.get(`/dashboard/${user.role}`);
        if (!cancelled) setDashboard(data.data);
      } catch { /* fallback below */ }
      finally { if (!cancelled) setLoading(false); }
    }

    fetch();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  return (
    <>
      {/* ── Greeting ──────────────────────────────────── */}
      <section className="mod-hero">
        <div className="mod-hero-orb" />
        <h1>{dashboard?.headline || `Welcome back, ${user.fullName.split(' ')[0]}`}</h1>
        <p>{dashboard?.subtitle || 'Your personalised campus intelligence workspace is ready.'}</p>
        <div className="dash-role-badge" style={{ borderColor: theme.accent }}>
          {theme.emoji} {theme.label} Portal
        </div>
      </section>

      {/* ── Quick stats ───────────────────────────────── */}
      {loading ? (
        <div className="mod-loading"><div className="spinner" /><span>Loading dashboard…</span></div>
      ) : dashboard ? (
        <>
          <section className="mod-stats-row">
            {dashboard.quickStats?.map((s) => (
              <div key={s.label} className="mod-stat-card">
                <span className="mod-stat-value">{s.value}</span>
                <span className="mod-stat-label">{s.label}</span>
                <span className="mod-stat-trend">{s.trend}</span>
              </div>
            ))}
          </section>

          <section className="mod-section">
            <h3 className="mod-section-title">Focus Areas</h3>
            <div className="mod-cards-row">
              {dashboard.focusCards?.map((c) => (
                <div key={c.title} className="mod-focus-card">
                  <div className="mod-focus-value">{c.value}</div>
                  <div className="mod-focus-title">{c.title}</div>
                  <div className="mod-focus-note">{c.note}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="mod-stats-row">
          <div className="mod-stat-card"><span className="mod-stat-value">{user.email}</span><span className="mod-stat-label">Email</span></div>
          <div className="mod-stat-card"><span className="mod-stat-value">{user.role}</span><span className="mod-stat-label">Role</span></div>
          <div className="mod-stat-card"><span className="mod-stat-value">{user.department || '—'}</span><span className="mod-stat-label">Department</span></div>
          <div className="mod-stat-card"><span className="mod-stat-value">{new Date(user.createdAt).toLocaleDateString()}</span><span className="mod-stat-label">Member Since</span></div>
        </section>
      )}

      {/* ── Account ───────────────────────────────────── */}
      <section className="mod-section">
        <h3 className="mod-section-title">Account Details</h3>
        <div className="mod-detail-grid">
          <div className="mod-detail-item"><span className="mod-detail-key">Full Name</span><span className="mod-detail-val">{user.fullName}</span></div>
          <div className="mod-detail-item"><span className="mod-detail-key">Email</span><span className="mod-detail-val">{user.email}</span></div>
          <div className="mod-detail-item"><span className="mod-detail-key">Role</span><span className="mod-detail-val">{theme.emoji} {theme.label}</span></div>
          <div className="mod-detail-item"><span className="mod-detail-key">Department</span><span className="mod-detail-val">{user.department || 'Not specified'}</span></div>
          <div className="mod-detail-item"><span className="mod-detail-key">Last Login</span><span className="mod-detail-val">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'First session'}</span></div>
          <div className="mod-detail-item"><span className="mod-detail-key">Account Created</span><span className="mod-detail-val">{new Date(user.createdAt).toLocaleDateString()}</span></div>
        </div>
      </section>
    </>
  );
}
