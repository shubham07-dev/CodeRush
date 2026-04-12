// ─────────────────────────────────────────────────────────
// Footer CTA – bottom call-to-action section
// ─────────────────────────────────────────────────────────

export default function FooterCTA({ onGetStarted }) {
  return (
    <section id="contact" className="cta">
      <h2>Bring Your Campus Into Real-Time Intelligence.</h2>
      <p>Launch your Smart Campus OS with modular deployment and role-based dashboards.</p>
      <button
        className="btn-primary"
        type="button"
        onClick={onGetStarted}
        id="footer-get-started"
      >
        Get Started Now
      </button>
    </section>
  );
}
