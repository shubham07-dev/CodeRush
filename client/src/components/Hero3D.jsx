// ─────────────────────────────────────────────────────────
// Hero3D – 3D parallax hero section with floating cards
// ─────────────────────────────────────────────────────────

import { useMouseParallax } from '../hooks/useMouseParallax';

export default function Hero3D({ onGetStarted }) {
  const { transform } = useMouseParallax();

  return (
    <section className="hero">
      <div className="hero-text">
        <p className="eyebrow">AI-Powered Campus Intelligence</p>
        <h1>One Operating System For Every Smart Campus Decision.</h1>
        <p>
          Unify academics, facilities, transport, attendance, and analytics in a single AI-powered control layer built for modern institutions.
        </p>

        <div className="hero-actions">
          <button
            className="btn-primary"
            type="button"
            onClick={onGetStarted}
            id="hero-get-started"
          >
            Get Started Free
          </button>
          <button className="btn-ghost" type="button">View Architecture</button>
        </div>
      </div>

      <div className="hero-visual-wrap">
        <div className="hero-visual" style={{ transform }}>
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="orb orb-c" />

          <div className="control-card card-main">
            <p>Campus Pulse</p>
            <strong>98.2%</strong>
            <span>Operational Efficiency</span>
          </div>

          <div className="control-card card-left">
            <p>Active Buses</p>
            <strong>42</strong>
            <span>Live GPS Tracked</span>
          </div>

          <div className="control-card card-right">
            <p>Energy Optimization</p>
            <strong>-21%</strong>
            <span>Power Usage This Month</span>
          </div>
        </div>
      </div>
    </section>
  );
}
