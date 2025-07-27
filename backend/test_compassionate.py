#!/usr/bin/env python3
"""
Test script for compassionate rewriting functionality
"""

import os
import sys
from data.compassionate_rewriter import CompassionateRewriter

def test_compassionate_rewriter():
    """Test the compassionate rewriter functionality"""
    
    print("Testing Compassionate Rewriter...")
    
    # Initialize the rewriter
    rewriter = CompassionateRewriter()
    
    # Test cases
    test_cases = [
        "I feel so lazy today, I can't get anything done.",
        "I'm disgusting and I hate myself for not taking care of my hygiene.",
        "I'm such a failure at maintaining good habits.",
        "This is a normal positive message without negative words.",
        "I feel terrible about my progress and I'm so stupid for not doing better."
    ]
    
    for i, test_text in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i} ---")
        print(f"Original: {test_text}")
        
        # Analyze the text
        analysis = rewriter.analyze_and_suggest_rewrite(test_text)
        
        print(f"Contains negative words: {analysis['contains_negative_words']}")
        if analysis['found_words']:
            print(f"Found words: {', '.join(analysis['found_words'])}")
        
        if analysis['suggestion_available']:
            print(f"Rewritten: {analysis['rewritten_text']}")
        elif analysis['error']:
            print(f"Error: {analysis['error']}")
        else:
            print("No rewriting needed or available")
    
    print("\n--- Test Complete ---")

if __name__ == "__main__":
    test_compassionate_rewriter() 