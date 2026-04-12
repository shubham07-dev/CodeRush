// ─────────────────────────────────────────────────────────
// Dashboard Shell – sidebar navigation + module content
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';
import OverviewPanel from './OverviewPanel.jsx';
import AttendancePage from '../attendance/AttendancePage.jsx';
import NoticePage from '../notices/NoticePage.jsx';
import ComplaintPage from '../complaints/ComplaintPage.jsx';
import UtilitiesPage from '../utilities/UtilitiesPage.jsx';
import CampusLocationsPage from '../locations/CampusLocationsPage.jsx';
import AssignmentsPage from '../assignments/AssignmentsPage.jsx';
import PracticalPage from '../practicals/PracticalPage.jsx';

const ROLE_THEMES = {
  student: { emoji: '🎓', accent: '#b49359', label: 'Student' },
  teacher: { emoji: '📚', accent: '#8d774f', label: 'Teacher' },
  admin: { emoji: '🛡️', accent: '#7f6438', label: 'Admin' }
};

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '📊', roles: ['student', 'teacher', 'admin'] },
  { key: 'attendance', label: 'Attendance', icon: '📋', roles: ['student', 'teacher', 'admin'] },
  { key: 'assignments', label: 'Assignments', icon: '📝', roles: ['student', 'teacher', 'admin'] },
  { key: 'notices', label: 'Notices', icon: '📢', roles: ['student', 'teacher', 'admin'] },
  { key: 'complaints', label: 'Complaints', icon: '🔧', roles: ['student', 'teacher', 'admin'] },
  { key: 'utilities', label: 'Utilities', icon: '🛠️', roles: ['student', 'teacher', 'admin'] },
  { key: 'practicals', label: 'Practicals', icon: '💻', roles: ['student', 'teacher', 'admin'] },
  { key: 'locations', label: 'Campus Locations', icon: '📍', roles: ['admin'] }
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data.filter(n => !n.isRead));
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications([]);
      setShowNotifications(false);
    } catch (error) {
      // quiet fail
    }
  };

  const theme = ROLE_THEMES[user?.role] || ROLE_THEMES.student;

  if (!user) return null;

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  function renderModule() {
    switch (activeModule) {
      case 'attendance':
        return <AttendancePage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'notices':
        return <NoticePage />;
      case 'complaints':
        return <ComplaintPage />;
      case 'utilities':
        return <UtilitiesPage />;
      case 'practicals':
        return <PracticalPage />;
      case 'locations':
        return <CampusLocationsPage />;
      default:
        return <OverviewPanel />;
    }
  }

  return (
    <div className="dash-layout">
      {/* ── Mobile overlay ─────────────────────────── */}
      {sidebarOpen && (
        <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ────────────────────────────────── */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="dash-sidebar-brand">
          <span className="brand-dot" />
          <span>Smart Campus OS</span>
        </div>

        <nav className="dash-sidebar-nav">
          {visibleNav.map((item) => (
            <button
              key={item.key}
              className={`dash-nav-item${activeModule === item.key ? ' active' : ''}`}
              onClick={() => {
                setActiveModule(item.key);
                setSidebarOpen(false);
              }}
              type="button"
            >
              <span className="dash-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-sidebar-user">
            <div
              className="dash-avatar-sm"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, #f4e8d1)` }}
            >
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="dash-sidebar-name">{user.fullName}</div>
              <div className="dash-sidebar-role">{theme.emoji} {theme.label}</div>
            </div>
          </div>
          <button className="btn-outline dash-logout-sm" type="button" onClick={logout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────── */}
      <div className="dash-main">
        {/* Top bar (mobile) */}
        <header className="dash-topbar">
          <button
            className="dash-hamburger"
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>
          <span className="dash-topbar-title">
            {visibleNav.find((n) => n.key === activeModule)?.icon}{' '}
            {visibleNav.find((n) => n.key === activeModule)?.label || 'Overview'}
          </span>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn-ghost" 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: 'relative', fontSize: '1.2rem', background: 'transparent' }}
              >
                🔔
                {notifications.length > 0 && (
                  <span style={{ 
                    position: 'absolute', top: 5, right: 10, background: '#e53e3e', color: 'white', 
                    borderRadius: '50%', padding: '0 5px', fontSize: '10px', fontWeight: 'bold' 
                  }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="card fade-in" style={{
                  position: 'absolute', top: '100%', right: 0, width: '300px', zIndex: 50, 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '1rem', background: '#fff'
                }}>
                  <div className="flex-between" style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>Notifications</h4>
                    {notifications.length > 0 && (
                      <button className="btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center', margin: '1rem 0' }}>No new notifications.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.map(n => (
                        <div key={n._id} style={{ padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px', borderLeft: '3px solid #b49359' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{n.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#555' }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div
              className="dash-avatar-sm"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, #f4e8d1)` }}
            >
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="dash-content">
          {renderModule()}
        </div>
      </div>
    </div>
  );
}
