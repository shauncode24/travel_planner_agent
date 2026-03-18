# Yatra AI — Travel Planner

A professional React UI for the Yatra AI travel planner agent, featuring a dark/light mode toggle, real-time ReAct agent step display, and a clean component architecture.

---

## Project Structure

```
yatra-ai/
├── index.html                        # Vite entry point
├── index-standalone.html             # Zero-dependency standalone (open in browser directly)
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                      # React root render
    ├── App.jsx                       # Root component — state, agent loop
    │
    ├── components/
    │   ├── AmbientBackground.jsx     # Decorative animated blobs
    │   ├── Header.jsx                # Logo, status dot, theme toggle
    │   ├── Sidebar.jsx               # Quick plans, tools list, history
    │   ├── ProgressPips.jsx          # Step tracker bar (8 pips)
    │   ├── AgentFeed.jsx             # Scrollable step card feed
    │   ├── StepCard.jsx              # Individual thought/action/obs/final card
    │   ├── ThinkingCard.jsx          # Animated "thinking" indicator
    │   ├── WelcomeScreen.jsx         # Initial empty state with chips
    │   └── InputArea.jsx             # Textarea + send button
    │
    ├── utils/
    │   ├── agentRunner.js            # LLM call, tool execution, response parser
    │   ├── systemPrompt.js           # ReAct system prompt
    │   └── markdownRenderer.js       # Lightweight MD → HTML for final answer
    │
    └── styles/
        ├── globals.css               # CSS variables (dark + light), keyframes
        └── finalRendered.css         # Styles for the rendered itinerary card
```

---

## Quick Start

### Option A — Standalone (no install needed)
Open `index-standalone.html` directly in your browser. Everything is self-contained via Babel CDN. No build step required.

### Option B — Vite Dev Server (recommended for development)

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

```bash
npm run build    # production build → dist/
npm run preview  # preview production build
```

---

## Connecting a Real Backend

The UI currently **simulates** web search using the Anthropic API as an oracle. To connect the real Python backend:

### 1. Expose your Python tools via a REST API

Add a FastAPI (or Flask) server to your project:

```python
# server.py
from fastapi import FastAPI
from tools import web_search, calculator, save_itinerary

app = FastAPI()

@app.post("/tool/web_search")
async def tool_web_search(body: dict):
    return {"result": web_search(body["query"])}

@app.post("/tool/calculator")
async def tool_calculator(body: dict):
    return {"result": calculator(body["expression"])}

@app.post("/tool/save_itinerary")
async def tool_save_itinerary(body: dict):
    return {"result": save_itinerary(body["text"])}
```

Run with: `uvicorn server:app --reload`

### 2. Update `src/utils/agentRunner.js`

Replace the `executeTool` function:

```js
export const executeTool = async (action, input) => {
  const BASE = 'http://localhost:8000';
  const endpoints = {
    web_search:     { url: `${BASE}/tool/web_search`,     body: { query: input } },
    calculator:     { url: `${BASE}/tool/calculator`,     body: { expression: input } },
    save_itinerary: { url: `${BASE}/tool/save_itinerary`, body: { text: input } },
  };
  const ep = endpoints[action];
  if (!ep) return `Unknown tool: "${action}"`;
  const res = await fetch(ep.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ep.body),
  });
  const data = await res.json();
  return data.result;
};
```

### 3. Set your Tavily key in `.env`

```
TAVILY_API_KEY=tvly-...
OPENROUTER_API_KEY=sk-or-...
```

---

## Theme System

Colors are controlled entirely via CSS variables in `src/styles/globals.css`.

| Variable         | Dark                        | Light (white + blue)       |
|------------------|-----------------------------|----------------------------|
| `--bg`           | `#0b0c12`                   | `#f0f6ff`                  |
| `--bg2`          | `#10111a`                   | `#e4eef9`                  |
| `--accent`       | `#f0a030` (amber)           | `#0066cc` (blue)           |
| `--accent2`      | `#e05a20` (orange)          | `#0044aa` (deep blue)      |
| `--text`         | `#e8e5dc`                   | `#0d1a2e`                  |
| `--border`       | `rgba(255,255,255,0.07)`    | `rgba(0,80,180,0.12)`      |

Toggle is applied by setting `data-theme="light"` on `<html>`.

---

## Component Responsibilities

| Component             | Responsibility                                               |
|-----------------------|--------------------------------------------------------------|
| `App.jsx`             | Global state, agent loop orchestration, theme toggle         |
| `Header.jsx`          | Branding, live status dot, theme toggle button               |
| `Sidebar.jsx`         | Quick plan cards, tool pills, session history                |
| `AgentFeed.jsx`       | Renders step list, auto-scrolls, shows welcome/thinking      |
| `StepCard.jsx`        | Displays one ReAct step (thought/action/obs/final)           |
| `ThinkingCard.jsx`    | Animated bouncing dots while LLM is processing               |
| `ProgressPips.jsx`    | 8-pip progress bar showing current step                      |
| `WelcomeScreen.jsx`   | Empty state with animated icon and destination chips         |
| `InputArea.jsx`       | Auto-resizing textarea, keyboard shortcuts, send button      |
| `AmbientBackground`   | Fixed decorative gradient blobs behind the UI                |

---

## Fonts

- **Cormorant Garamond** — Display / logo (elegant serif)
- **DM Mono** — Labels, code, keyboard hints (monospace)
- **Plus Jakarta Sans** — Body text, inputs (clean sans-serif)
