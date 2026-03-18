import re
import requests
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


def web_search(query: str) -> str:
    print("\nTOOL USED: web_search")

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

        print("\nTAVILY RAW RESPONSE (trimmed):\n")
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
    print("\nTOOL USED: calculator")
    print(f"   Raw input: {expression}")

    if not expression or not expression.strip():
        return "Error: Empty expression. Provide a math expression like: 5000 * 5"

    original = expression

    # Step 1: Remove anything inside parentheses that contains letters (text notes from LLM)
    expression = re.sub(r'\([^)]*[a-zA-Z][^)]*\)', '', expression)

    # Step 2: Remove currency symbols and thousand separators
    expression = expression.replace('₹', '').replace('$', '').replace('€', '')
    expression = expression.replace(',', '')

    # Step 3: Remove any remaining letter sequences
    expression = re.sub(r'[a-zA-Z_]+', '', expression)

    # Step 4: Keep only math-safe characters
    expression = re.sub(r'[^0-9+\-*/().\s]', '', expression)
    expression = expression.strip()

    # Step 5: Fix double operators that might result from cleanup
    expression = re.sub(r'\*{2,}', '*', expression)
    expression = re.sub(r'/{2,}', '/', expression)
    expression = re.sub(r'[+\-*/]{2,}', lambda m: m.group(0)[0], expression)

    print(f"   Cleaned expression: {expression}")

    if not expression:
        return (
            f"Error: Could not extract a valid math expression from: '{original}'\n"
            f"Please use ONLY numbers and operators. Example: 5000 * 5 + 2000"
        )

    try:
        result = eval(expression, {"__builtins__": {}}, {})
        result_val = round(float(result), 2)

        if result_val == int(result_val):
            result_val = int(result_val)

        print(f"   Result: {result_val}")
        return f"Result: {result_val}"

    except ZeroDivisionError:
        return "Error: Division by zero."

    except SyntaxError:
        return (
            f"Error: Bad math expression after cleanup: '{expression}'\n"
            f"Original input was: '{original}'\n"
            f"Tip: Use only digits and + - * / ( ) with NO text or symbols."
        )

    except Exception as e:
        return f"Error evaluating '{expression}': {str(e)}"


def save_itinerary(text: str) -> str:
    print("\nTOOL USED: save_itinerary")

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