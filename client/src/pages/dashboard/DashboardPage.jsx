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
import ClassesPage from '../onlineClass/ClassesPage.jsx';
import UserManagementPage from '../users/UserManagementPage.jsx';
import CampusNavigatePage from '../navigate/CampusNavigatePage.jsx';

const ROLE_THEMES = {
  student: { emoji: '🎓', accent: '#b49359', label: 'Student' },
  teacher: { emoji: '📚', accent: '#8d774f', label: 'Teacher' },
  admin: { emoji: '🛡️', accent: '#7f6438', label: 'Admin' }
};

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '📊', roles: ['student', 'teacher', 'admin'] },
  { key: 'attendance', label: 'Attendance', icon: '📋', roles: ['student', 'teacher', 'admin'] },
  { key: 'assignments', label: 'Assignments', icon: '📝', roles: ['student', 'teacher', 'admin'] },
  { key: 'practicals', label: 'Practicals', icon: '💻', roles: ['student', 'teacher', 'admin'] },
  { key: 'notices', label: 'Notices', icon: '📢', roles: ['student', 'teacher', 'admin'] },
  { key: 'complaints', label: 'Complaints', icon: '🔧', roles: ['student', 'teacher', 'admin'] },
  { key: 'utilities', label: 'Utilities', icon: '🛠️', roles: ['student', 'teacher', 'admin'] },
  { key: 'classes', label: 'Online Classes', icon: '📹', roles: ['student', 'teacher', 'admin'] },
  { key: 'locations', label: 'Campus Locations', icon: '📍', roles: ['admin'] },
  { key: 'navigate', label: 'Campus Navigate', icon: '🗺️', roles: ['student', 'teacher', 'admin'] },
  { key: 'users', label: 'People', icon: '👥', roles: ['teacher', 'admin'] }
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({});

  // Load "last seen" counts from localStorage
  const getSeenCounts = () => {
    try {
      return JSON.parse(localStorage.getItem('badge_seen_counts') || '{}');
    } catch { return {}; }
  };

  const saveSeenCount = (sectionKey, count) => {
    const seen = getSeenCounts();
    seen[sectionKey] = count;
    localStorage.setItem('badge_seen_counts', JSON.stringify(seen));
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      if (user.role === 'student') {
        fetchBadgeCounts();
        const interval = setInterval(fetchBadgeCounts, 30000);
        return () => clearInterval(interval);
      }
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

  const fetchBadgeCounts = async () => {
    try {
      const { data } = await api.get('/dashboard/badges');
      setBadgeCounts(data.data);
    } catch (error) {
      console.error('Failed to fetch badge counts', error);
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

  // Map nav keys to badge API keys
  const badgeKeyMap = {
    assignments: 'assignments',
    classes: 'classes',
    practicals: 'practicals',
    notices: 'notices',
  };

  // Handle section click: mark as "seen" and switch module
  const handleNavClick = (itemKey) => {
    const badgeKey = badgeKeyMap[itemKey];
    if (badgeKey && badgeCounts[badgeKey] !== undefined) {
      saveSeenCount(badgeKey, badgeCounts[badgeKey]);
    }
    setActiveModule(itemKey);
    setSidebarOpen(false);
  };

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
      case 'classes':
        return <ClassesPage />;
      case 'locations':
        return <CampusLocationsPage />;
      case 'navigate':
        return <CampusNavigatePage />;
      case 'users':
        return <UserManagementPage />;
      default:
        return <OverviewPanel />;
    }
  }

  // Compute visible badge numbers (new items since last visit)
  const seenCounts = getSeenCounts();

  return (
    <div className="dash-layout">
      {/* ── Mobile overlay ─────────────────────────── */}
      {sidebarOpen && (
        <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ────────────────────────────────── */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <img src="/logo.png" alt="OmniCampus Logo" style={{ height: '36px', width: 'auto', transform: 'scale(1.2)' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
            OmniCampus
          </span>
        </div>

        <nav className="dash-sidebar-nav">
          {visibleNav.map((item) => {
            const badgeKey = badgeKeyMap[item.key];
            const serverCount = badgeKey ? (badgeCounts[badgeKey] || 0) : 0;
            const lastSeen = badgeKey ? (seenCounts[badgeKey] || 0) : 0;
            const newCount = Math.max(0, serverCount - lastSeen);
            // Only show for students, only when there are NEW items, and not on the active section
            const showBadge = user.role === 'student' && newCount > 0 && item.key !== activeModule;

            return (
              <button
                key={item.key}
                className={`dash-nav-item${activeModule === item.key ? ' active' : ''}`}
                onClick={() => handleNavClick(item.key)}
                type="button"
                style={{ position: 'relative' }}
              >
                <span className="dash-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {showBadge && (
                  <span style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#ef4444', color: '#fff', borderRadius: '99px', fontSize: '0.7rem',
                    fontWeight: 800, padding: '0 5px', boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    {newCount > 99 ? '99+' : newCount}
                  </span>
                )}
              </button>
            );
          })}
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
