// ─────────────────────────────────────────────────
// FILE: src/components/InputArea.jsx
// ─────────────────────────────────────────────────

import { useState, useRef } from 'react';

const SendIcon = () => (
  <svg
    width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const InputArea = ({ value, onChange, onSend, disabled }) => {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    autoResize();
  };

  const s = {
    wrap: {
      padding: '18px 48px 26px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
    },
    inputWrap: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-end',
      background: 'var(--bg2)',
      border: `1px solid ${focused ? 'var(--border-hi)' : 'var(--border)'}`,
      borderRadius: 20,
      padding: '12px 14px',
      boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'none',
      transition: 'all 0.25s',
    },
    textarea: {
      flex: 1,
      background: 'none',
      border: 'none',
      outline: 'none',
      color: 'var(--text)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 15,
      lineHeight: 1.6,
      resize: 'none',
      maxHeight: 140,
      minHeight: 24,
    },
    btn: {
      width: 42,
      height: 42,
      borderRadius: 12,
      background: disabled
        ? 'var(--bg3)'
        : 'linear-gradient(135deg, var(--accent), var(--accent2))',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: disabled ? 'var(--text-dimmer)' : 'white',
      transition: 'all 0.2s',
      flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
    },
    hint: {
      display: 'flex',
      gap: 18,
      marginTop: 10,
      fontFamily: "'DM Mono', monospace",
      fontSize: 11,
      color: 'var(--text-dimmer)',
    },
    hintItem: { display: 'flex', alignItems: 'center', gap: 4 },
    kbd: {
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      padding: '1px 5px',
      borderRadius: 4,
      fontSize: 10,
      fontFamily: "'DM Mono', monospace",
    },
  };

  return (
    <div style={s.wrap}>
      <div style={s.inputWrap}>
        <textarea
          ref={textareaRef}
          style={s.textarea}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Where do you want to go? Include destination, duration, budget, and number of travellers…"
          rows={1}
        />
        <button style={s.btn} onClick={onSend} disabled={disabled}>
          <SendIcon />
        </button>
      </div>

      <div style={s.hint}>
        <span style={s.hintItem}>
          <kbd style={s.kbd}>Enter</kbd> send
        </span>
        <span style={s.hintItem}>
          <kbd style={s.kbd}>Shift</kbd>+<kbd style={s.kbd}>Enter</kbd> newline
        </span>
        <span style={s.hintItem}>All prices in ₹</span>
      </div>
    </div>
  );
};

export default InputArea;
