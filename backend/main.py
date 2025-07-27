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
    user_id: str



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

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Tendril Wellness API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}



# Tasks endpoints
@app.get("/api/tasks", response_model=List[Task])
async def get_tasks(user_id: str):
    return data_manager.load_tasks(user_id)



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
    data_manager.save_task(task.model_dump())
    
    return task

@app.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task: Task):
    if not any(t["id"] == task_id for t in data_manager.load_tasks(task.user_id)):
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
        task.completion_history = data_manager.load_tasks(task.user_id)[0].completion_history or {}
    
    data_manager.save_task(task.model_dump())
    
    return task

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, user_id: str):
    if not any(t["id"] == task_id for t in data_manager.load_tasks(user_id)):
        raise HTTPException(status_code=404, detail="Task not found")
    data_manager.delete_task(task_id, user_id)
    
    return {"message": "Task deleted"}



# New calendar endpoint for date-specific tasks
@app.get("/api/calendar/{target_date}", response_model=CalendarDayResponse)
async def get_calendar_day(target_date: date, user_id: str):
    """Get all tasks for a specific date with completion statistics"""
    day_tasks = []
    
    for task_dict in data_manager.load_tasks(user_id):
        task = Task(**task_dict)
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
                completion_history=task.completion_history,
                user_id=task.user_id
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
async def update_task_completion(task_id: str, target_date: date, completed: bool, user_id: str):
    """Update the completion status of a task for a specific date"""
    tasks = data_manager.load_tasks(user_id)
    task = next((t for t in tasks if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    date_str = target_date.isoformat()
    
    # Initialize completion history if it doesn't exist
    if task["completion_history"] is None:
        task["completion_history"] = {}
    
    # Update completion status for the specific date
    task["completion_history"][date_str] = completed
    
    # Update general completion status based on today's date
    today_str = date.today().isoformat()
    if today_str in task["completion_history"]:
        task["completed"] = task["completion_history"][today_str]
    
    # Update streak if task was completed
    if completed:
        streak_manager.update_streak_for_completion(user_id, target_date)
    
    # Save to persistent storage
    data_manager.save_task(task)
    
    return {
        "message": f"Task completion updated for {target_date}",
        "task_id": task_id,
        "date": target_date,
        "completed": completed
    }

# Streak endpoints
@app.get("/api/streak", response_model=StreakSummary)
async def get_streak(user_id: str):
    """Get current streak information"""
    return streak_manager.get_streak_summary(user_id)

@app.post("/api/streak/complete")
async def complete_task_for_streak(completion_date: date, user_id: str):
    """Manually complete a task for streak tracking (for testing purposes)"""
    updated_streak = streak_manager.update_streak_for_completion(user_id, completion_date)
    return {
        "message": f"Streak updated for completion on {completion_date}",
        "streak_data": updated_streak
    }

# Tips endpoints
@app.get("/api/tips", response_model=List[Tip])
async def get_tips():
    """Get all tips"""
    return list(data_manager.load_tips())

@app.get("/api/tips/featured", response_model=List[Tip])
async def get_featured_tips():
    """Get featured tips"""
    tips = data_manager.load_tips()
    featured_tips = [tip for tip in tips if tip.is_featured]
    return featured_tips

@app.get("/api/tips/random", response_model=Tip)
async def get_random_tip():
    """Get a random tip"""
    import random
    tips = data_manager.load_tips()
    if not tips:
        raise HTTPException(status_code=404, detail="No tips available")
    return random.choice(tips)

@app.post("/api/tips", response_model=Tip)
async def create_tip(tip: Tip):
    """Create a new tip, using Groq API for compassionate rewriting if needed"""
    tip.id = str(uuid.uuid4())
    tip.created_at = datetime.now()
    # Analyze tip content for negative words and suggest compassionate rewriting
    analysis = compassionate_rewriter.analyze_and_suggest_rewrite(tip.content)
    if analysis.get('contains_negative_words') and analysis.get('suggestion_available') and analysis.get('rewritten_text'):
        tip.content = analysis['rewritten_text']
    data_manager.save_tip(tip.model_dump())
    return tip

# Forum endpoints
@app.get("/api/posts", response_model=List[ForumPost])
async def get_posts(user_id: Optional[str] = None):
    posts = data_manager.load_posts()
    if user_id:
        return [post for post in posts if post.get("user_id") == user_id]
    return posts

@app.get("/api/posts/{post_id}", response_model=ForumPost)
async def get_post(post_id: str):
    """Get a specific post by ID"""
    posts = data_manager.load_posts()
    post = next((p for p in posts if p.get('id') == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

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
    data_manager.save_post(post.model_dump())
    
    return post

@app.post("/api/posts/{post_id}/react")
async def react_to_post(post_id: str):
    """React to a post (toggle reaction)"""
    posts = data_manager.load_posts()
    post = next((p for p in posts if p.get('id') == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Toggle reaction
    if post.get('user_reacted'):
        post['reactions_count'] = max(0, (post.get('reactions_count') or 0) - 1)
        post['user_reacted'] = False
    else:
        post['reactions_count'] = (post.get('reactions_count') or 0) + 1
        post['user_reacted'] = True
    
    # Save to persistent storage
    data_manager.save_post(post)
    
    return {
        "message": "Reaction updated",
        "post_id": post_id,
        "reactions_count": post['reactions_count'],
        "user_reacted": post['user_reacted']
    }

# Comment endpoints
@app.get("/api/posts/{post_id}/comments", response_model=List[Comment])
async def get_comments(post_id: str):
    """Get all comments for a specific post"""
    posts = data_manager.load_posts()
    if not any(post.get("id") == post_id for post in posts):
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Filter comments by post_id and organize them in a threaded structure
    post_comments = [comment for comment in data_manager.load_comments() if comment.get("post_id") == post_id]
    return post_comments

@app.post("/api/posts/{post_id}/comments", response_model=Comment)
async def create_comment(post_id: str, comment: Comment):
    """Create a new comment on a post"""
    print(f"Creating comment for post: {post_id}")
    print(f"Comment data: {comment.model_dump()}")
    
    posts = data_manager.load_posts()
    if not any(post.get("id") == post_id for post in posts):
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Validate parent_id if provided
    if comment.parent_id:
        comments = data_manager.load_comments()
        if not any(c.get("id") == comment.parent_id for c in comments):
            raise HTTPException(status_code=404, detail="Parent comment not found")
    
    # Prepare comment data
    comment.id = str(uuid.uuid4())
    comment.post_id = post_id
    comment.created_at = datetime.now()
    
    # Convert to dict and ensure all fields are present
    comment_dict = comment.model_dump()
    comment_dict.update({
        "id": comment.id,
        "post_id": comment.post_id,
        "created_at": comment.created_at,
        "replies_count": comment.replies_count or 0,
        "reactions_count": comment.reactions_count or 0,
        "user_reacted": comment.user_reacted or False
    })
    
    print(f"Saving comment: {comment_dict}")
    
    # Save the comment
    data_manager.save_comment(comment_dict)
    
    # Verify the comment was saved
    all_comments = data_manager.load_comments()
    saved_comment = next((c for c in all_comments if c.get("id") == comment.id), None)
    print(f"Comment saved successfully: {saved_comment is not None}")
    
    # Update parent comment's replies count if this is a reply
    if comment.parent_id:
        comments = data_manager.load_comments()
        parent_comment = next((c for c in comments if c.get("id") == comment.parent_id), None)
        if parent_comment:
            parent_comment["replies_count"] = (parent_comment.get("replies_count") or 0) + 1
            data_manager.save_comment(parent_comment)

    # Update post's comments count
    posts = data_manager.load_posts()
    post = next((p for p in posts if p.get("id") == post_id), None)
    if post:
        post["comments_count"] = (post.get("comments_count") or 0) + 1
        data_manager.save_post(post)
    
    return comment

@app.post("/api/comments/{comment_id}/react")
async def react_to_comment(comment_id: str):
    """React to a comment (toggle reaction)"""
    comments = data_manager.load_comments()
    comment = next((c for c in comments if c.get("id") == comment_id), None)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Toggle reaction
    if comment.get("user_reacted"):
        comment["reactions_count"] = max(0, (comment.get("reactions_count") or 0) - 1)
        comment["user_reacted"] = False
    else:
        comment["reactions_count"] = (comment.get("reactions_count") or 0) + 1
        comment["user_reacted"] = True
    
    # Save to persistent storage
    data_manager.save_comment(comment)
    
    return {
        "message": "Reaction updated",
        "comment_id": comment_id,
        "reactions_count": comment["reactions_count"],
        "user_reacted": comment["user_reacted"]
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port) 