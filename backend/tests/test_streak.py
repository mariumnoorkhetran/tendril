import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
from data.streak_manager import StreakManager
from data.data_manager import DataManager
import tempfile
import shutil

def test_streak_functionality():
    """Test the streak functionality"""
    
    # Create a temporary directory for testing
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Create a test data manager with temporary files
        class TestDataManager:
            def __init__(self):
                self.streak_file = os.path.join(temp_dir, "streak.json")
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
        
        # Test 1: Initial state
        print("Test 1: Initial state")
        streak_data = streak_manager.get_streak_data()
        assert streak_data['current_streak'] == 0
        assert streak_data['is_paused'] == False
        print("✓ Initial state correct")
        
        # Test 2: First completion (today)
        print("\nTest 2: First completion (today)")
        today = date.today()
        updated_streak = streak_manager.update_streak_for_completion(today)
        assert updated_streak['current_streak'] == 1
        assert updated_streak['is_paused'] == False
        assert today.isoformat() in updated_streak['completion_dates']
        print("✓ First completion works")
        
        # Test 3: Second consecutive day
        print("\nTest 3: Second consecutive day")
        yesterday = today - timedelta(days=1)
        updated_streak = streak_manager.update_streak_for_completion(yesterday)
        print(f"Debug: current_streak={updated_streak['current_streak']}, is_paused={updated_streak['is_paused']}")
        print(f"Debug: completion_dates={updated_streak['completion_dates']}")
        assert updated_streak['current_streak'] == 2
        assert updated_streak['is_paused'] == True  # Should be paused since last completion is not today
        assert yesterday.isoformat() in updated_streak['completion_dates']
        print("✓ Second consecutive day works (paused)")
        
        # Test 4: Complete today again (should resume streak)
        print("\nTest 4: Complete today again (should resume streak)")
        updated_streak = streak_manager.update_streak_for_completion(today)
        assert updated_streak['current_streak'] == 2
        assert updated_streak['is_paused'] == False  # Should be active since last completion is today
        print("✓ Streak resumed correctly")
        
        # Test 5: Skip a day (streak should be paused, not reset)
        print("\nTest 5: Skip a day (streak should be paused)")
        day_before_yesterday = yesterday - timedelta(days=1)
        updated_streak = streak_manager.update_streak_for_completion(day_before_yesterday)
        assert updated_streak['current_streak'] == 3  # Should be 3 consecutive days
        assert updated_streak['is_paused'] == True  # Should be paused since last completion is not today
        assert day_before_yesterday.isoformat() in updated_streak['completion_dates']
        print("✓ Streak paused correctly (not reset)")
        
        # Test 6: Streak summary
        print("\nTest 6: Streak summary")
        summary = streak_manager.get_streak_summary()
        assert summary['current_streak'] == 3
        assert summary['longest_streak'] == 3
        assert summary['is_paused'] == True  # Should be paused since last completion is not today
        assert summary['total_completion_days'] == 3
        print("✓ Streak summary correct")
        
        print("\n🎉 All streak tests passed!")
        
    finally:
        # Clean up temporary directory
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    test_streak_functionality() 