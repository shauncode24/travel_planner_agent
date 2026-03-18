import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def create_trip(user_request: str) -> str:
    """Create a new trip record, return its UUID."""
    result = supabase.table("trips").insert({
        "user_request": user_request,
        "status": "in_progress"
    }).execute()
    return result.data[0]["id"]

def log_step(trip_id: str, step_number: int, thought: str,
             action: str, action_input: str, observation: str):
    """Log one ReAct step."""
    result = supabase.table("agent_steps").insert({
        "trip_id": trip_id,
        "step_number": step_number,
        "thought": thought,
        "action": action,
        "action_input": action_input,
        "observation": observation
    }).execute()

    # If it was a web search, also log to search_results
    if action == "web_search":
        supabase.table("search_results").insert({
            "trip_id": trip_id,
            "step_id": result.data[0]["id"],
            "query": action_input,
            "result_summary": observation
        }).execute()

def complete_trip(trip_id: str, itinerary: str):
    """Mark trip as completed and save itinerary."""
    supabase.table("trips").update({
        "status": "completed",
        "final_itinerary": itinerary,
        "updated_at": "now()"
    }).eq("id", trip_id).execute()

def fail_trip(trip_id: str):
    supabase.table("trips").update({
        "status": "failed",
        "updated_at": "now()"
    }).eq("id", trip_id).execute()