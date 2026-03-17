from agent import run_agent

print("🌍 AI Travel Planner Agent (ReAct)")
print("----------------------------------")

user_input = input("\nEnter your travel request:\n> ")

final_answer = run_agent(user_input)

print("\n\n🧾 FINAL ITINERARY:\n")
print(final_answer)