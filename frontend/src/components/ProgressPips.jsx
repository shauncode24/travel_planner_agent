// ─────────────────────────────────────────────────
// FILE: src/components/ProgressPips.jsx
// ─────────────────────────────────────────────────

const ProgressPips = ({ total = 8, current = 0, visible = false }) => {
  if (!visible) return null;

  const s = {
    wrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 48px 10px',
      animation: 'fadeIn 0.3s ease both',
    },
    label: {
      fontFamily: "'DM Mono', monospace",
      fontSize: 11,
      color: 'var(--text-dimmer)',
      whiteSpace: 'nowrap',
    },
    pips: { display: 'flex', gap: 4 },
    pip: (i) => ({
      width: 22,
      height: 3,
      borderRadius: 2,
      background:
        i < current - 1
          ? 'var(--accent)'
          : i === current - 1
          ? 'var(--accent2)'
          : 'var(--border)',
      transition: 'background 0.4s',
      animation:
        i === current - 1
          ? 'pip-pulse 1s ease-in-out infinite alternate'
          : 'none',
    }),
    bar: {
      flex: 1,
      height: 2,
      borderRadius: 1,
      background: 'var(--border)',
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 1,
      background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
      width: `${Math.min((current / total) * 100, 100)}%`,
      transition: 'width 0.6s ease',
    },
  };

  return (
    <div style={s.wrap}>
      <span style={s.label}>
        Step {current}/{total}
      </span>
      <div style={s.pips}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={s.pip(i)} />
        ))}
      </div>
      <div style={s.bar}>
        <div style={s.fill} />
      </div>
    </div>
  );
};

export default ProgressPips;
