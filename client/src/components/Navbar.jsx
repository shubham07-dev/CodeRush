// ─────────────────────────────────────────────────────────
// Navbar – Sticky glassmorphism with hamburger on mobile
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onLogin, onRegister, onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Team', href: '#team' },
    { label: 'Campus Map', onClick: onNavigate },
  ];

  return (
    <>
      <nav
        className={`aura-nav ${scrolled ? 'aura-nav--scrolled' : ''}`}
        id="main-nav"
      >
        <div className="aura-nav__inner">
          {/* Brand */}
          <a href="#" className="aura-nav__brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/logo.png" alt="Aura Logo" className="aura-nav__logo" />
            <span>OmniCampus</span>
          </a>

          {/* Desktop Links */}
          <div className="aura-nav__links">
            {navLinks.map((link, i) => (
              <a
                key={i}
                href={link.href || '#'}
                onClick={(e) => {
                  if (link.onClick) { e.preventDefault(); link.onClick(); }
                }}
                className="aura-nav__link"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="aura-nav__actions">
            <button className="aura-nav__signin" type="button" onClick={onLogin} id="nav-login-btn">
              Sign In
            </button>
            <button className="aura-nav__cta" type="button" onClick={onRegister} id="nav-register-btn">
              Join OmniCampus
            </button>
          </div>

          {/* Hamburger */}
          <button
            className={`aura-hamburger ${menuOpen ? 'aura-hamburger--open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile Full-Screen Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="aura-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="aura-mobile-menu__content">
              {navLinks.map((link, i) => (
                <motion.a
                  key={i}
                  href={link.href || '#'}
                  className="aura-mobile-menu__link"
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  onClick={(e) => {
                    if (link.onClick) { e.preventDefault(); link.onClick(); }
                    setMenuOpen(false);
                  }}
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.div
                className="aura-mobile-menu__actions"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
              >
                <button className="aura-nav__signin" onClick={() => { onLogin(); setMenuOpen(false); }}>Sign In</button>
                <button className="aura-nav__cta" onClick={() => { onRegister(); setMenuOpen(false); }}>Join Aura</button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
