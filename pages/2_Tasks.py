import streamlit as st
import random
import json
import os
from datetime import date
import streamlit as st

st.sidebar.markdown("### Tendril Navigation 🌱")
st.sidebar.info("You're on the Tasks page.")

DATA_DIR = "data"
TASK_FILE = os.path.join(DATA_DIR, "tasks.json")

# Make sure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Dummy affirmations
affirmations = [
    "Great job taking care of yourself! 🌟",
    "Every small step counts 💖",
    "You're building a gentle habit 💫",
    "You deserve a clean space and kind words 🌸"
]


# ---------------------- Task Helpers ----------------------

def load_tasks():
    if os.path.exists(TASK_FILE):
        with open(TASK_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return [
        {"text": "Brush Teeth", "completed": False},
        {"text": "Take a Shower", "completed": False},
        {"text": "Do Laundry", "completed": False},
        {"text": "Change Bed Sheets", "completed": False},
        {"text": "Clean Your Room", "completed": False}
    ]


def save_tasks(tasks):
    with open(TASK_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2)


# ---------------------- Main Page ----------------------

def show_tasks():
    st.markdown(
        f"""
        <div style='background-color:#f7e1d7; padding: 1rem; border-radius: 10px;'>
            <h2 style='text-align: center; color: #37505c;'>🧼 Today's Tasks</h2>
            <p style='text-align: center; color: #37505c;'>Check off your self-care tasks as you go 💚</p>
        </div>
        """,
        unsafe_allow_html=True
    )
    st.markdown("<br>", unsafe_allow_html=True)

    task_list = load_tasks()

    incomplete_tasks = [t for t in task_list if not t["completed"]]
    completed_tasks = [t for t in task_list if t["completed"]]

    st.markdown("### 📝 Hygiene Checklist")

    # Track completion changes
    changed = False
    for i, task in enumerate(incomplete_tasks):
        if st.checkbox(task["text"], key=f"task_{i}"):
            task_index = task_list.index(task)
            task_list[task_index]["completed"] = True
            changed = True

    if changed:
        save_tasks(task_list)
        st.rerun()

    # Show affirmation after rerun when a task is marked completed
    if completed_tasks:
        st.success("✅ You've completed: " +
                   ", ".join([t["text"] for t in completed_tasks]))
        st.markdown(
            f"""
            <div style='background-color: #edafb8; padding: 1rem; border-radius: 10px; margin-top: 1rem;'>
                <p style='color: #37505c; font-size: 1.1em;'>{random.choice(affirmations)}</p>
            </div>
            """,
            unsafe_allow_html=True
        )

    if completed_tasks:
        st.markdown("### ✅ Completed Tasks")
        for task in completed_tasks:
            st.markdown(f"- ~~{task['text']}~~")

    st.markdown("---")

    # Add new task
    st.markdown("### ➕ Add a New Task")
    if "new_task_input" not in st.session_state:
        st.session_state.new_task_input = ""

    with st.form("add_task_form"):
        new_task = st.text_input(
            "Enter new task", value=st.session_state.new_task_input, key="add_input")
        submitted = st.form_submit_button("Add Task")
        if submitted and new_task.strip():
            task_list.append({"text": new_task.strip(), "completed": False})
            save_tasks(task_list)
            st.success("Task added!")
            st.session_state.new_task_input = ""
            st.rerun()

    # Manage Tasks (edit/delete)
    st.markdown("### ⚙️ Manage Tasks")
    editable_tasks = [t for t in task_list if not t["completed"]]

    task_labels = [t["text"] for t in editable_tasks]

    # --- Delete ---
    task_to_delete = st.selectbox(
        "🗑️ Delete a task", ["(None)"] + task_labels, key="delete_task_select")
    if task_to_delete != "(None)":
        if st.button("Delete Task"):
            task_list = [t for t in task_list if t["text"] != task_to_delete]
            save_tasks(task_list)
            st.success(f"Deleted '{task_to_delete}'")
            st.rerun()

    # --- Edit ---
    task_to_edit = st.selectbox(
        "✏️ Edit a task", ["(None)"] + task_labels, key="edit_task_select")
    if task_to_edit != "(None)":
        with st.form("edit_task_form"):
            new_text = st.text_input(
                "New text", value=task_to_edit, key="edit_text_input")
            edited = st.form_submit_button("Update Task")
            if edited and new_text.strip():
                for t in task_list:
                    if t["text"] == task_to_edit and not t["completed"]:
                        t["text"] = new_text.strip()
                        break
                save_tasks(task_list)
                st.success(f"Updated task to '{new_text.strip()}'")
                st.rerun()


show_tasks()
