from datetime import date
import sys
import os
# add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.streak_manager import StreakManager

# Create a simple test data manager
class TestDataManager:
    def __init__(self):
        self.streak_data = {
            "current_streak": 0,
            "longest_streak": 0,
            "last_completion_date": None,
            "is_paused": False,
            "completion_dates": []
        }
    
    def load_streak(self):
        return self.streak_data.copy()
    
    def save_streak(self, streak_data):
        self.streak_data = streak_data.copy()
        print(f"Saved streak data: {streak_data}")

# Test the streak functionality
data_manager = TestDataManager()
streak_manager = StreakManager(data_manager)

print("=== Streak Debug Test ===")
print(f"Today: {date.today()}")

# Test 1: Complete task today
print("\n1. Complete task today")
streak_data = streak_manager.update_streak_for_completion(date.today())
print(f"Result: {streak_data}")

# Test 2: Check summary
print("\n2. Check summary")
summary = streak_manager.get_streak_summary()
print(f"Summary: {summary}")

print("\n=== Test Complete ===") 