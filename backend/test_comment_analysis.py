#!/usr/bin/env python3
"""
Test script for comment analysis functionality
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_comment_analysis():
    """Test the comment analysis functionality"""
    print("Testing Comment Analysis...")
    print("=" * 50)
    
    user_id = "test_comment_analysis"
    
    # Test cases
    test_cases = [
        {
            "name": "Positive Comment",
            "content": "This is a great post! I really enjoyed reading it.",
            "expected_negative": False
        },
        {
            "name": "Negative Comment",
            "content": "I'm such a failure at maintaining good habits.",
            "expected_negative": True
        },
        {
            "name": "Mixed Comment",
            "content": "I love this community but I hate myself for not doing better.",
            "expected_negative": True
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test {i}: {test_case['name']} ---")
        print(f"Content: '{test_case['content']}'")
        
        response = requests.post(
            f"{BASE_URL}/api/comments/analyze",
            json={
                "content": test_case['content'],
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
                rewritten_text = data.get('rewritten_text', '')
                print(f"   Rewritten text: '{rewritten_text}'")
            
            # Check if result matches expectation
            if data.get('contains_negative_words') == test_case['expected_negative']:
                print(f"   ✅ Result matches expectation")
            else:
                print(f"   ⚠️  Result doesn't match expectation")
                
        else:
            print(f"❌ Analysis failed: {response.status_code}")
            print(f"   Response: {response.text}")
    
    print("\n" + "=" * 50)
    print("Comment analysis test completed!")

if __name__ == "__main__":
    test_comment_analysis() 