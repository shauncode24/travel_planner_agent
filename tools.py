import requests
import datetime
import os

# 🔑 ADD YOUR KEYS HERE
TAVILY_API_KEY = "YOUR_TAVILY_API_KEY"


# ------------------ TOOL 1: WEB SEARCH ------------------ #
def web_search(query: str) -> str:
    print("\n🔧 TOOL USED: web_search")

    import os
    from dotenv import load_dotenv
    import requests

    load_dotenv()
    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

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

        # 🔍 DEBUG (optional)
        print("\n🌐 TAVILY RAW RESPONSE:\n", data)

        results = []

        # ✅ include summarized answer
        if "answer" in data and data["answer"]:
            results.append("Summary: " + data["answer"])

        # ✅ include search results
        for r in data.get("results", []):
            title = r.get("title", "")
            content = r.get("content", "")
            results.append(f"{title}: {content}")

        if not results:
            return "No useful results found"

        return "\n".join(results[:5])

    except Exception as e:
        return f"Error in web_search: {str(e)}"

# ------------------ TOOL 2: CALCULATOR ------------------ #
def calculator(expression: str) -> str:
    print("\n🔧 TOOL USED: calculator")

    try:
        # VERY basic safety
        allowed_chars = "0123456789+-*/(). "
        if any(c not in allowed_chars for c in expression):
            return "Invalid expression"

        result = eval(expression)
        return f"Result: {result}"

    except Exception as e:
        return f"Calculation error: {str(e)}"


# ------------------ TOOL 3: SAVE ITINERARY ------------------ #
def save_itinerary(text: str) -> str:
    print("\n🔧 TOOL USED: save_itinerary")

    os.makedirs("output", exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"output/itinerary_{timestamp}.txt"

    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(text)

        return f"Itinerary saved to {filename}"

    except Exception as e:
        return f"Error saving file: {str(e)}"


# ------------------ TOOL REGISTRY ------------------ #
TOOLS = {
    "web_search": web_search,
    "calculator": calculator,
    "save_itinerary": save_itinerary
}