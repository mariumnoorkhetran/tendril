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
            'weak', 'broken', 'damaged', 'ruined', 'destroyed', 'messed up',
            'dumb', 'yikes', 'cringe', 'ridiculous', 'absurd', 'nonsense',
            'terrible', 'awful', 'horrible', 'disgusting', 'gross', 'nasty',
            'embarrassing', 'shameful', 'pathetic', 'useless', 'pointless',
            'meaningless', 'hopeless', 'helpless', 'powerless', 'defeated',
            'beaten', 'crushed', 'destroyed', 'ruined', 'wasted', 'squandered'
        }
        
        # Initialize Groq client if API key is available
        api_key = os.environ.get("GROQ_API_KEY")
        if api_key:
            try:
                logger.info(f"Attempting to initialize Groq client with API key: {api_key[:10]}...")
                self.client = Groq(api_key=api_key)
                logger.info("Groq client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                logger.error(f"Error type: {type(e).__name__}")
                import traceback
                logger.error(f"Full traceback: {traceback.format_exc()}")
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
    
    def extract_rewritten_content(self, raw_response: str) -> str:
        """
        Extract only the rewritten content from the AI response, removing explanations.
        
        Args:
            raw_response: The full response from the AI
            
        Returns:
            Clean rewritten content only
        """
        if not raw_response:
            return ""
        
        # Remove common prefixes and explanations
        lines = raw_response.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            # Skip empty lines
            if not line:
                continue
            
            # Skip lines that are clearly explanations or prefixes
            skip_patterns = [
                "here's a rewritten version:",
                "here's the rewritten version:",
                "rewritten version:",
                "in this rewritten version",
                "i've aimed to",
                "i've tried to",
                "the rewritten version",
                "by using",
                "by replacing",
                "i've replaced",
                "i've changed",
                "this version",
                "the new version",
                "the compassionate version",
                "here is the rewritten text:",
                "title:",
                "content:"
            ]
            
            line_lower = line.lower()
            should_skip = any(pattern in line_lower for pattern in skip_patterns)
            
            # Also skip lines that start with common explanation patterns
            if line_lower.startswith(("in this", "by ", "the ", "this ", "i've ")):
                # Check if it's actually an explanation
                if any(word in line_lower for word in ["aimed", "tried", "replaced", "changed", "version", "using"]):
                    should_skip = True
            
            if not should_skip:
                cleaned_lines.append(line)
        
        # Join the cleaned lines
        result = '\n'.join(cleaned_lines).strip()
        
        # Clean up markdown formatting
        result = result.replace('**', '').replace('*', '')
        
        # If we still have a lot of text, try to extract just the first meaningful paragraph
        if len(result) > 200:
            # Split by double newlines to get paragraphs
            paragraphs = result.split('\n\n')
            if paragraphs:
                # Take the first paragraph that's not empty
                for paragraph in paragraphs:
                    if paragraph.strip() and len(paragraph.strip()) > 10:
                        result = paragraph.strip()
                        break
        
        return result
    
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

Provide ONLY the rewritten version without any explanations, labels, or additional text. Do not add "Title:" or "Content:" labels. Make it more supportive and understanding, as if speaking to a friend who needs encouragement."""

            chat_completion = self.client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a compassionate writing assistant. You help people rewrite their thoughts to be more kind and supportive to themselves, while preserving the original meaning and emotional intent. Provide ONLY the rewritten text without explanations, labels, or formatting."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            raw_response = chat_completion.choices[0].message.content.strip()
            rewritten_text = self.extract_rewritten_content(raw_response)
            logger.info(f"Successfully rewritten text: {len(text)} -> {len(rewritten_text)} characters")
            return rewritten_text
            
        except Exception as e:
            logger.error(f"Failed to rewrite text: {e}")
            return None
    
    def analyze_and_suggest_rewrite(self, text: str) -> dict:
        """
        Analyze text and provide rewriting suggestions if needed.
        
        Args:
            text: The text to analyze (can contain title and content separated by newlines)
            
        Returns:
            Dictionary with analysis results and suggestions
        """
        # Split text into title and content if it contains newlines
        lines = text.split('\n')
        title = lines[0].strip() if lines else ""
        content = '\n'.join(lines[1:]).strip() if len(lines) > 1 else ""
        
        # Analyze title and content separately
        title_contains_negative, title_found_words = self.contains_negative_words(title)
        content_contains_negative, content_found_words = self.contains_negative_words(content)
        
        # Combine results
        contains_negative = title_contains_negative or content_contains_negative
        all_found_words = title_found_words + content_found_words
        
        result = {
            'contains_negative_words': contains_negative,
            'found_words': all_found_words,
            'suggestion_available': False,
            'rewritten_text': None,
            'error': None
        }
        
        if contains_negative:
            logger.info(f"Negative words detected: Title={title_found_words}, Content={content_found_words}")
            
            # Only rewrite parts that contain negative words
            final_title = title
            final_content = content
            
            if title_contains_negative:
                # Only send the title for rewriting
                logger.info(f"Rewriting title only: '{title}'")
                rewritten_title = self.rewrite_compassionate(title)
                if rewritten_title:
                    final_title = rewritten_title
                    logger.info(f"Title rewritten to: '{final_title}'")
                else:
                    result['error'] = "Unable to generate compassionate rewrite for title"
                    return result
            
            if content_contains_negative:
                # Only send the content for rewriting
                logger.info(f"Rewriting content only: '{content}'")
                rewritten_content = self.rewrite_compassionate(content)
                if rewritten_content:
                    final_content = rewritten_content
                    logger.info(f"Content rewritten to: '{final_content}'")
                else:
                    result['error'] = "Unable to generate compassionate rewrite for content"
                    return result
            
            # Combine the results
            result['suggestion_available'] = True
            result['rewritten_text'] = f"{final_title}\n\n{final_content}"
        
        return result 