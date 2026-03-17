import requests
import os
from dotenv import load_dotenv

from prompts import SYSTEM_PROMPT
from tools import TOOLS

# ✅ LOAD ENV FILE
load_dotenv()

# ✅ GET KEY FROM ENV
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")


def call_llm(messages):
    url = "https://openrouter.ai/api/v1/chat/completions"

    print("\n🔑 USING API KEY:", OPENROUTER_API_KEY[:20] if OPENROUTER_API_KEY else "None")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Travel Planner Agent"
    }

    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": messages
    }

    response = requests.post(url, headers=headers, json=payload)

    print("\n🛑 RAW API RESPONSE:\n", response.text)

    data = response.json()

    if "choices" not in data:
        print("\n❌ API ERROR:\n", data)
        return "Final Answer: API call failed."

    return data["choices"][0]["message"]["content"]


def parse_response(response):
    lines = response.strip().split("\n")

    action = None
    action_input = None
    final_answer = None

    for i, line in enumerate(lines):
        line = line.strip()

        if line.startswith("Action:") and action is None:
            action = line.replace("Action:", "").strip()

        elif line.startswith("Action Input:") and action_input is None:
            action_input = line.replace("Action Input:", "").strip()

        elif line.startswith("Final Answer:"):
            final_answer = line.replace("Final Answer:", "").strip()

    return action, action_input, final_answer


def run_agent(user_input):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_input}
    ]

    for step in range(10):
        print(f"\n🔁 STEP {step+1}")

        response = call_llm(messages)

        print("\n🤖 LLM RESPONSE:\n")
        print(response)

        action, action_input, final_answer = parse_response(response)

        if final_answer:
            print("\n✅ FINAL ANSWER REACHED\n")
            return final_answer

        if not action or action not in TOOLS:
            print("\n⚠️ No valid action. Forcing final answer...\n")

            messages.append({
                "role": "user",
                "content": "You now have enough information. Provide the FINAL ANSWER in proper format."
            })

            response = call_llm(messages)
            print("\n🤖 FINAL LLM RESPONSE:\n", response)

            _, _, final_answer = parse_response(response)

            if final_answer:
                return final_answer
            else:
                return response

        tool_function = TOOLS[action]
        observation = tool_function(action_input)

        print("\n👁 OBSERVATION:\n", observation)

        messages.append({"role": "assistant", "content": response})
        messages.append({
            "role": "user",
            "content": f"Observation: {observation}"
        })

    return "Final Answer: Max iterations reached."