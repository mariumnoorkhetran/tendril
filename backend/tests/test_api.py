import requests
import json
import time
from datetime import date, timedelta

BASE_URL = "http://localhost:8080"

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_tasks_api():
    """Test the tasks API endpoints"""
    try:
        print("\n--- Testing Tasks API ---")
        
        # Get initial tasks
        response = requests.get(f"{BASE_URL}/api/tasks")
        initial_count = len(response.json())
        print(f"Initial tasks count: {initial_count}")
        
        # Create a task
        task_data = {
            "title": "Test Task",
            "description": "This is a test task",
            "completed": False
        }
        
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data)
        print(f"Create task: {response.status_code}")
        
        if response.status_code == 200:
            task = response.json()
            task_id = task['id']
            print(f"Created task with ID: {task_id}")
            
            # Get all tasks
            response = requests.get(f"{BASE_URL}/api/tasks")
            tasks = response.json()
            print(f"Get tasks: {response.status_code} - {len(tasks)} tasks")
            
            # Update the task
            update_data = {
                "title": "Updated Test Task",
                "description": "This is an updated test task",
                "completed": True
            }
            
            response = requests.put(f"{BASE_URL}/api/tasks/{task_id}", json=update_data)
            print(f"Update task: {response.status_code}")
            
            if response.status_code == 200:
                updated_task = response.json()
                print(f"Updated task: {updated_task['title']} - Completed: {updated_task['completed']}")
            
            # Delete the task
            response = requests.delete(f"{BASE_URL}/api/tasks/{task_id}")
            print(f"Delete task: {response.status_code}")
            
            # Verify deletion
            response = requests.get(f"{BASE_URL}/api/tasks")
            final_count = len(response.json())
            print(f"Final tasks count: {final_count}")
            
            return True
        else:
            print(f"Failed to create task: {response.text}")
            return False
            
    except Exception as e:
        print(f"Tasks API test failed: {e}")
        return False



def test_posts_api():
    """Test the posts API endpoints"""
    try:
        print("\n--- Testing Posts API ---")
        
        # Get initial posts
        response = requests.get(f"{BASE_URL}/api/posts")
        initial_count = len(response.json())
        print(f"Initial posts count: {initial_count}")
        
        # Create a post
        post_data = {
            "title": "Test Post",
            "content": "This is a test forum post content.",
            "author": "Test User"
        }
        
        response = requests.post(f"{BASE_URL}/api/posts", json=post_data)
        print(f"Create post: {response.status_code}")
        
        if response.status_code == 200:
            post = response.json()
            post_id = post['id']
            print(f"Created post with ID: {post_id}")
            
            # Get all posts
            response = requests.get(f"{BASE_URL}/api/posts")
            posts = response.json()
            print(f"Get posts: {response.status_code} - {len(posts)} posts")
            
            return True
        else:
            print(f"Failed to create post: {response.text}")
            return False
            
    except Exception as e:
        print(f"Posts API test failed: {e}")
        return False

def test_calendar_api():
    """Test the calendar API endpoints"""
    try:
        print("\n--- Testing Calendar API ---")
        
        # Get today's date
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        # Test calendar endpoint for today
        response = requests.get(f"{BASE_URL}/api/calendar/{today}")
        print(f"Get calendar for today ({today}): {response.status_code}")
        
        if response.status_code == 200:
            calendar_data = response.json()
            print(f"Today's tasks: {calendar_data['total_count']} total, {calendar_data['completed_count']} completed")
            print(f"Completion rate: {calendar_data['completion_rate']:.1f}%")
            
            # Test calendar endpoint for tomorrow
            response = requests.get(f"{BASE_URL}/api/calendar/{tomorrow}")
            print(f"Get calendar for tomorrow ({tomorrow}): {response.status_code}")
            
            if response.status_code == 200:
                calendar_data = response.json()
                print(f"Tomorrow's tasks: {calendar_data['total_count']} total, {calendar_data['completed_count']} completed")
            
            return True
        else:
            print(f"Failed to get calendar data: {response.text}")
            return False
            
    except Exception as e:
        print(f"Calendar API test failed: {e}")
        return False

def test_task_completion_tracking():
    """Test task completion tracking for specific dates"""
    try:
        print("\n--- Testing Task Completion Tracking ---")
        
        today = date.today()
        
        # Create a task for today
        task_data = {
            "title": "Test Completion Task",
            "description": "This task will test completion tracking",
            "completed": False,
            "due_date": today.isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data)
        if response.status_code == 200:
            task = response.json()
            task_id = task['id']
            print(f"Created task with ID: {task_id}")
            
            # Update completion status for today
            response = requests.put(f"{BASE_URL}/api/tasks/{task_id}/complete/{today}?completed=true")
            print(f"Mark task as completed for {today}: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Completion update result: {result['message']}")
                
                # Verify the completion status in calendar
                response = requests.get(f"{BASE_URL}/api/calendar/{today}")
                if response.status_code == 200:
                    calendar_data = response.json()
                    print(f"Calendar shows {calendar_data['completed_count']} completed tasks")
                
                return True
            else:
                print(f"Failed to update completion: {response.text}")
                return False
        else:
            print(f"Failed to create task: {response.text}")
            return False
            
    except Exception as e:
        print(f"Task completion tracking test failed: {e}")
        return False

def test_persistence():
    """Test that data persists across server restarts"""
    try:
        print("\n--- Testing Data Persistence ---")
        
        # Create a persistent task
        task_data = {
            "title": "Persistence Test Task",
            "description": "This task should persist after server restart",
            "completed": False
        }
        
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data)
        if response.status_code == 200:
            task = response.json()
            task_id = task['id']
            print(f"Created persistent task with ID: {task_id}")
            
            # Get current tasks
            response = requests.get(f"{BASE_URL}/api/tasks")
            tasks = response.json()
            print(f"Current tasks count: {len(tasks)}")
            
            print("✅ Persistence test completed. Restart the server to verify data persists.")
            return True
        else:
            print(f"Failed to create persistent task: {response.text}")
            return False
            
    except Exception as e:
        print(f"Persistence test failed: {e}")
        return False

def test_past_date_validation():
    """Test that backend rejects tasks with past due dates"""
    try:
        print("\n--- Testing Past Date Validation ---")
        
        from datetime import date, timedelta
        yesterday = date.today() - timedelta(days=1)
        
        # Try to create a task with yesterday's date
        task_data = {
            "title": "Past Date Task",
            "description": "This task has a past due date",
            "completed": False,
            "due_date": yesterday.isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data)
        print(f"Create task with past date ({yesterday}): {response.status_code}")
        
        if response.status_code == 400:
            error_data = response.json()
            print(f"✅ Backend correctly rejected past date: {error_data['detail']}")
            
            # Now try with today's date (should work)
            today = date.today()
            task_data["due_date"] = today.isoformat()
            task_data["title"] = "Today Date Task"
            
            response = requests.post(f"{BASE_URL}/api/tasks", json=task_data)
            print(f"Create task with today's date ({today}): {response.status_code}")
            
            if response.status_code == 200:
                task = response.json()
                print(f"✅ Backend accepted today's date. Task ID: {task['id']}")
                return True
            else:
                print(f"❌ Backend should accept today's date but got: {response.status_code}")
                return False
        else:
            print(f"❌ Backend should reject past date but got: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Past date validation test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing FastAPI Backend...")
    print("=" * 50)
    
    health_ok = test_health_check()
    tasks_ok = test_tasks_api()

    posts_ok = test_posts_api()
    calendar_ok = test_calendar_api()
    completion_ok = test_task_completion_tracking()
    past_date_ok = test_past_date_validation()
    persistence_ok = test_persistence()
    
    print("=" * 50)
    if health_ok and tasks_ok and posts_ok and calendar_ok and completion_ok and past_date_ok and persistence_ok:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!") 