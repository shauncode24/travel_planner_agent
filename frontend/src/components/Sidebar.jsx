// ─────────────────────────────────────────────────
// FILE: src/components/Sidebar.jsx
// ─────────────────────────────────────────────────

import { useState } from 'react';

const QUICK_PLANS = [
  {
    emoji: '🏖️',
    title: 'Goa Getaway',
    sub: '5 days · 2 people',
    prompt: 'Plan a 5-day trip from Mumbai to Goa for 2 people in April. Budget ₹30,000',
  },
  {
    emoji: '🏔️',
    title: 'Manali Mountains',
    sub: '4 days · 3 friends',
    prompt: 'Plan a 4-day trip from Delhi to Manali for 3 friends in May. Budget ₹25,000',
  },
  {
    emoji: '🏯',
    title: 'Jaipur Heritage',
    sub: '3 days · couple',
    prompt: 'Plan a 3-day heritage trip to Jaipur for 2 people in March. Budget ₹20,000',
  },
  {
    emoji: '🌿',
    title: 'Kerala Backwaters',
    sub: '6 days · 2 people',
    prompt: 'Plan a 6-day trip from Bengaluru to Kerala for 2 people in June. Budget ₹35,000',
  },
];

const TOOLS = [
  { color: '#6496ff', name: 'web_search' },
  { color: '#3cc88c', name: 'calculator' },
  { color: '#f0a030', name: 'save_itinerary' },
];

const SectionLabel = ({ children }) => (
  <span style={{
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'var(--text-dimmer)',
    marginBottom: 10,
    display: 'block',
  }}>
    {children}
  </span>
);

const Divider = () => (
  <div style={{ height: 1, background: 'var(--border)' }} />
);

const Sidebar = ({ onFillPrompt, history }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const s = {
    aside: {
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      borderRight: '1px solid var(--border)',
      background: 'var(--bg2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      padding: '28px 18px',
      overflowY: 'auto',
    },
    quickCards: { display: 'flex', flexDirection: 'column', gap: 8 },
    card: (i) => ({
      background: hoveredCard === i ? 'var(--accent-glow)' : 'rgba(128,128,128,0.03)',
      border: `1px solid ${hoveredCard === i ? 'var(--border-hi)' : 'var(--border)'}`,
      borderRadius: 12,
      padding: '12px 14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }),
    cardEmoji: { fontSize: 18, marginBottom: 4, display: 'block' },
    cardTitle: { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
    cardSub:   { fontSize: 11, color: 'var(--text-dim)', marginTop: 2 },
    cardArrow: {
      position: 'absolute', right: 12, top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--accent)', fontSize: 14,
      opacity: hoveredCard !== null ? 1 : 0,
      transition: 'opacity 0.2s',
    },
    toolList: { display: 'flex', flexDirection: 'column', gap: 6 },
    toolPill: {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 10,
      background: 'rgba(128,128,128,0.03)',
      border: '1px solid var(--border)',
      fontFamily: "'DM Mono', monospace",
      fontSize: 12, color: 'var(--text-dim)',
    },
    toolDot: (color) => ({
      width: 6, height: 6, borderRadius: '50%',
      background: color, flexShrink: 0,
    }),
    historyList: { display: 'flex', flexDirection: 'column', gap: 6 },
    historyItem: {
      fontSize: 11, color: 'var(--text-dim)',
      padding: '8px 10px', borderRadius: 8,
      background: 'rgba(128,128,128,0.03)',
      border: '1px solid transparent',
      cursor: 'default', transition: 'all 0.2s',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    noHistory: {
      fontSize: 11, color: 'var(--text-dimmer)', padding: '4px 0',
    },
  };

  return (
    <aside style={s.aside}>
      {/* Quick Plans */}
      <div>
        <SectionLabel>Quick Plans</SectionLabel>
        <div style={s.quickCards}>
          {QUICK_PLANS.map((plan, i) => (
            <div
              key={i}
              style={s.card(i)}
              onClick={() => onFillPrompt(plan.prompt)}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <span style={s.cardEmoji}>{plan.emoji}</span>
              <div style={s.cardTitle}>{plan.title}</div>
              <div style={s.cardSub}>{plan.sub}</div>
              <span style={s.cardArrow}>→</span>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Tools */}
      <div>
        <SectionLabel>Available Tools</SectionLabel>
        <div style={s.toolList}>
          {TOOLS.map(tool => (
            <div key={tool.name} style={s.toolPill}>
              <span style={s.toolDot(tool.color)} />
              {tool.name}
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* History */}
      <div style={{ flex: 1 }}>
        <SectionLabel>History</SectionLabel>
        <div style={s.historyList}>
          {history.length === 0
            ? <div style={s.noHistory}>No previous sessions</div>
            : history.map((item, i) => (
                <div key={i} style={s.historyItem} title={item}>{item}</div>
              ))
          }
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
