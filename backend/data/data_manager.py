import json
from datetime import datetime, date
from typing import Dict, List, Any
from .dummy_data import DUMMY_TASKS, DUMMY_POSTS, DUMMY_STREAK, DUMMY_TIPS

class DataManager:
    def __init__(self):
        self.tasks_file = "database/tasks.json"
        self.posts_file = "database/posts.json"
        self.comments_file = "database/comments.json"
        self.streak_file = "database/streak.json"
        self.tips_file = "database/tips.json"
        self._ensure_data_directory()
        self._initialize_data_files()
    
    def _ensure_data_directory(self):
        """Ensure the data directory exists"""
        import os
        os.makedirs("database", exist_ok=True)
    
    def _initialize_data_files(self):
        """Initialize data files with dummy data if they don't exist"""
        import os
        
        if not os.path.exists(self.tasks_file):
            self._save_tasks(DUMMY_TASKS)
        
        if not os.path.exists(self.posts_file):
            self._save_posts(DUMMY_POSTS)
        
        if not os.path.exists(self.comments_file):
            self._save_comments([])
        
        if not os.path.exists(self.streak_file):
            self._save_streak(DUMMY_STREAK)
        
        if not os.path.exists(self.tips_file):
            self._save_tips(DUMMY_TIPS)
    
    def _serialize_datetime(self, obj):
        """Custom JSON serializer for datetime objects"""
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
    
    def _deserialize_datetime(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert ISO datetime strings back to datetime objects"""
        if 'created_at' in data and data['created_at']:
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if 'due_date' in data and data['due_date']:
            data['due_date'] = date.fromisoformat(data['due_date'])
        if 'date' in data and data['date']:
            data['date'] = date.fromisoformat(data['date'])
        if 'last_completion_date' in data and data['last_completion_date']:
            data['last_completion_date'] = date.fromisoformat(data['last_completion_date'])
        return data
    
    def _save_tasks(self, tasks_data: List[Dict[str, Any]]):
        """Save tasks data to JSON file"""
        with open(self.tasks_file, 'w') as f:
            json.dump(tasks_data, f, default=self._serialize_datetime, indent=2)
    

    
    def _save_posts(self, posts_data: List[Dict[str, Any]]):
        """Save posts data to JSON file"""
        with open(self.posts_file, 'w') as f:
            json.dump(posts_data, f, default=self._serialize_datetime, indent=2)
    
    def _save_comments(self, comments_data: List[Dict[str, Any]]):
        """Save comments data to JSON file"""
        with open(self.comments_file, 'w') as f:
            json.dump(comments_data, f, default=self._serialize_datetime, indent=2)
    
    def _save_streak(self, streak_data: Dict[str, Any]):
        """Save streak data to JSON file"""
        with open(self.streak_file, 'w') as f:
            json.dump(streak_data, f, default=self._serialize_datetime, indent=2)
    
    def _save_tips(self, tips_data: List[Dict[str, Any]]):
        """Save tips data to JSON file"""
        with open(self.tips_file, 'w') as f:
            json.dump(tips_data, f, default=self._serialize_datetime, indent=2)
    
    def load_tasks(self, user_id: str) -> List[Dict[str, Any]]:
        """Load tasks for a specific user from JSON file"""
        try:
            with open(self.tasks_file, 'r') as f:
                data = json.load(f)
                return [self._deserialize_datetime(task) for task in data if task.get('user_id') == user_id]
        except FileNotFoundError:
            return []
    

    
    def load_posts(self) -> List[Dict[str, Any]]:
        """Load posts from JSON file"""
        try:
            with open(self.posts_file, 'r') as f:
                data = json.load(f)
                return [self._deserialize_datetime(post) for post in data]
        except FileNotFoundError:
            return DUMMY_POSTS
    
    def load_comments(self) -> List[Dict[str, Any]]:
        """Load comments from JSON file"""
        try:
            with open(self.comments_file, 'r') as f:
                data = json.load(f)
                return [self._deserialize_datetime(comment) for comment in data]
        except FileNotFoundError:
            return []
    
    def load_streak(self, user_id: str) -> Dict[str, Any]:
        """Load streak data for a specific user from JSON file"""
        try:
            with open(self.streak_file, 'r') as f:
                data = json.load(f)
                return self._deserialize_datetime(data.get(user_id, {}))
        except FileNotFoundError:
            return {}
    
    def load_tips(self) -> List[Dict[str, Any]]:
        """Load tips from JSON file"""
        try:
            with open(self.tips_file, 'r') as f:
                data = json.load(f)
                return [self._deserialize_datetime(tip) for tip in data]
        except FileNotFoundError:
            return DUMMY_TIPS
    
    def save_task(self, task_data: Dict[str, Any]):
        """Save a single task to the database (user-specific)"""
        user_id = task_data.get('user_id')
        tasks = []
        try:
            with open(self.tasks_file, 'r') as f:
                tasks = json.load(f)
        except FileNotFoundError:
            pass
        # Find and update existing task or add new one
        task_id = task_data.get('id')
        task_found = False
        for i, task in enumerate(tasks):
            if task.get('id') == task_id:
                tasks[i] = task_data
                task_found = True
                break
        if not task_found:
            tasks.append(task_data)
        with open(self.tasks_file, 'w') as f:
            json.dump(tasks, f, default=self._serialize_datetime, indent=2)
    
    def delete_task(self, task_id: str, user_id: str):
        """Delete a task for a specific user from the database"""
        try:
            with open(self.tasks_file, 'r') as f:
                tasks = json.load(f)
        except FileNotFoundError:
            tasks = []
        tasks = [task for task in tasks if not (task.get('id') == task_id and task.get('user_id') == user_id)]
        with open(self.tasks_file, 'w') as f:
            json.dump(tasks, f, default=self._serialize_datetime, indent=2)
    

    
    def save_post(self, post_data: Dict[str, Any]):
        """Save a single post to the database"""
        posts = self.load_posts()
        
        # Find and update existing post or add new one
        post_id = post_data.get('id')
        post_found = False
        
        for i, post in enumerate(posts):
            if post.get('id') == post_id:
                posts[i] = post_data
                post_found = True
                break
        
        if not post_found:
            posts.append(post_data)
        
        self._save_posts(posts)
    
    def save_streak(self, user_id: str, streak_data: Dict[str, Any]):
        """Save streak data for a specific user to the database"""
        try:
            with open(self.streak_file, 'r') as f:
                all_streaks = json.load(f)
        except FileNotFoundError:
            all_streaks = {}
        all_streaks[user_id] = streak_data
        with open(self.streak_file, 'w') as f:
            json.dump(all_streaks, f, default=self._serialize_datetime, indent=2)
    
    def save_tip(self, tip_data: Dict[str, Any]):
        """Save a single tip to the database"""
        tips = self.load_tips()
        
        # Find and update existing tip or add new one
        tip_id = tip_data.get('id')
        tip_found = False
        
        for i, tip in enumerate(tips):
            if tip.get('id') == tip_id:
                tips[i] = tip_data
                tip_found = True
                break
        
        if not tip_found:
            tips.append(tip_data)
        
        self._save_tips(tips)
    
    def save_comment(self, comment_data: Dict[str, Any]):
        """Save a single comment to JSON file"""
        comments = self.load_comments()
        
        # Update existing comment or add new one
        comment_id = comment_data.get('id')
        if comment_id:
            # Update existing comment
            for i, comment in enumerate(comments):
                if comment.get('id') == comment_id:
                    comments[i] = comment_data
                    break
        else:
            # Add new comment
            comments.append(comment_data)
        
        self._save_comments(comments) 