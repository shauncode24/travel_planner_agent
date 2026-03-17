import requests
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


def web_search(query: str) -> str:
    print("\n🔧 TOOL USED: web_search")

    if not TAVILY_API_KEY:
        return "Error: Tavily API key not found"

    url = "https://api.tavily.com/search"

    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "advanced",
        "include_answer": True,
        "max_results": 5
    }

    try:
        response = requests.post(url, json=payload)
        data = response.json()

        print("\n🌐 TAVILY RAW RESPONSE (trimmed):\n")
        preview = str(data).replace("\n", " ")
        print(preview[:120] + "...")

        summary = data.get("answer", "")

        if summary:
            return summary

        results = data.get("results", [])
        if results:
            return results[0].get("content", "No useful results found")

        return "No useful results found"

    except Exception as e:
        return f"Error in web_search: {str(e)}"


def calculator(expression: str) -> str:
    print("\n🔧 TOOL USED: calculator")

    try:
        expression = expression.strip()

        allowed_chars = "0123456789+-*/(). "
        if any(c not in allowed_chars for c in expression):
            return "Error: Invalid numeric expression"

        result = eval(expression)
        return f"Result: {result}"

    except Exception:
        return "Error: Invalid numeric expression"


def save_itinerary(text: str) -> str:
    print("\n🔧 TOOL USED: save_itinerary")

    if not text:
        return "Error: No content to save"

    os.makedirs("output", exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"output/itinerary_{timestamp}.txt"

    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(str(text))

        return f"Itinerary saved to {filename}"

    except Exception as e:
        return f"Error saving file: {str(e)}"


TOOLS = {
    "web_search": web_search,
    "calculator": calculator,
    "save_itinerary": save_itinerary
}