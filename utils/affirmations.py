import random

AFFIRMATIONS = [
    "You are doing your best, and that's enough.",
    "Small steps every day lead to big changes.",
    "You deserve rest and kindness.",
    "Progress, not perfection.",
    "You are loved, even on the days you don't feel it.",
    "It's okay to pause. Healing isn't linear.",
    "You are not alone in this journey.",
    "You have survived 100% of your hardest days.",
    "You are allowed to take up space and exist as you are.",
    "Your worth isn't defined by productivity."
]


def get_random_affirmation():
    return random.choice(AFFIRMATIONS)
