import streamlit as st
from datetime import date

st.sidebar.markdown("### Tendril Navigation 🌱")
st.sidebar.info("You're on the Calendar page.")

# todo: Connect this with actual task data from backend


def show_calendar():
    st.markdown("## 📅 Your Self-Care Calendar")

    st.write("Select a day to see your tasks and reminders:")

    selected_date = st.date_input(
        "Pick a date", value=date.today(), key="calendar_date_input")

    # Format date as a string for use in checkbox keys
    date_key = selected_date.strftime("%Y-%m-%d")

    # Placeholder tasks for selected date
    st.markdown(f"### Tasks for {selected_date.strftime('%A, %B %d, %Y')}")

    tasks = [
        "Brush Teeth",
        "Take a Shower",
        "Do Laundry",
        "Clean Desk",
        "Wash Dishes"
    ]

    for i, task in enumerate(tasks):
        st.checkbox(task, key=f"{date_key}_{i}")
    # todo: Load and save actual task completion state from backend

    st.markdown("---")
    st.info("✅ Keep up the good work! Every small win counts 💖")


show_calendar()
