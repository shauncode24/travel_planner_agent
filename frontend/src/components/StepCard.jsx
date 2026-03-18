// ─────────────────────────────────────────────────
// FILE: src/components/StepCard.jsx
// ─────────────────────────────────────────────────

import { renderMarkdown } from '../utils/markdownRenderer';
import '../styles/finalRendered.css';

/** Maps each step type to its visual configuration. */
const STEP_CONFIG = {
  thought: {
    label: 'Thought',
    icon: '💭',
    bgVar: '--thought-bg',
    bdrVar: '--thought-bdr',
    color: 'var(--blue)',
  },
  action: {
    label: 'Action',
    icon: '⚡',
    bgVar: '--action-bg',
    bdrVar: '--action-bdr',
    color: 'var(--green)',
  },
  obs: {
    label: 'Observation',
    icon: '👁',
    bgVar: '--obs-bg',
    bdrVar: '--obs-bdr',
    color: 'var(--yellow)',
  },
  final: {
    label: 'Itinerary Ready',
    icon: '✨',
    bgVar: '--final-bg',
    bdrVar: '--final-bdr',
    color: 'var(--accent)',
  },
  'user-msg': {
    label: 'Your Request',
    icon: '👤',
    bgVar: '--accent-glow',
    bdrVar: '--border-hi',
    color: 'var(--accent2)',
  },
};

const StepCard = ({ type, content, stepNum, toolName }) => {
  const cfg = STEP_CONFIG[type] ?? STEP_CONFIG.thought;

  const s = {
    wrapper: {
      padding: '4px 0',
      animation: 'fadeUp 0.35s ease both',
    },
    card: {
      borderRadius: 'var(--radius)',
      padding: '14px 18px',
      border: `1px solid var(${cfg.bdrVar})`,
      background: `var(${cfg.bgVar})`,
      marginBottom: 8,
    },
    labelRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    icon: { fontSize: 14 },
    labelText: {
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: cfg.color,
    },
    badge: {
      background: cfg.color,
      color: 'var(--bg)',
      padding: '1px 6px',
      borderRadius: 3,
      fontSize: 9,
      letterSpacing: 1,
      opacity: 0.85,
    },
    stepNum: {
      marginLeft: 'auto',
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      color: 'var(--text-dimmer)',
    },
    body: {
      fontSize: 14,
      lineHeight: 1.72,
      color: 'var(--text)',
      whiteSpace: type === 'action' ? 'nowrap' : 'pre-wrap',
      overflowX: type === 'action' ? 'auto' : 'visible',
      fontFamily:
        type === 'action'
          ? "'DM Mono', monospace"
          : "'Plus Jakarta Sans', sans-serif",
      ...(type === 'action' && { fontSize: 12, color: 'var(--text-dim)' }),
    },
  };

  const displayLabel = toolName ?? cfg.label;

  /* Final answer — rendered as styled HTML */
  if (type === 'final') {
    return (
      <div style={s.wrapper}>
        <div style={s.card}>
          <div style={s.labelRow}>
            <span style={s.icon}>{cfg.icon}</span>
            <span style={s.labelText}>{cfg.label}</span>
            {stepNum != null && <span style={s.stepNum}>step {stepNum}</span>}
          </div>
          <div
            className="final-rendered"
            style={{ fontSize: 14, lineHeight: 1.75 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.labelRow}>
          <span style={s.icon}>{cfg.icon}</span>
          <span style={s.labelText}>{displayLabel}</span>
          {type === 'action' && toolName && (
            <span style={s.badge}>{toolName.replace(/_/g, ' ')}</span>
          )}
          {stepNum != null && <span style={s.stepNum}>step {stepNum}</span>}
        </div>
        <div style={s.body}>{content}</div>
      </div>
    </div>
  );
};

export default StepCard;
