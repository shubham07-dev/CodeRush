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

export default function OverviewPanel({ onNavigate }) {
  const { user, fetchMe } = useAuth();
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

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchMe();
    } catch (err) {
      alert('Failed to upload picture: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleAvatarRemove() {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    try {
      await api.delete('/users/me/avatar');
      fetchMe();
    } catch (err) {
      alert('Failed to remove picture');
    }
  }

  return (
    <>
      {/* ── Greeting ──────────────────────────────────── */}
      <section className="mod-hero" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `4px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdfdfd', fontSize: '3rem', fontWeight: 'bold', color: theme.accent, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {user.profilePicture ? (
                <img src={`${user.profilePicture}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{user.fullName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            <label style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '32px', height: '32px', backgroundColor: theme.accent, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', border: '2px solid white', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} title="Upload Picture">
              ✏️
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </label>

            {user.profilePicture && (
              <button 
                onClick={handleAvatarRemove} 
                style={{ position: 'absolute', top: '-4px', right: '-4px', width: '28px', height: '28px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem', border: '2px solid white', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)', padding: 0 }} 
                title="Remove Picture"
              >
                ✖
              </button>
            )}
          </div>
        </div>
        
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
                <div 
                  key={c.title} 
                  className="mod-focus-card"
                  onClick={() => {
                    if (c.link && onNavigate) onNavigate(c.link);
                  }}
                  style={{ cursor: c.link ? 'pointer' : 'default', transition: 'transform 0.2s', ...(c.link && { '&:hover': { transform: 'translateY(-2px)' } }) }}
                >
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
          {user.section && <div className="mod-detail-item"><span className="mod-detail-key">Section</span><span className="mod-detail-val">{user.section}</span></div>}
          {user.rollNumber && <div className="mod-detail-item"><span className="mod-detail-key">Roll Number</span><span className="mod-detail-val">{user.rollNumber}</span></div>}
          <div className="mod-detail-item"><span className="mod-detail-key">Last Login</span><span className="mod-detail-val">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'First session'}</span></div>
          <div className="mod-detail-item"><span className="mod-detail-key">Account Created</span><span className="mod-detail-val">{new Date(user.createdAt).toLocaleDateString()}</span></div>
        </div>
      </section>
    </>
  );
}
