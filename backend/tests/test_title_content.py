#!/usr/bin/env python3
"""
Test script to verify title and content analysis
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_title_content_analysis():
    """Test analyzing both title and content together"""
    print("Testing Title + Content Analysis...")
    print("=" * 50)
    
    user_id = "test_user_title_content"
    
    # Test 1: Negative title, positive content
    print("\n--- Test 1: Negative Title, Positive Content ---")
    title = "I'm such a failure at hygiene"
    content = "I'm trying my best to maintain good habits and I'm making progress."
    
    combined_text = f"{title}\n\n{content}"
    
    response = requests.post(
        f"{BASE_URL}/api/posts/analyze",
        json={
            "content": combined_text,
            "user_id": user_id
        },
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Analysis successful")
        print(f"   Contains negative words: {data.get('contains_negative_words', False)}")
        print(f"   Found words: {', '.join(data.get('found_words', []))}")
        if data.get('suggestion_available'):
            print(f"   Rewritten text: {data.get('rewritten_text', '')[:200]}...")
    else:
        print(f"❌ Analysis failed: {response.status_code}")
    
    # Test 2: Positive title, negative content
    print("\n--- Test 2: Positive Title, Negative Content ---")
    title = "My Wellness Journey"
    content = "I feel terrible and worthless today, I'm such a failure."
    
    combined_text = f"{title}\n\n{content}"
    
    response = requests.post(
        f"{BASE_URL}/api/posts/analyze",
        json={
            "content": combined_text,
            "user_id": user_id
        },
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Analysis successful")
        print(f"   Contains negative words: {data.get('contains_negative_words', False)}")
        print(f"   Found words: {', '.join(data.get('found_words', []))}")
        if data.get('suggestion_available'):
            print(f"   Rewritten text: {data.get('rewritten_text', '')[:200]}...")
    else:
        print(f"❌ Analysis failed: {response.status_code}")
    
    # Test 3: Both negative
    print("\n--- Test 3: Both Title and Content Negative ---")
    title = "Why am I so disgusting?"
    content = "I hate myself for not taking care of my hygiene properly."
    
    combined_text = f"{title}\n\n{content}"
    
    response = requests.post(
        f"{BASE_URL}/api/posts/analyze",
        json={
            "content": combined_text,
            "user_id": user_id
        },
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Analysis successful")
        print(f"   Contains negative words: {data.get('contains_negative_words', False)}")
        print(f"   Found words: {', '.join(data.get('found_words', []))}")
        if data.get('suggestion_available'):
            print(f"   Rewritten text: {data.get('rewritten_text', '')[:200]}...")
    else:
        print(f"❌ Analysis failed: {response.status_code}")
    
    # Test 4: Both positive
    print("\n--- Test 4: Both Title and Content Positive ---")
    title = "My Amazing Progress"
    content = "I'm feeling great today and accomplished my wellness goals!"
    
    combined_text = f"{title}\n\n{content}"
    
    response = requests.post(
        f"{BASE_URL}/api/posts/analyze",
        json={
            "content": combined_text,
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
    
    print("\n" + "=" * 50)
    print("Title + Content analysis test completed!")

if __name__ == "__main__":
    test_title_content_analysis() 