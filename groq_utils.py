import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(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)

def generate_affirmation():
    prompt = "Generate a short, kind affirmation (1 sentence max) for someone struggling with basic hygiene."
    chat_completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a helpful assistant who offers kind, compassionate affirmations."},
            {"role": "user", "content": prompt}
        ]
    )
    return chat_completion.choices[0].message.content.strip()
def rewrite_compassionate(text):
    prompt = f"Rewrite this to sound more compassionate and self-kind:\n\n{text}"
    chat_completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You rewrite text to sound kind and supportive."},
            {"role": "user", "content": prompt}
        ]
    )
    return chat_completion.choices[0].message.content.strip()
    
