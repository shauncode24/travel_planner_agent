// ─────────────────────────────────────────────────
// FILE: src/components/AgentFeed.jsx
// ─────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import StepCard from './StepCard';
import WelcomeScreen from './WelcomeScreen';

const DOT_DELAYS = [0, 0.18, 0.36];

/**
 * Spinner shown while the agent is running.
 */
const GeneratingSpinner = ({ thinking }) => {
  const s = {
    wrap: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      padding: '60px 0',
      animation: 'fadeUp 0.4s ease both',
    },
    dotsRow: { display: 'flex', gap: 10, marginBottom: 8 },
    dot: (delay) => ({
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'var(--accent)',
      animation: `bounce-dot 1.2s ease-in-out ${delay}s infinite`,
    }),
    title: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 18,
      fontWeight: 600,
      color: 'var(--text)',
      letterSpacing: '-0.3px',
    },
    sub: {
      fontFamily: "'DM Mono', monospace",
      fontSize: 12,
      color: 'var(--text-dim)',
      textAlign: 'center',
      maxWidth: 340,
      lineHeight: 1.6,
    },
    badge: {
      marginTop: 4,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 14px',
      borderRadius: 20,
      background: 'rgba(240,160,48,0.08)',
      border: '1px solid rgba(240,160,48,0.2)',
      fontFamily: "'DM Mono', monospace",
      fontSize: 11,
      color: 'var(--accent)',
    },
  };

  return (
    <div style={s.wrap}>
      <div style={s.dotsRow}>
        {DOT_DELAYS.map((d, i) => (
          <div key={i} style={s.dot(d)} />
        ))}
      </div>
      <div style={s.title}>Crafting your itinerary&hellip;</div>
      <div style={s.sub}>
        The agent is researching destinations, calculating budgets, and planning your trip.
      </div>
      {thinking && <div style={s.badge}>⚙ {thinking}</div>}
    </div>
  );
};

/**
 * PDF download button — shown below the final itinerary.
 * Calls the Flask /api/pdf endpoint to get a properly formatted PDF.
 * Falls back to a client-side plain-text download if the backend is unavailable.
 */
const PdfDownloadButton = ({ itineraryText }) => {
  const [state, setState] = useState('idle'); // idle | loading | done | error

  const handleDownload = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: itineraryText }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Get filename from Content-Disposition header if present
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `yatra_itinerary_${new Date().toISOString().slice(0, 10)}.pdf`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      console.warn('PDF backend unavailable, falling back to text download:', err);
      // Fallback: plain-text download
      const blob = new Blob([itineraryText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yatra_itinerary_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const STATES = {
    idle: { icon: '⬇', label: 'Download PDF', bg: 'linear-gradient(135deg, var(--accent), var(--accent2))' },
    loading: { icon: '⏳', label: 'Generating PDF…', bg: 'var(--bg3)' },
    done: { icon: '✓', label: 'Downloaded!', bg: 'linear-gradient(135deg, #3cc88c, #2aaa78)' },
    error: { icon: '⚠', label: 'Saved as .txt', bg: 'var(--bg3)' },
  };

  const st = STATES[state];

  const s = {
    wrap: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 14,
      paddingTop: 12,
      borderTop: '1px solid var(--border)',
    },
    btn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      borderRadius: 12,
      border: 'none',
      cursor: state === 'loading' ? 'wait' : 'pointer',
      background: st.bg,
      color: 'white',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '-0.2px',
      transition: 'all 0.25s',
      opacity: state === 'loading' ? 0.7 : 1,
      boxShadow: state === 'idle' ? '0 4px 14px rgba(240,160,48,0.3)' : 'none',
    },
    hint: {
      alignSelf: 'center',
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      color: 'var(--text-dimmer)',
      letterSpacing: 0.5,
    },
  };

  return (
    <div style={s.wrap}>
      <span style={s.hint}>Formatted PDF with full itinerary</span>
      <button style={s.btn} onClick={handleDownload} disabled={state === 'loading'}>
        <span>{st.icon}</span>
        {st.label}
      </button>
    </div>
  );
};

/**
 * Main feed component.
 */
const AgentFeed = ({ steps, thinking, showWelcome, onFillPrompt, running, status }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps, thinking]);

  const s = {
    feed: {
      flex: 1,
      overflowY: 'auto',
      padding: '32px 48px 20px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 1,
    },
  };

  const userStep = steps.find(s => s.type === 'user-msg');
  const finalStep = steps.find(s => s.type === 'final');

  return (
    <div style={s.feed}>
      {showWelcome ? (
        <WelcomeScreen onFillPrompt={onFillPrompt} />
      ) : (
        <>
          {/* Always show user request */}
          {userStep && (
            <StepCard
              type={userStep.type}
              content={userStep.content}
              stepNum={userStep.stepNum}
              toolName={userStep.toolName}
            />
          )}

          {/* While running — show spinner */}
          {running && <GeneratingSpinner thinking={thinking} />}

          {/* When done — show final itinerary + PDF button */}
          {!running && finalStep && (
            <>
              <StepCard
                type={finalStep.type}
                content={finalStep.content}
                stepNum={finalStep.stepNum}
                toolName={finalStep.toolName}
              />
              <PdfDownloadButton itineraryText={finalStep.content} />
            </>
          )}

          {/* Edge case: error, no final answer */}
          {!running && !finalStep && status !== 'idle' && (
            <div style={{
              textAlign: 'center',
              color: 'var(--text-dim)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              padding: '40px 0',
            }}>
              No itinerary was generated. Please try again.
            </div>
          )}
        </>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default AgentFeed;