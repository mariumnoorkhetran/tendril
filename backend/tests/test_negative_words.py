#!/usr/bin/env python3
"""
Test the updated negative words list
"""
import sys
import os

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.compassionate_rewriter import CompassionateRewriter

def test_negative_words():
    """Test the updated negative words detection"""
    print("Testing Updated Negative Words Detection...")
    print("=" * 50)
    
    # Initialize rewriter
    rewriter = CompassionateRewriter()
    
    # Test cases from the screenshot
    test_cases = [
        "dumb take",
        "yikes, what a dumb take",
        "This is a normal positive message",
        "I hate doing these tasks",
        "That's ridiculous",
        "What a cringe comment"
    ]
    
    for i, test_text in enumerate(test_cases, 1):
        print(f"\n--- Test {i} ---")
        print(f"Text: '{test_text}'")
        
        # Test the contains_negative_words method
        contains_negative, found_words = rewriter.contains_negative_words(test_text)
        
        print(f"Contains negative words: {contains_negative}")
        if found_words:
            print(f"Found words: {', '.join(found_words)}")
        else:
            print("No negative words found")
        
        # Test the full analysis
        analysis = rewriter.analyze_and_suggest_rewrite(test_text)
        print(f"Analysis result: {analysis['contains_negative_words']}")
        
        if analysis['suggestion_available']:
            print(f"✅ Would show compassionate suggestion")
        elif analysis['contains_negative_words']:
            print(f"⚠️  Contains negative words but no suggestion available")
        else:
            print(f"✅ Would allow posting")

if __name__ == "__main__":
    test_negative_words() 