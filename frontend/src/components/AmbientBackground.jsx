// ─────────────────────────────────────────────────
// FILE: src/components/AmbientBackground.jsx
// ─────────────────────────────────────────────────

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 700,
    height: 700,
    borderRadius: '50%',
    background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
    top: -200,
    right: -200,
    animation: 'drift 20s ease-in-out infinite alternate',
  },
  blob2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(100,150,255,0.04) 0%, transparent 70%)',
    bottom: -100,
    left: -100,
    animation: 'drift 26s ease-in-out infinite alternate-reverse',
  },
};

const AmbientBackground = () => (
  <div style={styles.root}>
    <div style={styles.blob1} />
    <div style={styles.blob2} />
  </div>
);

export default AmbientBackground;
