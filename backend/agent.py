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

    print("\nRAW API RESPONSE (trimmed):\n")
    preview = str(response).replace("\n", " ")
    print(preview[:120] + "...")

    data = response.json()

    if "choices" not in data:
        print("\nAPI ERROR:\n", data)
        return "Final Answer: API call failed."

    return data["choices"][0]["message"]["content"]


def parse_response(response):
    lines = response.strip().split("\n")

    action = None
    action_input = None
    final_answer = None

    for i, line in enumerate(lines):
        stripped = line.strip()

        if stripped.startswith("Action:") and action is None:
            action = stripped.replace("Action:", "").strip()

        elif stripped.startswith("Action Input:") and action_input is None:
            action_input = stripped.replace("Action Input:", "").strip()

        elif stripped.startswith("Final Answer:") and final_answer is None:
            remainder = stripped.replace("Final Answer:", "").strip()
            rest_of_lines = lines[i+1:]
            full_text = (remainder + "\n" + "\n".join(rest_of_lines)).strip()

            # Remove trailing "Remember to save_itinerary" lines
            clean_lines = []
            for ln in full_text.split("\n"):
                if "remember to save_itinerary" in ln.lower():
                    break
                clean_lines.append(ln)
            final_answer = "\n".join(clean_lines).strip()
            break  # stop parsing — everything after belongs to the answer

    return action, action_input, final_answer


def run_agent(user_input):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_input}
    ]

    invalid_action_count = 0
    MAX_INVALID = 3

    for step in range(50):
        print(f"\nSTEP {step+1} " + "-"*50)

        response = call_llm(messages)

        print("\nLLM RESPONSE:\n")
        print(response)

        action, action_input, final_answer = parse_response(response)

        # ── Final Answer reached ──────────────────────────────────────
        if final_answer:
            print("\nFINAL ANSWER:\n")
            print(final_answer)
            save_itinerary(final_answer)
            break

        # ── Valid tool action ─────────────────────────────────────────
        if action and action in TOOLS:
            invalid_action_count = 0  # reset counter on valid action

            print(f"\nAction: {action}")
            print(f"Input: {action_input}")

            tool_function = TOOLS[action]
            observation = tool_function(action_input)

            print("\nObservation:")
            print(str(observation))  # full observation, no truncation

            messages.append({"role": "assistant", "content": response})
            messages.append({
                "role": "user",
                "content": f"Observation: {observation}"
            })

        # ── Invalid / missing action ──────────────────────────────────
        else:
            invalid_action_count += 1
            print(f"\nInvalid action (attempt {invalid_action_count}/{MAX_INVALID}). Got: '{action}'")

            if invalid_action_count >= MAX_INVALID:
                print("\nToo many invalid actions. Forcing Final Answer...\n")
                messages.append({
                    "role": "user",
                    "content": (
                        "You have done enough research. "
                        "Now write the complete Final Answer using the exact format from your instructions. "
                        "All prices must be in ₹. Fill every field — no placeholders."
                    )
                })
                response = call_llm(messages)
                _, _, final_answer = parse_response(response)
                if final_answer:
                    print("\nFINAL ANSWER:\n")
                    print(final_answer)
                    save_itinerary(final_answer)
                else:
                    print("\nCould not extract Final Answer. Raw response:\n")
                    print(response)
                break
            else:
                # Nudge back on track without forcing Final Answer prematurely
                messages.append({"role": "assistant", "content": response})
                messages.append({
                    "role": "user",
                    "content": (
                        "That was not a valid action. "
                        "Valid actions are: web_search, calculator, save_itinerary. "
                        "Continue with the next research step. "
                        "Respond with exactly: Thought / Action / Action Input."
                    )
                })

    return