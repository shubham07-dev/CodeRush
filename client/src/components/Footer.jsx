// ─────────────────────────────────────────────────────────
// Footer – Dark themed with wave SVG and newsletter
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => { setSubscribed(false); setEmail(''); }, 3000);
    }
  };

  const socials = [
    { name: 'GitHub', icon: '🐙' },
    { name: 'LinkedIn', icon: '💼' },
    { name: 'Twitter', icon: '🐦' },
  ];

  return (
    <footer className="aura-footer">
      {/* Wave SVG Divider */}
      <div className="aura-footer__wave">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,100 1440,80 L1440,120 L0,120 Z" fill="#0f1117" />
        </svg>
      </div>

      <div className="aura-footer__body">
        <div className="aura-footer__inner">
          {/* Col 1: Brand */}
          <div className="aura-footer__col aura-footer__col--brand">
            <div className="aura-footer__brand">
              <img src="/logo.png" alt="Aura Logo" className="aura-footer__logo" />
              <span>OmniCampus</span>
            </div>
            <p className="aura-footer__desc">
              The definitive operating system unifying students, teachers, and campus operators through
              AI-powered intelligence and geospatial awareness.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="aura-footer__col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#team">Team</a></li>
              <li><a href="#">Campus Map</a></li>
              <li><a href="#">API Docs</a></li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div className="aura-footer__col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="aura-footer__col aura-footer__col--newsletter">
            <h4>Stay Updated</h4>
            <p>Get the latest OmniCampus updates delivered to your inbox.</p>
            <form onSubmit={handleSubscribe} className="aura-footer__form">
              {!subscribed ? (
                <>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit">→</button>
                </>
              ) : (
                <motion.div
                  className="aura-footer__subscribed"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <span className="aura-footer__check">✓</span>
                  <span>Subscribed!</span>
                </motion.div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="aura-footer__bottom">
          <p>© {new Date().getFullYear()} OmniCampus Inc. All rights reserved.</p>
          <div className="aura-footer__socials">
            {socials.map((s, i) => (
              <motion.a
                key={i}
                href="#"
                className="aura-footer__social-icon"
                whileHover={{ y: -5, scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                title={s.name}
              >
                {s.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
