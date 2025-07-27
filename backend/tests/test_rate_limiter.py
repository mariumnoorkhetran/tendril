#!/usr/bin/env python3
"""
Test script for the rate limiter functionality
"""
import requests
import time
import json

BASE_URL = "http://localhost:8000"

def test_rate_limiter():
    """Test the rate limiter by making multiple requests"""
    print("Testing Rate Limiter...")
    print("=" * 50)
    
    user_id = "test_user_123"
    test_content = "I feel terrible and worthless today"
    
    # Make multiple requests to test rate limiting
    for i in range(15):  # Try 15 requests (should hit the 10/minute limit)
        try:
            print(f"Request {i+1}: ", end="")
            
            response = requests.post(
                f"{BASE_URL}/api/posts/analyze",
                json={
                    "content": test_content,
                    "user_id": user_id
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                remaining = data.get("rate_limit", {}).get("remaining_requests", "unknown")
                print(f"✅ Success - Remaining requests: {remaining}")
            elif response.status_code == 429:
                error_data = response.json()
                print(f"⛔ Rate limited: {error_data.get('detail', {}).get('message', 'Rate limit exceeded')}")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
        
        # Small delay between requests
        time.sleep(0.1)
    
    print("\n" + "=" * 50)
    print("Rate limiter test completed!")

if __name__ == "__main__":
    test_rate_limiter() 