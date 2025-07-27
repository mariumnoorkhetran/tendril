from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, date, timedelta
import uvicorn
import uuid
import time
import os
from dotenv import load_dotenv
from data.data_manager import DataManager
from data.streak_manager import StreakManager
from data.compassionate_rewriter import CompassionateRewriter

# Load environment variables from .env file in root directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

app = FastAPI(title="Tendril Wellness API", version="1.0.0")

# CORS configuration for frontend
# Get frontend URL from environment variable, fallback to localhost for development
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# Create list of allowed origins
allowed_origins = [
    "http://localhost:3000",  # Next.js dev server (local development)
    "https://localhost:3000",  # HTTPS local development
    "http://localhost:8080",  # Backend server (for direct access)
    "https://localhost:8080",  # HTTPS backend server
]

# Add production frontend URL if provided
if frontend_url and frontend_url != "http://localhost:3000":
    # Remove trailing slash for consistency
    clean_frontend_url = frontend_url.rstrip('/')
    allowed_origins.extend([
        clean_frontend_url,
        f"{clean_frontend_url}/",  # Add with trailing slash
    ])

# Add Vercel preview URLs if in development/preview mode
vercel_url = os.environ.get("VERCEL_URL")
if vercel_url:
    allowed_origins.extend([
        f"https://{vercel_url}",
        f"https://{vercel_url}/",
    ])

print(f"Allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Simple Rate Limiter for Compassionate Rewriter
class RateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}  # user_id -> list of timestamps
    
    def is_allowed(self, user_id: str) -> bool:
        """Check if user is allowed to make a request"""
        now = time.time()
        
        # Clean old requests outside the window
        if user_id in self.requests:
            self.requests[user_id] = [
                timestamp for timestamp in self.requests[user_id]
                if now - timestamp < self.window_seconds
            ]
        else:
            self.requests[user_id] = []
        
        # Check if user has exceeded the limit
        if len(self.requests[user_id]) >= self.max_requests:
            return False
        
        # Add current request
        self.requests[user_id].append(now)
        return True
    
    def get_remaining_requests(self, user_id: str) -> int:
        """Get remaining requests for a user"""
        now = time.time()
        
        if user_id in self.requests:
            # Clean old requests
            self.requests[user_id] = [
                timestamp for timestamp in self.requests[user_id]
                if now - timestamp < self.window_seconds
            ]
            return max(0, self.max_requests - len(self.requests[user_id]))
        
        return self.max_requests

# Initialize rate limiter (10 requests per minute per user)
rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

# Pydantic models
class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    completed: bool = False
    due_date: Optional[date] = None
    completion_history: Optional[Dict[str, bool]] = None  # Track completion by date



class ForumPost(BaseModel):
    id: Optional[str] = None
    title: str
    content: str
    user_id: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    created_at: Optional[datetime] = None
    comments_count: Optional[int] = 0
    reactions_count: Optional[int] = 0
    user_reacted: Optional[bool] = False

class Comment(BaseModel):
    id: Optional[str] = None
    post_id: str
    user_id: str
    content: str
    parent_id: Optional[str] = None
    created_at: Optional[datetime] = None
    replies_count: Optional[int] = 0
    reactions_count: Optional[int] = 0
    user_reacted: Optional[bool] = False

class StreakSummary(BaseModel):
    current_streak: int
    longest_streak: int
    is_paused: bool
    last_completion_date: Optional[str] = None
    days_since_last_completion: Optional[int] = None
    total_completion_days: int

class Tip(BaseModel):
    id: Optional[str] = None
    content: str
    author: str
    category: str
    likes: int = 0
    created_at: Optional[datetime] = None
    is_featured: bool = False

class PostAnalysisRequest(BaseModel):
    content: str
    user_id: Optional[str] = None

class CommentAnalysisRequest(BaseModel):
    content: str
    user_id: Optional[str] = None

# Calendar response model for date-specific tasks
class CalendarDayResponse(BaseModel):
    date: date
    tasks: List[Task]
    completed_count: int
    total_count: int
    completion_rate: float

# Initialize data manager and streak manager
data_manager = DataManager()
streak_manager = StreakManager(data_manager)
compassionate_rewriter = CompassionateRewriter()

# Initialize in-memory storage with data from files
def initialize_data():
    tasks_db = {}
    posts_db = {}
    comments_db = {}
    tips_db = {}
    
    # Load tasks from file
    tasks_data = data_manager.load_tasks()
    for task_data in tasks_data:
        task = Task(**task_data)
        tasks_db[task.id] = task
    

    
    # Load posts from file
    posts_data = data_manager.load_posts()
    for post_data in posts_data:
        post = ForumPost(**post_data)
        posts_db[post.id] = post
    
    # Load comments from file
    comments_data = data_manager.load_comments()
    for comment_data in comments_data:
        comment = Comment(**comment_data)
        comments_db[comment.id] = comment
    
    # Load tips from file
    tips_data = data_manager.load_tips()
    for tip_data in tips_data:
        tip = Tip(**tip_data)
        tips_db[tip.id] = tip
    
    return tasks_db, posts_db, comments_db, tips_db

# Initialize databases
tasks_db, posts_db, comments_db, tips_db = initialize_data()

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Tendril Wellness API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}



# Tasks endpoints
@app.get("/api/tasks", response_model=List[Task])
async def get_tasks():
    return list(tasks_db.values())



@app.post("/api/tasks", response_model=Task)
async def create_task(task: Task):
    # Validate due date - should not be in the past
    if task.due_date and task.due_date < date.today():
        raise HTTPException(
            status_code=400, 
            detail="Due date cannot be in the past. Please select today or a future date."
        )
    
    task.id = str(uuid.uuid4())
    if task.completion_history is None:
        task.completion_history = {}
    tasks_db[task.id] = task
    
    # Save to persistent storage
    task_dict = task.model_dump()
    data_manager.save_task(task_dict)
    
    return task

@app.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task: Task):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Validate due date - should not be in the past
    if task.due_date and task.due_date < date.today():
        raise HTTPException(
            status_code=400, 
            detail="Due date cannot be in the past. Please select today or a future date."
        )
    
    task.id = task_id
    
    # Preserve completion history if not provided
    if task.completion_history is None:
        task.completion_history = tasks_db[task_id].completion_history or {}
    
    tasks_db[task_id] = task
    
    # Save to persistent storage
    task_dict = task.model_dump()
    data_manager.save_task(task_dict)
    
    return task

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    del tasks_db[task_id]
    
    # Save to persistent storage
    data_manager.delete_task(task_id)
    
    return {"message": "Task deleted"}



# New calendar endpoint for date-specific tasks
@app.get("/api/calendar/{target_date}", response_model=CalendarDayResponse)
async def get_calendar_day(target_date: date):
    """Get all tasks for a specific date with completion statistics"""
    day_tasks = []
    
    for task in tasks_db.values():
        # Check if task is due on the target date
        if task.due_date == target_date:
            # Check completion status for this specific date
            date_str = target_date.isoformat()
            is_completed = False
            
            if task.completion_history and date_str in task.completion_history:
                is_completed = task.completion_history[date_str]
            else:
                # If no history for this date, use the general completed status
                is_completed = task.completed
            
            # Create a copy of the task with the correct completion status for this date
            task_copy = Task(
                id=task.id,
                title=task.title,
                description=task.description,
                completed=is_completed,
                due_date=task.due_date,
                completion_history=task.completion_history
            )
            day_tasks.append(task_copy)
    
    completed_count = sum(1 for task in day_tasks if task.completed)
    total_count = len(day_tasks)
    completion_rate = (completed_count / total_count * 100) if total_count > 0 else 0
    
    return CalendarDayResponse(
        date=target_date,
        tasks=day_tasks,
        completed_count=completed_count,
        total_count=total_count,
        completion_rate=completion_rate
    )

# Endpoint to update task completion for a specific date
@app.put("/api/tasks/{task_id}/complete/{target_date}")
async def update_task_completion(task_id: str, target_date: date, completed: bool):
    """Update the completion status of a task for a specific date"""
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = tasks_db[task_id]
    date_str = target_date.isoformat()
    
    # Initialize completion history if it doesn't exist
    if task.completion_history is None:
        task.completion_history = {}
    
    # Update completion status for the specific date
    task.completion_history[date_str] = completed
    
    # Update general completion status based on today's date
    today_str = date.today().isoformat()
    if today_str in task.completion_history:
        task.completed = task.completion_history[today_str]
    
    # Update streak if task was completed
    if completed:
        streak_manager.update_streak_for_completion(target_date)
    
    # Save to persistent storage
    task_dict = task.model_dump()
    data_manager.save_task(task_dict)
    
    return {
        "message": f"Task completion updated for {target_date}",
        "task_id": task_id,
        "date": target_date,
        "completed": completed
    }

# Streak endpoints
@app.get("/api/streak", response_model=StreakSummary)
async def get_streak():
    """Get current streak information"""
    return streak_manager.get_streak_summary()

@app.post("/api/streak/complete")
async def complete_task_for_streak(completion_date: date):
    """Manually complete a task for streak tracking (for testing purposes)"""
    updated_streak = streak_manager.update_streak_for_completion(completion_date)
    return {
        "message": f"Streak updated for completion on {completion_date}",
        "streak_data": updated_streak
    }

# Tips endpoints
@app.get("/api/tips", response_model=List[Tip])
async def get_tips():
    """Get all tips"""
    return list(tips_db.values())

@app.get("/api/tips/featured", response_model=List[Tip])
async def get_featured_tips():
    """Get featured tips"""
    featured_tips = [tip for tip in tips_db.values() if tip.is_featured]
    return featured_tips

@app.get("/api/tips/random", response_model=Tip)
async def get_random_tip():
    """Get a random tip"""
    import random
    if not tips_db:
        raise HTTPException(status_code=404, detail="No tips available")
    tip_id = random.choice(list(tips_db.keys()))
    return tips_db[tip_id]

@app.post("/api/tips", response_model=Tip)
async def create_tip(tip: Tip):
    """Create a new tip"""
    tip.id = str(uuid.uuid4())
    tip.created_at = datetime.now()
    tips_db[tip.id] = tip
    
    # Save to persistent storage
    tip_dict = tip.model_dump()
    data_manager.save_tip(tip_dict)
    
    return tip

# Forum endpoints
@app.get("/api/posts", response_model=List[ForumPost])
async def get_posts():
    return list(posts_db.values())

@app.get("/api/posts/{post_id}", response_model=ForumPost)
async def get_post(post_id: str):
    """Get a specific post by ID"""
    if post_id not in posts_db:
        raise HTTPException(status_code=404, detail="Post not found")
    return posts_db[post_id]

@app.post("/api/posts/analyze")
async def analyze_post_content(request: PostAnalysisRequest):
    """Analyze post content for negative words and suggest compassionate rewriting"""
    # Use default user ID if not provided
    user_id = request.user_id or "anonymous"
    
    # Check rate limit
    if not rate_limiter.is_allowed(user_id):
        remaining_time = rate_limiter.window_seconds
        raise HTTPException(
            status_code=429, 
            detail={
                "error": "Rate limit exceeded",
                "message": f"Too many analysis requests. Please wait {remaining_time} seconds before trying again.",
                "remaining_requests": 0,
                "window_seconds": rate_limiter.window_seconds
            }
        )
    
    # Perform analysis
    analysis = compassionate_rewriter.analyze_and_suggest_rewrite(request.content)
    
    # Add rate limit info to response
    remaining_requests = rate_limiter.get_remaining_requests(user_id)
    analysis["rate_limit"] = {
        "remaining_requests": remaining_requests,
        "max_requests": rate_limiter.max_requests,
        "window_seconds": rate_limiter.window_seconds
    }
    
    return analysis

@app.post("/api/comments/analyze")
async def analyze_comment_content(request: CommentAnalysisRequest):
    """Analyze comment content for negative words and suggest compassionate rewriting"""
    # Use default user ID if not provided
    user_id = request.user_id or "anonymous"
    
    # Check rate limit
    if not rate_limiter.is_allowed(user_id):
        remaining_time = rate_limiter.window_seconds
        raise HTTPException(
            status_code=429, 
            detail={
                "error": "Rate limit exceeded",
                "message": f"Too many analysis requests. Please wait {remaining_time} seconds before trying again.",
                "remaining_requests": 0,
                "window_seconds": rate_limiter.window_seconds
            }
        )
    
    # Perform analysis
    analysis = compassionate_rewriter.analyze_and_suggest_rewrite(request.content)
    
    # Add rate limit info to response
    remaining_requests = rate_limiter.get_remaining_requests(user_id)
    analysis["rate_limit"] = {
        "remaining_requests": remaining_requests,
        "max_requests": rate_limiter.max_requests,
        "window_seconds": rate_limiter.window_seconds
    }
    
    return analysis

@app.post("/api/posts", response_model=ForumPost)
async def create_post(post: ForumPost):
    post.id = str(uuid.uuid4())
    post.created_at = datetime.now()
    posts_db[post.id] = post
    
    # Save to persistent storage
    post_dict = post.model_dump()
    data_manager.save_post(post_dict)
    
    return post

@app.post("/api/posts/{post_id}/react")
async def react_to_post(post_id: str):
    """React to a post (toggle reaction)"""
    if post_id not in posts_db:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post = posts_db[post_id]
    
    # Toggle reaction
    if post.user_reacted:
        post.reactions_count = max(0, (post.reactions_count or 0) - 1)
        post.user_reacted = False
    else:
        post.reactions_count = (post.reactions_count or 0) + 1
        post.user_reacted = True
    
    # Save to persistent storage
    post_dict = post.model_dump()
    data_manager.save_post(post_dict)
    
    return {
        "message": "Reaction updated",
        "post_id": post_id,
        "reactions_count": post.reactions_count,
        "user_reacted": post.user_reacted
    }

# Comment endpoints
@app.get("/api/posts/{post_id}/comments", response_model=List[Comment])
async def get_comments(post_id: str):
    """Get all comments for a specific post"""
    if post_id not in posts_db:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Filter comments by post_id and organize them in a threaded structure
    post_comments = [comment for comment in comments_db.values() if comment.post_id == post_id]
    return post_comments

@app.post("/api/posts/{post_id}/comments", response_model=Comment)
async def create_comment(post_id: str, comment: Comment):
    """Create a new comment on a post"""
    if post_id not in posts_db:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Validate parent_id if provided
    if comment.parent_id and comment.parent_id not in comments_db:
        raise HTTPException(status_code=404, detail="Parent comment not found")
    
    comment.id = str(uuid.uuid4())
    comment.post_id = post_id
    comment.created_at = datetime.now()
    comments_db[comment.id] = comment
    
    # Update parent comment's replies count if this is a reply
    if comment.parent_id:
        parent_comment = comments_db[comment.parent_id]
        parent_comment.replies_count = (parent_comment.replies_count or 0) + 1
        comments_db[comment.parent_id] = parent_comment
    
    # Update post's comments count
    post = posts_db[post_id]
    post.comments_count = (post.comments_count or 0) + 1
    posts_db[post_id] = post
    
    # Save to persistent storage
    comment_dict = comment.model_dump()
    data_manager.save_comment(comment_dict)
    
    post_dict = post.model_dump()
    data_manager.save_post(post_dict)
    
    return comment

@app.post("/api/comments/{comment_id}/react")
async def react_to_comment(comment_id: str):
    """React to a comment (toggle reaction)"""
    if comment_id not in comments_db:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment = comments_db[comment_id]
    
    # Toggle reaction
    if comment.user_reacted:
        comment.reactions_count = max(0, (comment.reactions_count or 0) - 1)
        comment.user_reacted = False
    else:
        comment.reactions_count = (comment.reactions_count or 0) + 1
        comment.user_reacted = True
    
    # Save to persistent storage
    comment_dict = comment.model_dump()
    data_manager.save_comment(comment_dict)
    
    return {
        "message": "Reaction updated",
        "comment_id": comment_id,
        "reactions_count": comment.reactions_count,
        "user_reacted": comment.user_reacted
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port) 