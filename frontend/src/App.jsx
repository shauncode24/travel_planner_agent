// ─────────────────────────────────────────────────
// FILE: src/App.jsx
// ─────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';

import AmbientBackground from './components/AmbientBackground';
import Header            from './components/Header';
import Sidebar           from './components/Sidebar';
import ProgressPips      from './components/ProgressPips';
import AgentFeed         from './components/AgentFeed';
import InputArea         from './components/InputArea';

import { parseResponse, callLLM, executeTool } from './utils/agentRunner';

import './styles/globals.css';
import './styles/finalRendered.css';

const TOOL_DISPLAY_LABELS = {
  web_search:     '🔍 Web Search',
  calculator:     '🧮 Calculator',
  save_itinerary: '💾 Save Itinerary',
};

const MAX_STEPS = 10;

const App = () => {
  const [theme,       setTheme]       = useState('dark');
  const [input,       setInput]       = useState('');
  const [steps,       setSteps]       = useState([]);
  const [thinking,    setThinking]    = useState(null);
  const [status,      setStatus]      = useState('idle');
  const [running,     setRunning]     = useState(false);
  const [history,     setHistory]     = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  // Logs accumulate ALL intermediate steps (thought/action/obs) for txt export
  const logsRef = useRef([]);

  /* ── Theme toggle ── */
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  /* ── Append a step card ── */
  const addStep = useCallback((type, content, stepNum = null, toolName = null) => {
    // Always push to logs ref (all step types)
    logsRef.current.push({ type, content, stepNum, toolName });
    // Only show user-msg and final on the feed
    if (type === 'user-msg' || type === 'final') {
      setSteps(prev => [...prev, { type, content, stepNum, toolName }]);
    }
  }, []);

  /* ── Fill the input from a chip / sidebar card ── */
  const fillPrompt = useCallback((text) => {
    setInput(text);
  }, []);

  /* ── Main agent loop ── */
  const sendMessage = async () => {
    if (!input.trim() || running) return;

    const userText = input.trim();
    setRunning(true);
    setInput('');
    setShowWelcome(false);
    setSteps([]);
    setStatus('running');
    setCurrentStep(0);
    logsRef.current = [];

    // Save to history (max 8 entries)
    setHistory(prev =>
      [
        userText.slice(0, 55) + (userText.length > 55 ? '…' : ''),
        ...prev,
      ].slice(0, 8)
    );

    addStep('user-msg', userText);

    const messages = [{ role: 'user', content: userText }];

    for (let i = 0; i < MAX_STEPS; i++) {
      const stepNum = i + 1;
      setCurrentStep(stepNum);
      setThinking('Thinking…');

      // ── Call LLM ────────────────────────────────
      let llmText;
      try {
        llmText = await callLLM(messages);
      } catch (err) {
        setThinking(null);
        addStep('obs', `API Error: ${err.message}`, stepNum);
        break;
      }

      setThinking(null);

      const { thought, action, actionInput, finalAnswer } = parseResponse(llmText);

      // Show thought
      if (thought) addStep('thought', thought, stepNum);

      // ── Final answer reached ─────────────────────
      if (finalAnswer) {
        addStep('final', finalAnswer, stepNum);
        setStatus('done');
        break;
      }

      // ── Execute tool ─────────────────────────────
      if (action) {
        const toolLabel = TOOL_DISPLAY_LABELS[action] ?? action;
        addStep('action', `${action}("${actionInput}")`, stepNum, toolLabel);
        setThinking(`Running ${action}…`);

        let observation;
        try {
          observation = await executeTool(action, actionInput);
        } catch (e) {
          observation = `Tool error: ${e.message}`;
        }

        setThinking(null);
        addStep('obs', observation, stepNum);

        messages.push({ role: 'assistant', content: llmText });
        messages.push({ role: 'user', content: `Observation: ${observation}` });
      } else {
        // Nudge back on track
        messages.push({
          role: 'user',
          content:
            'Invalid action. Continue with: Thought / Action / Action Input.',
        });
      }
    }

    setRunning(false);
    if (status !== 'done') setStatus('idle');

    // ── Save logs as a txt file on the backend ──────────────
    try {
      const logLines = logsRef.current.map((s) => {
        const label = s.type.toUpperCase();
        const step  = s.stepNum != null ? ` [Step ${s.stepNum}]` : '';
        return `=== ${label}${step} ===\n${s.content}\n`;
      }).join('\n');
      await fetch('/api/save-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: logLines }),
      });
    } catch (_) { /* non-critical */ }
  };

  /* ── Layout styles ── */
  const s = {
    app: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    },
    body: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1,
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
  };

  return (
    <div style={s.app}>
      <AmbientBackground />

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        status={status}
      />

      <div style={s.body}>
        <Sidebar
          onFillPrompt={fillPrompt}
          history={history}
        />

        <main style={s.main}>
          <ProgressPips
            total={8}
            current={currentStep}
            visible={running || status === 'done'}
          />

          <AgentFeed
            steps={steps}
            thinking={thinking}
            showWelcome={showWelcome}
            onFillPrompt={fillPrompt}
            running={running}
            status={status}
          />

          <InputArea
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            disabled={running}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
