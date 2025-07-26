# streamlit_app.py
import streamlit as st
import json
from datetime import date
from tendril_backend.streak_logic import update_streak
from tendril_backend.groq_utils import generate_affirmation

# --- Session Init ---
if "user_data" not in st.session_state:
    st.session_state.user_data = {
        "tasks": {},  # e.g., {"brushing": "2025-07-26"}
        "streak": 0,
        "paused": False,
        "last_completed_date": str(date.today())
    }

st.title("🌱 Tendril – Gentle Hygiene Tracker")

# --- Tasks Section ---
tasks = ["Brush Teeth", "Shower", "Change Clothes", "Do Dishes", "Clean Space"]
today_str = str(date.today())

for task in tasks:
    if st.checkbox(task):
        st.session_state.user_data["tasks"][task] = today_str
        st.session_state.user_data["last_completed_date"] = today_str

# --- Streak Update ---
user_data = update_streak(st.session_state.user_data)
st.write(f"🔥 Current Streak: {user_data['streak']} {'(Paused)' if user_data['paused'] else ''}")

# --- Encouragement ---
if user_data["paused"]:
    st.info("💡 You didn’t do a task yesterday — and that’s okay.")
    st.success(f"Try this encouragement: {generate_affirmation()}")
import os

def save_data():
    with open("user_data.json", "w") as f:
        json.dump(st.session_state.user_data, f, indent=2)

if st.button("💾 Save My Progress"):
    save_data()
    st.success("Progress saved!")

# Optional: Load on start
if os.path.exists("user_data.json") and st.button("📂 Load Previous Session"):
    with open("user_data.json", "r") as f:
        st.session_state.user_data = json.load(f)
    
