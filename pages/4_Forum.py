import streamlit as st
import json
import os
from datetime import datetime

st.sidebar.markdown("### Tendril Navigation 🌱")
st.sidebar.info("You're on the Forum page.")

DATA_FILE = "forum_data.json"


def load_messages():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    else:
        return [
            {"timestamp": "2025-07-25 10:00",
                "message": "Today I got out of bed. That is a win ", "stars": 2},
            {"timestamp": "2025-07-25 14:23",
                "message": "Showered after 3 days... feeling human again ", "stars": 1},
            {"timestamp": "2025-07-25 17:45",
                "message": "Skipped brushing, but still proud I made tea ", "stars": 0}
        ]


def save_messages(messages):
    with open(DATA_FILE, "w") as f:
        json.dump(messages, f, indent=2)


def show_forum():
    st.markdown("## 💬 Anonymous Forum")
    st.markdown("_Share anything anonymously. This is a safe space._")

    messages = load_messages()

    with st.form("post_form", clear_on_submit=True):
        new_message = st.text_area("Write your message here:")
        submitted = st.form_submit_button("Post")

        if submitted:
            if new_message.strip() == "":
                st.warning("Please enter a message before posting.")
            else:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
                messages.insert(
                    0, {"timestamp": timestamp, "message": new_message.strip(), "stars": 0})
                save_messages(messages)
                st.success("Your message has been posted.")
                st.rerun()

    st.markdown("---")
    st.subheader("Recent Messages")

    if not messages:
        st.info("No messages yet. Be the first to post!")
    else:
        for idx, msg in enumerate(messages):
            st.markdown(f"🕒 *{msg['timestamp']}*  \n💬 {msg['message']}")
            cols = st.columns([0.1, 0.9])
            if cols[0].button("⭐", key=f"star_btn_{idx}"):
                messages[idx]["stars"] += 1
                save_messages(messages)
                st.rerun()
            cols[1].markdown(f"{msg['stars']} stars")
            st.markdown("---")


show_forum()
