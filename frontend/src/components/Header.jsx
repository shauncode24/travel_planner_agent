// ─────────────────────────────────────────────────
// FILE: src/components/Header.jsx
// ─────────────────────────────────────────────────

const STATUS_LABELS = {
  idle:    'Ready',
  running: 'Planning…',
  done:    'Done!',
};

const Header = ({ theme, onToggleTheme, status }) => {
  const s = {
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: 'var(--header-h)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
    },
    logo: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
    },
    logoTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 26,
      fontWeight: 600,
      letterSpacing: -0.5,
      color: 'var(--text)',
    },
    logoEm: {
      color: 'var(--accent)',
      fontStyle: 'italic',
    },
    logoTag: {
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: 'var(--text-dim)',
      border: '1px solid var(--border)',
      padding: '2px 8px',
      borderRadius: 4,
    },
    right: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: status === 'running' ? 'var(--accent)' : 'var(--text-dimmer)',
      boxShadow: status === 'running' ? '0 0 8px var(--accent)' : 'none',
      animation: status === 'running' ? 'pip-pulse 1.2s ease-in-out infinite alternate' : 'none',
      transition: 'all 0.3s',
    },
    statusTxt: {
      fontFamily: "'DM Mono', monospace",
      fontSize: 11,
      color: 'var(--text-dim)',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    toggle: {
      width: 44,
      height: 24,
      borderRadius: 12,
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      padding: 3,
      transition: 'all 0.3s',
    },
    knob: {
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: 'var(--accent)',
      transform: theme === 'light' ? 'translateX(20px)' : 'translateX(0)',
      transition: 'transform 0.3s',
    },
  };

  return (
    <header style={s.header}>
      <div style={s.logo}>
        <span style={s.logoTitle}>
          <em style={s.logoEm}>Yatra</em> AI
        </span>
        <span style={s.logoTag}>Travel Agent</span>
      </div>

      <div style={s.right}>
        <div style={s.dot} />
        <span style={s.statusTxt}>{STATUS_LABELS[status] ?? 'Ready'}</span>
        <div style={s.toggle} onClick={onToggleTheme} title="Toggle light/dark mode">
          <div style={s.knob} />
        </div>
      </div>
    </header>
  );
};

export default Header;
