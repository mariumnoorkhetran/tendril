from datetime import date, timedelta
from typing import Dict, Any, List

class StreakManager:
    def __init__(self, data_manager):
        self.data_manager = data_manager
    
    def get_streak_data(self) -> Dict[str, Any]:
        """Get current streak data"""
        return self.data_manager.load_streak()
    
    def update_streak_for_completion(self, completion_date: date) -> Dict[str, Any]:
        """
        Update streak when a task is completed on a given date
        Returns updated streak data
        """
        streak_data = self.get_streak_data()
        
        # Convert completion_date to string for comparison
        completion_date_str = completion_date.isoformat()
        
        # If this date is already in completion_dates, no need to update
        if completion_date_str in streak_data.get('completion_dates', []):
            return streak_data
        
        # Add completion date to the list
        completion_dates = streak_data.get('completion_dates', [])
        completion_dates.append(completion_date_str)
        streak_data['completion_dates'] = completion_dates
        
        # Update last completion date
        streak_data['last_completion_date'] = completion_date
        
        # Calculate new streak
        self._calculate_streak(streak_data)
        
        # Save updated streak data
        self.data_manager.save_streak(streak_data)
        
        return streak_data
    
    def _calculate_streak(self, streak_data: Dict[str, Any]):
        """
        Calculate current streak based on completion dates
        Streak logic:
        - If no completion dates, streak is 0
        - If last completion was today, check consecutive days backwards
        - If last completion was not today, streak is paused (not reset to 0)
        """
        completion_dates = streak_data.get('completion_dates', [])
        
        if not completion_dates:
            streak_data['current_streak'] = 0
            streak_data['is_paused'] = False
            return
        
        # Sort completion dates
        completion_dates.sort()
        
        # Get the most recent completion date
        last_completion_str = completion_dates[-1]
        last_completion_date = date.fromisoformat(last_completion_str)
        today = date.today()
        
        # Calculate the current streak based on the most recent completion
        current_streak = self._calculate_consecutive_days(completion_dates, last_completion_date)
        streak_data['current_streak'] = current_streak
        
        # If last completion was today, streak is active
        if last_completion_date == today:
            streak_data['is_paused'] = False
        else:
            # Streak is paused (not reset to 0)
            streak_data['is_paused'] = True
        
        # Update longest streak if current streak is longer
        longest_streak = streak_data.get('longest_streak', 0)
        if current_streak > longest_streak:
            streak_data['longest_streak'] = current_streak
    
    def _calculate_consecutive_days(self, completion_dates: List[str], end_date: date) -> int:
        """
        Calculate consecutive days of completion ending on end_date
        """
        if not completion_dates:
            return 0
        
        # Convert completion dates to date objects and sort
        dates = [date.fromisoformat(d) for d in completion_dates]
        dates.sort()
        
        # Find the last occurrence of end_date or earlier
        last_date = None
        for d in reversed(dates):
            if d <= end_date:
                last_date = d
                break
        
        if not last_date:
            return 0
        
        # Count consecutive days backwards from last_date
        consecutive_count = 0
        current_date = last_date
        
        # Check if we have consecutive days backwards
        while current_date in dates:
            consecutive_count += 1
            current_date -= timedelta(days=1)
        
        return consecutive_count
    
    def get_streak_summary(self) -> Dict[str, Any]:
        """
        Get a summary of streak information
        """
        streak_data = self.get_streak_data()
        
        # Calculate days since last completion
        last_completion_date = streak_data.get('last_completion_date')
        days_since_last = None
        
        if last_completion_date:
            today = date.today()
            days_since_last = (today - last_completion_date).days
        
        return {
            'current_streak': streak_data.get('current_streak', 0),
            'longest_streak': streak_data.get('longest_streak', 0),
            'is_paused': streak_data.get('is_paused', False),
            'last_completion_date': last_completion_date.isoformat() if last_completion_date else None,
            'days_since_last_completion': days_since_last,
            'total_completion_days': len(streak_data.get('completion_dates', []))
        } 