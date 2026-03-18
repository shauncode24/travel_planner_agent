"""
Flask API server — bridges the React frontend to the Python agent.

Endpoints:
  POST /api/chat    → LLM call (OpenRouter)
  POST /api/search  → web_search (Tavily)
  POST /api/calc    → calculator (safe eval)
  POST /api/save    → save_itinerary to disk
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os, requests as req, re, datetime
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
TAVILY_API_KEY     = os.getenv("TAVILY_API_KEY")

app = Flask(__name__)
CORS(app)  # allow Vite dev-server (localhost:5173) to call us


# ── /api/chat  ──────────────────────────────────────────────────────────────

@app.route("/api/chat", methods=["POST"])
def chat():
    body     = request.json or {}
    messages = body.get("messages", [])
    system   = body.get("system", "")

    # Prepend system prompt as first user/assistant exchange expected by OpenRouter
    payload = {
        "model":    "openai/gpt-3.5-turbo",
        "messages": [{"role": "system", "content": system}] + messages,
    }

    try:
        r = req.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization":  f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type":   "application/json",
                "HTTP-Referer":   "http://localhost",
                "X-Title":        "Travel Planner Agent",
            },
            json=payload,
            timeout=60,
        )
        data = r.json()
        if "choices" not in data:
            return jsonify({"error": str(data)}), 502
        text = data["choices"][0]["message"]["content"]
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── /api/search  ────────────────────────────────────────────────────────────

@app.route("/api/search", methods=["POST"])
def search():
    query = (request.json or {}).get("query", "")
    if not query:
        return jsonify({"result": "Error: no query provided"}), 400

    try:
        r = req.post(
            "https://api.tavily.com/search",
            json={
                "api_key":       TAVILY_API_KEY,
                "query":         query,
                "search_depth":  "advanced",
                "include_answer": True,
                "max_results":   5,
            },
            timeout=30,
        )
        data = r.json()
        answer = data.get("answer", "")
        if answer:
            return jsonify({"result": answer})
        results = data.get("results", [])
        if results:
            return jsonify({"result": results[0].get("content", "No results")})
        return jsonify({"result": "No useful results found"})
    except Exception as e:
        return jsonify({"result": f"Error in web_search: {e}"}), 500


# ── /api/calc  ──────────────────────────────────────────────────────────────

@app.route("/api/calc", methods=["POST"])
def calc():
    expression = (request.json or {}).get("expression", "")
    original   = expression

    # Clean the expression (same logic as tools.py)
    expression = re.sub(r'\([^)]*[a-zA-Z][^)]*\)', '', expression)
    expression = expression.replace('₹','').replace('$','').replace('€','').replace(',','')
    expression = re.sub(r'[a-zA-Z_]+', '', expression)
    expression = re.sub(r'[^0-9+\-*/().\s]', '', expression)
    expression = expression.strip()
    expression = re.sub(r'\*{2,}', '*', expression)
    expression = re.sub(r'/{2,}', '/', expression)
    expression = re.sub(r'[+\-*/]{2,}', lambda m: m.group(0)[0], expression)

    if not expression:
        return jsonify({"result": f"Error: could not parse '{original}'"})

    try:
        result = eval(expression, {"__builtins__": {}}, {})
        val    = round(float(result), 2)
        if val == int(val):
            val = int(val)
        return jsonify({"result": f"Result: {val}"})
    except ZeroDivisionError:
        return jsonify({"result": "Error: division by zero"})
    except Exception as e:
        return jsonify({"result": f"Error: {e}"})


# ── /api/save  ──────────────────────────────────────────────────────────────

@app.route("/api/save", methods=["POST"])
def save():
    text = (request.json or {}).get("text", "")
    if not text:
        return jsonify({"result": "Error: no content"}), 400

    os.makedirs("output", exist_ok=True)
    ts       = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"output/itinerary_{ts}.txt"

    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(text)
        return jsonify({"result": f"Itinerary saved to {filename}"})
    except Exception as e:
        return jsonify({"result": f"Error saving: {e}"}), 500


# ── Health check  ────────────────────────────────────────────────────────────

@app.route("/api/save-log", methods=["POST"])
def save_log():
    """Save the agent reasoning steps (thoughts / actions / observations) as a log file."""
    text = (request.json or {}).get("text", "")
    if not text:
        return jsonify({"result": "Error: no content"}), 400

    os.makedirs("output", exist_ok=True)
    ts       = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"output/log_{ts}.txt"

    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"Travel Planner Agent — Step Log\nGenerated: {ts}\n")
            f.write("=" * 60 + "\n\n")
            f.write(text)
        return jsonify({"result": f"Log saved to {filename}"})
    except Exception as e:
        return jsonify({"result": f"Error saving log: {e}"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("🚀  Travel Planner API  →  http://localhost:8000")
    app.run(port=8000, debug=True)
