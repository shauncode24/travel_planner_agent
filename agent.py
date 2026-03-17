import requests
import os
from dotenv import load_dotenv

from prompts import SYSTEM_PROMPT
from tools import TOOLS, save_itinerary

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")


def call_llm(messages):
    url = "https://openrouter.ai/api/v1/chat/completions"

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

    print("\n🛑 RAW API RESPONSE (trimmed):\n")
    preview = str(response).replace("\n", " ")
    print(preview[:120] + "...")

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
            final_answer = "\n".join(lines[i:]).replace("Final Answer:", "").strip()

    return action, action_input, final_answer


def run_agent(user_input):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_input}
    ]

    for step in range(50):
        print(f"\n🔁 STEP {step+1} " + "-"*50)

        response = call_llm(messages)

        print("\n🤖 LLM RESPONSE:\n")
        print(response)

        action, action_input, final_answer = parse_response(response)

        if final_answer:
            print("\n✅ FINAL ANSWER:\n")
            print(final_answer)

            save_itinerary(final_answer)
            break

        if not action or action not in TOOLS:
            print("\n⚠️ No valid action. Forcing final answer...\n")

            messages.append({
                "role": "user",
                "content": "You now have enough information. Provide the FINAL ANSWER."
            })

            response = call_llm(messages)

            _, _, final_answer = parse_response(response)

            if final_answer:
                print("\n✅ FINAL ANSWER:\n")
                print(final_answer)
                save_itinerary(final_answer)
                break
            else:
                print(response)
                break

        print(f"\n🔧 Action: {action}")
        print(f"📥 Input: {action_input}")

        tool_function = TOOLS[action]
        observation = tool_function(action_input)

        print("\n👁 Observation:")
        clean_obs = str(observation).split("\n")[0]
        print(clean_obs[:200] + "...")

        messages.append({"role": "assistant", "content": response})
        messages.append({
            "role": "user",
            "content": f"Observation: {observation}"
        })

    return