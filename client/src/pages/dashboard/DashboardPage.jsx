// ─────────────────────────────────────────────────────────
// Dashboard Shell – sidebar navigation + module content
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import AttendancePage from '../attendance/AttendancePage.jsx';
import NoticePage from '../notices/NoticePage.jsx';
import ComplaintPage from '../complaints/ComplaintPage.jsx';
import UtilitiesPage from '../utilities/UtilitiesPage.jsx';
import CampusLocationsPage from '../locations/CampusLocationsPage.jsx';

const ROLE_THEMES = {
  student: { emoji: '🎓', accent: '#b49359', label: 'Student' },
  teacher: { emoji: '📚', accent: '#8d774f', label: 'Teacher' },
  admin: { emoji: '🛡️', accent: '#7f6438', label: 'Admin' }
};

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '📊', roles: ['student', 'teacher', 'admin'] },
  { key: 'attendance', label: 'Attendance', icon: '📋', roles: ['student', 'teacher', 'admin'] },
  { key: 'notices', label: 'Notices', icon: '📢', roles: ['student', 'teacher', 'admin'] },
  { key: 'complaints', label: 'Complaints', icon: '🔧', roles: ['student', 'teacher', 'admin'] },
  { key: 'utilities', label: 'Utilities', icon: '🛠️', roles: ['student', 'teacher', 'admin'] },
  { key: 'locations', label: 'Campus Locations', icon: '📍', roles: ['admin'] }
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const theme = ROLE_THEMES[user?.role] || ROLE_THEMES.student;

  if (!user) return null;

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  function renderModule() {
    switch (activeModule) {
      case 'attendance':
        return <AttendancePage />;
      case 'notices':
        return <NoticePage />;
      case 'complaints':
        return <ComplaintPage />;
      case 'utilities':
        return <UtilitiesPage />;
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
          <div
            className="dash-avatar-sm"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, #f4e8d1)` }}
          >
            {user.fullName.charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="dash-content">
          {renderModule()}
        </div>
      </div>
    </div>
  );
}
