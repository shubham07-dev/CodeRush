// ─────────────────────────────────────────────────────────
// Navbar – top navigation with auth actions
// ─────────────────────────────────────────────────────────

export default function Navbar({ onLogin, onRegister }) {
  return (
    <nav className="nav" id="main-nav">
      <div className="brand">
        <span className="brand-dot" />
        <span>Smart Campus OS</span>
      </div>

      <div className="nav-links">
        <a href="#modules">Modules</a>
        <a href="#impact">Impact</a>
        <a href="#contact">Contact</a>
      </div>

      <div className="nav-actions">
        <button
          className="btn-ghost"
          type="button"
          onClick={onLogin}
          id="nav-login-btn"
        >
          Sign In
        </button>
        <button
          className="btn-primary"
          type="button"
          onClick={onRegister}
          id="nav-register-btn"
        >
          Get Started
        </button>
      </div>
    </nav>
  );
}
