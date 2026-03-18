// ─────────────────────────────────────────────────
// FILE: src/components/AgentFeed.jsx
// ─────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import StepCard from './StepCard';
import ThinkingCard from './ThinkingCard';
import WelcomeScreen from './WelcomeScreen';

const AgentFeed = ({ steps, thinking, showWelcome, onFillPrompt }) => {
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

  return (
    <div style={s.feed}>
      {showWelcome ? (
        <WelcomeScreen onFillPrompt={onFillPrompt} />
      ) : (
        steps.map((step, i) => (
          <StepCard
            key={i}
            type={step.type}
            content={step.content}
            stepNum={step.stepNum}
            toolName={step.toolName}
          />
        ))
      )}

      {thinking && <ThinkingCard label={thinking} />}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default AgentFeed;
