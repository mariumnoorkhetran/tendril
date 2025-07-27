#!/usr/bin/env python3
"""
Test script for compassionate rewriting functionality
"""

import os
import sys
from dotenv import load_dotenv

# Add the parent directory to the path so we can import from data module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from the root directory (tendril/)
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(root_dir, '.env'))

# Import after loading environment variables
from data.compassionate_rewriter import CompassionateRewriter



def test_compassionate_rewriter():
    """Test the compassionate rewriter functionality"""
    
    print("Testing Compassionate Rewriter...")
    
    # Check if GROQ_API_KEY is set
    if not os.getenv("GROQ_API_KEY"):
        print("⚠️  WARNING: GROQ_API_KEY not found in environment variables")
        print("   The compassionate rewriter will detect negative words but cannot rewrite them.")
        print("   To enable rewriting, set your GROQ_API_KEY in a .env file or environment variable.")
        print("   See backend/SETUP.md for instructions.\n")
    else:
        print(f"✅ GROQ_API_KEY found: {os.getenv('GROQ_API_KEY')[:10]}...")
    
    # Initialize the rewriter AFTER checking environment variables
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