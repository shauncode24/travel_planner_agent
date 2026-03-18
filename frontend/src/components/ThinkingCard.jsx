// ─────────────────────────────────────────────────
// FILE: src/components/ThinkingCard.jsx
// ─────────────────────────────────────────────────

const DOT_DELAYS = [0, 0.15, 0.3];

const ThinkingCard = ({ label = 'Agent is researching…' }) => {
  const s = {
    wrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 18px',
      borderRadius: 'var(--radius)',
      background: 'rgba(128,128,128,0.03)',
      border: '1px solid var(--border)',
      margin: '4px 0 8px',
      animation: 'fadeUp 0.3s ease both',
    },
    dots: { display: 'flex', gap: 5 },
    dot: (delay) => ({
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--accent)',
      animation: `bounce-dot 1.2s ease-in-out ${delay}s infinite`,
    }),
    text: {
      fontFamily: "'DM Mono', monospace",
      fontSize: 12,
      color: 'var(--text-dim)',
    },
  };

  return (
    <div style={s.wrap}>
      <div style={s.dots}>
        {DOT_DELAYS.map((delay, i) => (
          <div key={i} style={s.dot(delay)} />
        ))}
      </div>
      <span style={s.text}>{label}</span>
    </div>
  );
};

export default ThinkingCard;
