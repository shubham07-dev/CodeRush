// ─────────────────────────────────────────────────────────
// App – root component with routing between landing,
//        auth pages, and the role-based dashboard
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar';
import Hero3D from './components/Hero3D';
import Modules from './components/Modules';
import Team from './components/Team';
import Footer from './components/Footer';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import CampusNavigatePage from './pages/navigate/CampusNavigatePage.jsx';
import CopilotWidget from './components/CopilotWidget.jsx';

// ── View constants ──────────────────────────────────────
const VIEW = {
  LANDING: 'landing',
  LOGIN: 'login',
  REGISTER: 'register',
  DASHBOARD: 'dashboard',
  NAVIGATE: 'navigate'
};

import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:5000';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  
  // Use a lazy initializer for view based on URL hash
  const [view, setView] = useState(() => {
    if (isAuthenticated) return VIEW.DASHBOARD;
    if (window.location.hash === '#navigate') return VIEW.NAVIGATE;
    if (window.location.hash === '#login') return VIEW.LOGIN;
    if (window.location.hash === '#register') return VIEW.REGISTER;
    return VIEW.LANDING;
  });

  const [toast, setToast] = useState(null);

  // Sync state to URL hash and listen for back button
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (isAuthenticated) {
        setView(VIEW.DASHBOARD);
      } else if (hash === '#navigate') setView(VIEW.NAVIGATE);
      else if (hash === '#login') setView(VIEW.LOGIN);
      else if (hash === '#register') setView(VIEW.REGISTER);
      else setView(VIEW.LANDING);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated]);

  // View setter wrapper that pushes to URL
  const changeView = (newView) => {
    if (newView === VIEW.LANDING) window.location.hash = '';
    else window.location.hash = newView;
    setView(newView);
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      const socket = io(socketUrl);
      
      socket.on('new_assignment', (data) => {
        if ((!data.targetDepartment || data.targetDepartment === user.department) &&
            (!data.targetYear || Number(data.targetYear) === Number(user.enrollmentYear)) &&
            (!data.targetSection || data.targetSection === user.section)) {
          setToast(`New Assignment Posted: ${data.title}`);
          setTimeout(() => setToast(null), 8000);
        }
      });

      return () => socket.disconnect();
    }
  }, [isAuthenticated, user]);

  function handleAuthSuccess() {
    changeView(VIEW.DASHBOARD);
  }

  useEffect(() => {
    if (isAuthenticated) {
      if (view === VIEW.LOGIN || view === VIEW.REGISTER || view === VIEW.LANDING) {
        changeView(VIEW.DASHBOARD);
      }
    }
  }, [isAuthenticated, view]);

  if (isAuthenticated && view === VIEW.DASHBOARD) {
    return (
      <>
        {toast && (
          <div className="animate-fade-in" style={{ position: 'fixed', top: 30, right: 30, background: '#2a241a', color: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontWeight: 600, display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <span>🔔</span>
            <span>{toast}</span>
          </div>
        )}
        <DashboardPage />
      </>
    );
  }

  if (view === VIEW.LOGIN) {
    return (
      <div className="auth-page">
        <div className="auth-bg-layer" />
        <LoginPage
          onSwitch={() => changeView(VIEW.REGISTER)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  if (view === VIEW.REGISTER) {
    return (
      <div className="auth-page">
        <div className="auth-bg-layer" />
        <RegisterPage
          onSwitch={() => changeView(VIEW.LOGIN)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  if (view === VIEW.NAVIGATE) {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <CampusNavigatePage onBack={() => changeView(VIEW.LANDING)} />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="bg-layer" />
      <Navbar
        onLogin={() => changeView(VIEW.LOGIN)}
        onRegister={() => changeView(VIEW.REGISTER)}
        onNavigate={() => changeView(VIEW.NAVIGATE)}
      />
      <main>
        <Hero3D onGetStarted={() => changeView(VIEW.REGISTER)} onNavigate={() => changeView(VIEW.NAVIGATE)} />
        <Modules onGetStarted={() => changeView(VIEW.LOGIN)} />
        <Team />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <CopilotWidget />
    </AuthProvider>
  );
}
