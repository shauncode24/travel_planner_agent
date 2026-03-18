// ─────────────────────────────────────────────────
// FILE: src/components/AgentFeed.jsx
// ─────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import StepCard from './StepCard';
import WelcomeScreen from './WelcomeScreen';

const DOT_DELAYS = [0, 0.18, 0.36];

/**
 * Inline spinner shown while the agent is running.
 * Replaces the intermediate step cards — users only see the final itinerary.
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
      background: 'rgba(var(--accent-rgb, 88 166 255) / 0.08)',
      border: '1px solid rgba(var(--accent-rgb, 88 166 255) / 0.2)',
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

  // Extract the user request (always first)
  const userStep  = steps.find(s => s.type === 'user-msg');
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

          {/* While running — show spinner instead of intermediate steps */}
          {running && <GeneratingSpinner thinking={thinking} />}

          {/* When done — show only the final itinerary */}
          {!running && finalStep && (
            <StepCard
              type={finalStep.type}
              content={finalStep.content}
              stepNum={finalStep.stepNum}
              toolName={finalStep.toolName}
            />
          )}

          {/* If no final answer yet but not running (edge: error) */}
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

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default AgentFeed;
