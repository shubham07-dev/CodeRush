// ─────────────────────────────────────────────────────────
// App – root component with routing between landing,
//        auth pages, and the role-based dashboard
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
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

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState(isAuthenticated ? VIEW.DASHBOARD : VIEW.LANDING);

  // When auth succeeds, go to dashboard
  function handleAuthSuccess() {
    setView(VIEW.DASHBOARD);
  }

  // If user is authenticated, show dashboard
  if (isAuthenticated && view !== VIEW.LANDING) {
    return <DashboardPage />;
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
