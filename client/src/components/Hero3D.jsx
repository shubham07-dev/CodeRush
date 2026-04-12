// ─────────────────────────────────────────────────────────
// Hero3D – Typed text effect + floating parallax cards
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMouseParallax } from '../hooks/useMouseParallax';

const ROLES = ['Students', 'Teachers', 'Admins', 'Campus Ops'];

function useTypedText(words, typingMs = 100, pauseMs = 2000, deleteMs = 60) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let timer;

    if (!isDeleting && charIdx <= word.length) {
      timer = setTimeout(() => {
        setDisplay(word.slice(0, charIdx));
        if (charIdx === word.length) {
          setTimeout(() => setIsDeleting(true), pauseMs);
        } else {
          setCharIdx(c => c + 1);
        }
      }, typingMs);
    } else if (isDeleting && charIdx >= 0) {
      timer = setTimeout(() => {
        setDisplay(word.slice(0, charIdx));
        if (charIdx === 0) {
          setIsDeleting(false);
          setWordIdx((wordIdx + 1) % words.length);
        } else {
          setCharIdx(c => c - 1);
        }
      }, deleteMs);
    }

    return () => clearTimeout(timer);
  }, [charIdx, isDeleting, wordIdx, words, typingMs, pauseMs, deleteMs]);

  return display;
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const floatCard = {
  hidden: { opacity: 0, scale: 0.85, y: 30 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 0.4 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Hero3D({ onGetStarted, onNavigate }) {
  const typedRole = useTypedText(ROLES);
  const { transform } = useMouseParallax();
  const sectionRef = useRef(null);

  return (
    <section className="aura-hero" ref={sectionRef}>
      <div className="aura-hero__text">
        <motion.div
          className="aura-hero__eyebrow"
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          ✦ SMART CAMPUS OPERATING SYSTEM
        </motion.div>

        <motion.h1
          className="aura-hero__heading"
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          Your Unified<br />
          <span className="aura-hero__highlight">AI Intelligence</span> Hub.<br />
          <span className="aura-hero__typed-wrap">
            For <span className="aura-hero__typed">{typedRole}</span>
            <span className="aura-hero__cursor">|</span>
          </span>
        </motion.h1>

        <motion.p
          className="aura-hero__subtitle"
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          OmniCampus seamlessly integrates all aspects of your academic journey.
          Mark attendance, manage assignments, join live classes, and navigate
          with precise 3D-mapped GPS — all from one secure, role-based solution.
        </motion.p>

        <motion.div
          className="aura-hero__actions"
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <button className="aura-nav__cta aura-nav__cta--lg" type="button" onClick={onGetStarted} id="hero-get-started">
            Launch Your Dashboard
          </button>
          <button onClick={onNavigate} className="aura-hero__map-btn" type="button">
            Explore Campus Map →
          </button>
        </motion.div>
      </div>

      {/* Floating Visual Panel */}
      <div className="aura-hero__visual">
        <div className="aura-hero__visual-inner" style={{ transform }}>
          {/* Central Image */}
          <div className="aura-hero__main-card">
            <img
              src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=60"
              alt="Campus"
            />
          </div>

          {/* Floating Stat Cards */}
          <motion.div className="aura-float-card aura-float-card--tl" custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={floatCard}>
            <div className="aura-float-card__label">Live Map View</div>
            <div className="aura-float-card__icon">📍</div>
            <div className="aura-float-card__footer">
              <span>Hostel Block A</span><span>→</span>
            </div>
          </motion.div>

          <motion.div className="aura-float-card aura-float-card--bl" custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={floatCard}>
            <div className="aura-float-card__header">
              <span>Virtual Classroom</span>
              <span className="aura-float-card__live">LIVE</span>
            </div>
            <div className="aura-float-card__body-row">
              <img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&auto=format&fit=crop" alt="Prof" className="aura-float-card__avatar" />
              <div className="aura-float-card__eq">E(x) = ∫ ...</div>
            </div>
            <div className="aura-float-card__course">LIVE: <span>Advanced Data Structures</span></div>
          </motion.div>

          <motion.div className="aura-float-card aura-float-card--tr" custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={floatCard}>
            <div className="aura-float-card__label">OmniCampus Copilot</div>
            <div className="aura-float-card__attendance">
              <div style={{ color: '#b49359', fontWeight: 600 }}>Ask me anything! 🤖</div>
              <div className="aura-float-card__marked" style={{ color: '#10b981', marginTop: '4px' }}>⚡ Vector Cache Active</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '2px' }}>Context-aware RAG engine</div>
            </div>
          </motion.div>

          <motion.div className="aura-float-card aura-float-card--br" custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={floatCard}>
            <div className="aura-float-card__label">Virtual Code Editor</div>
            <div className="aura-float-card__task">
              <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>FILE: main.js</div>
              <div style={{ fontFamily: 'monospace', background: '#1c1c1c', color: '#10b981', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', margin: '6px 0' }}>{`console.log("Hello");`}</div>
              <div className="aura-float-card__pending" style={{ color: '#b49359' }}>Node.js Runtime Ready</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
