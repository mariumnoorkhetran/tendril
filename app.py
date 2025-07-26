import streamlit as st
from utils.affirmations import get_random_affirmation


st.sidebar.markdown("### Tendril Navigation 🌱")
st.sidebar.info("You're on the Home page.")


# Home page content

top_tips = [
    "💡 Break big tasks into tiny steps.",
    "💡 Try a 2-minute timer — it helps start the task.",
    "💡 Pair hygiene tasks with music or podcasts.",
]


def show_home():

    st.markdown(
        f"""
        <div style='background-color:#f7e1d7; padding: 2rem; border-radius: 10px;'>
            <h1 style='text-align: center; color: #37505c;'>🌱 Tendril</h1>
            <p style='text-align: center; font-size: 1.2em; color: #37505c;'>Gentle hygiene reminders and community care</p>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.markdown("<br>", unsafe_allow_html=True)

    st.markdown("### 🌤️ Daily Affirmation")
    st.success(get_random_affirmation())

    # Button to refresh the affirmation
    # if st.button("🔁 New Affirmation"):
    #     st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)

    # Streak summary
    st.markdown(
        f"""
        <div style='background-color: #b0c4b1; padding: 1rem; border-radius: 10px;'>
            <h4 style='color: #37505c;'>🏆 Your Progress</h4>
            <ul style='color: #37505c; font-size: 1.05em;'>
                <li>✅ Tasks completed: <b>3/5</b></li>
                <li>🔁 Your streak is <b>paused</b>, not broken</li>
                <li>💖 Keep going — small steps count</li>
            </ul>
        </div>
        """,
        unsafe_allow_html=True
    )

    # Add spacing before button
    st.markdown(" ")

    # Link to tasks page
    st.page_link("pages/2_Tasks.py", label="Go to Tasks", icon="➡️")

    st.markdown("<br>", unsafe_allow_html=True)

    # Community tips
    st.markdown("<h4 style='color: #37505c;'>💬 Top 3 Tips from the Community</h4>",
                unsafe_allow_html=True)
    for tip in top_tips:
        st.markdown(
            f"<p style='color: #37505c;'>• {tip}</p>", unsafe_allow_html=True)

    st.markdown("<hr style='border-color: #dedbd2;'>", unsafe_allow_html=True)

    # st.markdown(
    #     "<p style='text-align: center; color: #37505c;'>Use the sidebar to check off your tasks or visit the forum 💬</p>",
    #     unsafe_allow_html=True
    # )


show_home()
