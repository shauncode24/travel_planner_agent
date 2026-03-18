// ─────────────────────────────────────────────────
// FILE: src/utils/agentRunner.js
//
// All real work is done by the Python Flask backend.
// This file:
//   • Parses ReAct-format LLM responses
//   • Sends messages to /api/chat  (OpenRouter via Flask)
//   • Routes tool calls to /api/search, /api/calc, /api/save
// ─────────────────────────────────────────────────

import { getSystemPrompt } from './systemPrompt';

const BASE = '/api'; // proxied by Vite → http://localhost:8000

/**
 * Parses a ReAct-format LLM response into its parts:
 * thought, action, actionInput, finalAnswer.
 */
export const parseResponse = (text) => {
  const lines = text.split('\n');
  let thought = '', action = '', actionInput = '', finalAnswer = '';
  let inFinal = false;
  const finalLines = [];

  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();

    if (s.startsWith('Thought:') && !inFinal)
      thought = s.replace('Thought:', '').trim();
    else if (s.startsWith('Action:') && !inFinal)
      action = s.replace('Action:', '').trim();
    else if (s.startsWith('Action Input:') && !inFinal)
      actionInput = s.replace('Action Input:', '').trim();
    else if (s.startsWith('Final Answer:')) {
      inFinal = true;
      const rem = s.replace('Final Answer:', '').trim();
      if (rem) finalLines.push(rem);
    } else if (inFinal) {
      if (s.toLowerCase().includes('remember to save_itinerary')) break;
      finalLines.push(lines[i]);
    }
  }

  if (finalLines.length) finalAnswer = finalLines.join('\n').trim();
  return { thought, action, actionInput, finalAnswer };
};

/**
 * Calls the LLM via the Flask /api/chat endpoint.
 * The Flask server uses OpenRouter (gpt-3.5-turbo) with your API key.
 */
export const callLLM = async (messages) => {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: getSystemPrompt(),
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text || '';
};

/**
 * Real web search via Tavily (routed through Flask /api/search).
 */
export const webSearch = async (query) => {
  const res = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return data.result || 'No results found.';
};

/**
 * Calculator via Flask /api/calc (safe Python eval).
 */
export const evalCalc = async (expression) => {
  const res = await fetch(`${BASE}/calc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression }),
  });
  const data = await res.json();
  return data.result || 'Error: no result';
};

/**
 * Save itinerary via Flask /api/save — saves to backend/output/ directory.
 * Also triggers a browser download for convenience.
 */
export const saveItinerary = async (text) => {
  // Save on the server (backend/output/)
  const res = await fetch(`${BASE}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();

  // Also trigger a browser download
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `yatra_itinerary_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);

  return data.result || 'Itinerary saved.';
};

/**
 * Routes action name → tool function.
 * web_search and calc are now async (real API calls).
 */
export const executeTool = async (action, input) => {
  switch (action) {
    case 'web_search':     return await webSearch(input);
    case 'calculator':     return await evalCalc(input);
    case 'save_itinerary': return await saveItinerary(input);
    default:               return `Unknown tool: "${action}"`;
  }
};
