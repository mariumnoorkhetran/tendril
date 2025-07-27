from datetime import datetime, date, timedelta
import uuid

# Streak tracking data structure
DUMMY_STREAK = {
    "current_streak": 0,
    "longest_streak": 0,
    "last_completion_date": None,
    "is_paused": False,
    "completion_dates": []  # List of dates when tasks were completed
}

# Dummy Tips Data
DUMMY_TIPS = [
    {
        "id": str(uuid.uuid4()),
        "content": "Drink a glass of water first thing in the morning to kickstart your metabolism and rehydrate after sleep. Add lemon for extra benefits!",
        "author": "Dr. Sarah Wellness",
        "category": "Hydration",
        "likes": 42,
        "created_at": datetime.now() - timedelta(days=1),
        "is_featured": True
    },
    {
        "id": str(uuid.uuid4()),
        "content": "Before getting out of bed, try these gentle stretches: cat-cow pose, gentle twists, and ankle rotations. It helps wake up your body naturally.",
        "author": "Yoga Master Mike",
        "category": "Exercise",
        "likes": 38,
        "created_at": datetime.now() - timedelta(days=2),
        "is_featured": True
    },
    {
        "id": str(uuid.uuid4()),
        "content": "Take time to chew your food slowly and savor each bite. This not only improves digestion but also helps you feel more satisfied with smaller portions.",
        "author": "Nutrition Expert Lisa",
        "category": "Nutrition",
        "likes": 35,
        "created_at": datetime.now() - timedelta(days=3),
        "is_featured": False
    },
    {
        "id": str(uuid.uuid4()),
        "content": "Avoid screens 30 minutes before bedtime. The blue light can interfere with your sleep cycle. Try reading a book instead!",
        "author": "Sleep Coach David",
        "category": "Sleep",
        "likes": 29,
        "created_at": datetime.now() - timedelta(days=4),
        "is_featured": False
    },
    {
        "id": str(uuid.uuid4()),
        "content": "Write down 3 things you're grateful for each day. This simple practice can significantly improve your mental well-being and outlook on life.",
        "author": "Mental Health Advocate Emma",
        "category": "Mental Health",
        "likes": 31,
        "created_at": datetime.now() - timedelta(days=5),
        "is_featured": True
    },
    {
        "id": str(uuid.uuid4()),
        "content": "Instead of sitting in a conference room, try walking meetings. You'll get exercise, fresh air, and often more creative ideas flow when moving.",
        "author": "Productivity Guru Alex",
        "category": "Work-Life Balance",
        "likes": 27,
        "created_at": datetime.now() - timedelta(days=6),
        "is_featured": False
    }
]

# Dummy Tasks Data
DUMMY_TASKS = [
    {
        "id": str(uuid.uuid4()),
        "title": "Morning Meditation",
        "description": "Start the day with 10 minutes of mindfulness meditation",
        "completed": False,
        "due_date": date.today(),
        "completion_history": {
            date.today().isoformat(): False
        }
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Drink 8 Glasses of Water",
        "description": "Stay hydrated throughout the day",
        "completed": True,
        "due_date": date.today(),
        "completion_history": {
            date.today().isoformat(): True
        }
    },
    {
        "id": str(uuid.uuid4()),
        "title": "30-Minute Walk",
        "description": "Take a brisk walk in the park or around the neighborhood",
        "completed": False,
        "due_date": date.today() + timedelta(days=1),
        "completion_history": {
            (date.today() + timedelta(days=1)).isoformat(): False
        }
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Read for 20 Minutes",
        "description": "Read a chapter from your current book",
        "completed": False,
        "due_date": date.today() + timedelta(days=2),
        "completion_history": {
            (date.today() + timedelta(days=2)).isoformat(): False
        }
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Call Family Member",
        "description": "Check in with a family member or close friend",
        "completed": False,
        "due_date": date.today() + timedelta(days=3),
        "completion_history": {
            (date.today() + timedelta(days=3)).isoformat(): False
        }
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Prepare Healthy Lunch",
        "description": "Make a nutritious lunch instead of eating out",
        "completed": True,
        "due_date": date.today(),
        "completion_history": {
            date.today().isoformat(): True
        }
    }
]



# Dummy Forum Posts Data
DUMMY_POSTS = [
    {
        "id": str(uuid.uuid4()),
        "title": "Tips for Better Sleep",
        "content": "I've been struggling with sleep lately and found that establishing a consistent bedtime routine really helps. I start winding down an hour before bed - no screens, just reading or meditation. Anyone else have good sleep tips to share?",
        "user_id": "user_123",
        "created_at": datetime.now() - timedelta(days=2),
        "comments_count": 8,
        "reactions_count": 24,
        "user_reacted": False
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Morning Workout Motivation",
        "content": "I've been trying to establish a morning workout routine but finding it hard to get out of bed early. What motivates you to get up and exercise in the morning? Looking for some inspiration!",
        "user_id": "user_456",
        "created_at": datetime.now() - timedelta(days=1),
        "comments_count": 12,
        "reactions_count": 31,
        "user_reacted": True
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Healthy Recipe Exchange",
        "content": "I'm looking for quick, healthy dinner recipes that can be prepared in under 30 minutes. I'm a busy parent and need something nutritious but fast. Any favorites you'd recommend?",
        "user_id": "user_123",
        "created_at": datetime.now() - timedelta(hours=6),
        "comments_count": 15,
        "reactions_count": 18,
        "user_reacted": False
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Stress Management Techniques",
        "content": "Work has been really stressful lately and I'm looking for effective ways to manage stress. I've tried deep breathing exercises, but I'm curious about other techniques. What works best for you?",
        "created_at": datetime.now() - timedelta(hours=3),
        "comments_count": 6,
        "reactions_count": 12,
        "user_reacted": False
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Building Healthy Habits",
        "content": "I'm on day 15 of my journey to build healthier habits. So far, I've been consistent with daily walks and drinking more water. The key for me has been starting small and being patient. Anyone else on a similar journey?",
        "user_id": "user_789",
        "created_at": datetime.now() - timedelta(hours=1),
        "comments_count": 3,
        "reactions_count": 7,
        "user_reacted": False
    }
] 