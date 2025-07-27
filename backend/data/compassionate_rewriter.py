import os
import re
import logging
from typing import Optional, Tuple, List
from groq import Groq
from groq.types.chat import ChatCompletion

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CompassionateRewriter:
    def __init__(self):
        self.client = None
        self.negative_words = {
            'lazy', 'disgusting', 'hate', 'terrible', 'awful', 'horrible',
            'stupid', 'idiot', 'worthless', 'useless', 'pathetic', 'failure',
            'disgusted', 'sick', 'nasty', 'gross', 'filthy', 'dirty',
            'embarrassed', 'ashamed', 'guilty', 'hopeless', 'helpless',
            'weak', 'broken', 'damaged', 'ruined', 'destroyed', 'messed up'
        }
        
        # Initialize Groq client if API key is available
        api_key = os.environ.get("GROQ_API_KEY")
        if api_key:
            try:
                self.client = Groq(api_key=api_key)
                logger.info("Groq client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self.client = None
        else:
            logger.warning("GROQ_API_KEY not found in environment variables")
    
    def contains_negative_words(self, text: str) -> Tuple[bool, List[str]]:
        """
        Check if text contains negative words and return them.
        
        Args:
            text: The text to analyze
            
        Returns:
            Tuple of (contains_negative, list_of_found_words)
        """
        if not text:
            return False, []
        
        # Convert to lowercase for case-insensitive matching
        text_lower = text.lower()
        
        # Find all negative words in the text
        found_words = []
        for word in self.negative_words:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, text_lower):
                found_words.append(word)
        
        return len(found_words) > 0, found_words
    
    def rewrite_compassionate(self, text: str) -> Optional[str]:
        """
        Rewrite text to sound more compassionate and self-kind.
        
        Args:
            text: The original text to rewrite
            
        Returns:
            Rewritten text or None if rewriting failed
        """
        if not self.client:
            logger.warning("Groq client not available, cannot rewrite text")
            return None
        
        if not text.strip():
            return None
        
        try:
            prompt = f"""Rewrite this text to sound more compassionate and self-kind, while maintaining the original meaning and intent:

Original: {text}

Please make it more supportive and understanding, as if speaking to a friend who needs encouragement."""

            chat_completion = self.client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a compassionate writing assistant. You help people rewrite their thoughts to be more kind and supportive to themselves, while preserving the original meaning and emotional intent."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            rewritten_text = chat_completion.choices[0].message.content.strip()
            logger.info(f"Successfully rewritten text: {len(text)} -> {len(rewritten_text)} characters")
            return rewritten_text
            
        except Exception as e:
            logger.error(f"Failed to rewrite text: {e}")
            return None
    
    def analyze_and_suggest_rewrite(self, text: str) -> dict:
        """
        Analyze text and provide rewriting suggestions if needed.
        
        Args:
            text: The text to analyze
            
        Returns:
            Dictionary with analysis results and suggestions
        """
        contains_negative, found_words = self.contains_negative_words(text)
        
        result = {
            'contains_negative_words': contains_negative,
            'found_words': found_words,
            'suggestion_available': False,
            'rewritten_text': None,
            'error': None
        }
        
        if contains_negative:
            logger.info(f"Negative words detected: {found_words}")
            rewritten = self.rewrite_compassionate(text)
            
            if rewritten:
                result['suggestion_available'] = True
                result['rewritten_text'] = rewritten
            else:
                result['error'] = "Unable to generate compassionate rewrite"
        
        return result 