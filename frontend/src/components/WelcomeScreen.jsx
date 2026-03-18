// ─────────────────────────────────────────────────
// FILE: src/components/WelcomeScreen.jsx
// ─────────────────────────────────────────────────

import { useState } from 'react';

const DESTINATION_CHIPS = [
  { label: '🏖️ Goa',        prompt: 'Goa for 4 days from Mumbai, ₹25,000 for 2 people' },
  { label: '🏜️ Rajasthan',  prompt: 'Rajasthan 7-day road trip from Delhi, ₹50,000 for 4 people' },
  { label: '☕ Coorg',       prompt: 'Coorg 3 days from Bengaluru for 2, ₹15,000' },
  { label: '🐠 Andaman',    prompt: 'Andaman 7 days from Chennai for couple, ₹60,000' },
  { label: '🏔️ Ladakh',     prompt: 'Leh-Ladakh 8 days from Delhi for 3 friends, ₹70,000' },
  { label: '🌄 Ooty',       prompt: 'Ooty 3 days from Chennai for family of 4, ₹20,000' },
];

const WelcomeScreen = ({ onFillPrompt }) => {
  const [hoveredChip, setHoveredChip] = useState(null);

  const s = {
    wrap: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 22,
      textAlign: 'center',
      padding: '60px 40px',
      animation: 'fadeUp 0.6s ease both',
    },
    icon: {
      fontSize: 54,
      lineHeight: 1,
      animation: 'float 4s ease-in-out infinite',
    },
    h2: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 42,
      fontWeight: 300,
      letterSpacing: -1.2,
      lineHeight: 1.2,
      color: 'var(--text)',
    },
    em: {
      color: 'var(--accent)',
      fontStyle: 'italic',
    },
    p: {
      fontSize: 15,
      color: 'var(--text-dim)',
      maxWidth: 380,
      lineHeight: 1.75,
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
      marginTop: 6,
    },
    chip: (i) => ({
      padding: '9px 18px',
      borderRadius: 100,
      border: `1px solid ${hoveredChip === i ? 'var(--border-hi)' : 'var(--border)'}`,
      background: hoveredChip === i ? 'var(--accent-glow)' : 'rgba(128,128,128,0.03)',
      fontSize: 13,
      color: hoveredChip === i ? 'var(--text)' : 'var(--text-dim)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      transform: hoveredChip === i ? 'translateY(-2px)' : 'translateY(0)',
    }),
  };

  return (
    <div style={s.wrap}>
      <div style={s.icon}>✈️</div>

      <h2 style={s.h2}>
        Plan your next<br />
        <em style={s.em}>Indian adventure</em>
      </h2>

      <p style={s.p}>
        Tell me where you want to go, your budget, and trip duration.
        The agent will research flights, hotels, and activities — all in ₹.
      </p>

      <div style={s.chips}>
        {DESTINATION_CHIPS.map((chip, i) => (
          <div
            key={i}
            style={s.chip(i)}
            onClick={() => onFillPrompt(chip.prompt)}
            onMouseEnter={() => setHoveredChip(i)}
            onMouseLeave={() => setHoveredChip(null)}
          >
            {chip.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
