import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
from data.streak_manager import StreakManager
import tempfile
import shutil

def test_basic_streak():
    """Test basic streak functionality"""
    
    # Create a test data manager
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
    
    # Initialize streak manager
    data_manager = TestDataManager()
    streak_manager = StreakManager(data_manager)
    
    # Test scenario: day1, some task done, streak=1
    print("Test: Day 1 - Complete task")
    day1 = date.today()
    streak_data = streak_manager.update_streak_for_completion(day1)
    print(f"Day 1: streak={streak_data['current_streak']}, paused={streak_data['is_paused']}")
    assert streak_data['current_streak'] == 1
    assert not streak_data['is_paused']
    
    # Test scenario: day2, no tasks done, streak=1, paused
    print("\nTest: Day 2 - No tasks done (streak should be paused)")
    # Simulate that no tasks were completed on day2
    # The streak should remain at 1 but be paused
    summary = streak_manager.get_streak_summary()
    print(f"Day 2: streak={summary['current_streak']}, paused={summary['is_paused']}")
    print(f"Debug: last_completion_date={summary['last_completion_date']}")
    print(f"Debug: today={date.today()}")
    assert summary['current_streak'] == 1
    assert summary['is_paused']  # Should be paused since last completion was not today
    
    # Test scenario: day3, some tasks done, streak=2
    print("\nTest: Day 3 - Complete task (streak should resume)")
    day3 = date.today() + timedelta(days=2)  # 2 days from today
    streak_data = streak_manager.update_streak_for_completion(day3)
    print(f"Day 3: streak={streak_data['current_streak']}, paused={streak_data['is_paused']}")
    assert streak_data['current_streak'] == 2  # Should be 2 consecutive days
    assert streak_data['is_paused']  # Should be paused since last completion is not today
    
    print("\n🎉 Basic streak test passed!")

if __name__ == "__main__":
    test_basic_streak() 