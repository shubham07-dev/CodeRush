// ─────────────────────────────────────────────────────────
// App – root component with routing between landing,
//        auth pages, and the role-based dashboard
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar';
import Hero3D from './components/Hero3D';
import Modules from './components/Modules';
import ImpactStats from './components/ImpactStats';
import FooterCTA from './components/FooterCTA';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';

// ── View constants ──────────────────────────────────────
const VIEW = {
  LANDING: 'landing',
  LOGIN: 'login',
  REGISTER: 'register',
  DASHBOARD: 'dashboard'
};

import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:5000';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [view, setView] = useState(isAuthenticated ? VIEW.DASHBOARD : VIEW.LANDING);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      const socket = io(socketUrl);
      
      socket.on('new_assignment', (data) => {
        // Simple check if it targets this student
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

  // When auth succeeds, go to dashboard
  function handleAuthSuccess() {
    setView(VIEW.DASHBOARD);
  }

  // If user is authenticated, show dashboard
  if (isAuthenticated && view !== VIEW.LANDING) {
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

  // Auth pages
  if (view === VIEW.LOGIN) {
    return (
      <div className="auth-page">
        <div className="auth-bg-layer" />
        <LoginPage
          onSwitch={() => setView(VIEW.REGISTER)}
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
          onSwitch={() => setView(VIEW.LOGIN)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // Landing page (default)
  return (
    <div className="page-shell">
      <div className="bg-layer" />
      <Navbar
        onLogin={() => setView(VIEW.LOGIN)}
        onRegister={() => setView(VIEW.REGISTER)}
      />
      <main>
        <Hero3D onGetStarted={() => setView(VIEW.REGISTER)} />
        <Modules />
        <ImpactStats />
        <FooterCTA onGetStarted={() => setView(VIEW.REGISTER)} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
