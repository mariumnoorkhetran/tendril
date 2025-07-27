#!/usr/bin/env python3
"""
Test script to verify the new publish flow behavior
"""
import requests
import time
import json

BASE_URL = "http://localhost:8080"

def test_publish_flow():
    """Test the new publish flow where analysis only happens on publish"""
    print("Testing New Publish Flow...")
    print("=" * 50)
    
    user_id = "test_user_publish"
    
    # Test 1: Normal positive post (should publish immediately)
    print("\n--- Test 1: Positive Post ---")
    positive_content = "I'm feeling great today and accomplished my goals!"
    
    response = requests.post(
        f"{BASE_URL}/api/posts/analyze",
        json={
            "content": positive_content,
            "user_id": user_id
        },
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Analysis successful")
        print(f"   Contains negative words: {data.get('contains_negative_words', False)}")
        print(f"   Should publish: {not data.get('contains_negative_words', False)}")
    else:
        print(f"❌ Analysis failed: {response.status_code}")
    
    # Test 2: Negative post (should get compassionate suggestion)
    print("\n--- Test 2: Negative Post ---")
    negative_content = "I feel terrible and worthless today, I'm such a failure."
    
    response = requests.post(
        f"{BASE_URL}/api/posts/analyze",
        json={
            "content": negative_content,
            "user_id": user_id
        },
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Analysis successful")
        print(f"   Contains negative words: {data.get('contains_negative_words', False)}")
        print(f"   Suggestion available: {data.get('suggestion_available', False)}")
        if data.get('suggestion_available'):
            print(f"   Rewritten text: {data.get('rewritten_text', '')[:100]}...")
        print(f"   Should block publish: {data.get('contains_negative_words', False)}")
    else:
        print(f"❌ Analysis failed: {response.status_code}")
    
    # Test 3: Rate limiting
    print("\n--- Test 3: Rate Limiting ---")
    print("Making multiple requests to test rate limiting...")
    
    for i in range(12):  # Try 12 requests (should hit the 10/minute limit)
        try:
            response = requests.post(
                f"{BASE_URL}/api/posts/analyze",
                json={
                    "content": f"Test content {i}",
                    "user_id": user_id
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                remaining = data.get("rate_limit", {}).get("remaining_requests", "unknown")
                print(f"   Request {i+1}: ✅ Success - {remaining} remaining")
            elif response.status_code == 429:
                print(f"   Request {i+1}: ⛔ Rate limited")
                break
            else:
                print(f"   Request {i+1}: ❌ Unexpected status {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   Request {i+1}: ❌ Request failed: {e}")
        
        time.sleep(0.1)
    
    print("\n" + "=" * 50)
    print("Publish flow test completed!")

if __name__ == "__main__":
    test_publish_flow() 