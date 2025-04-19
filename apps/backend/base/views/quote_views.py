# base/views/quote_views.py
import requests
import random
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Local fallback quotes
FALLBACK_QUOTES = [
    {
        "content": "The best time to plant a tree was 20 years ago. The second best time is now.",
        "author": "Chinese Proverb",
        "tags": ["wisdom", "inspiration"]
    },
    {
        "content": "In the world of bonsai, patience is not just a virtue—it's an art form.",
        "author": "Japanese Proverb",
        "tags": ["bonsai", "patience"]
    },
    {
        "content": "Like a bonsai tree, personal growth requires careful pruning and constant attention.",
        "author": "Zen Teaching",
        "tags": ["growth", "mindfulness"]
    },
    {
        "content": "Nature does not hurry, yet everything is accomplished.",
        "author": "Lao Tzu",
        "tags": ["nature", "patience"]
    },
    {
        "content": "The journey of a thousand miles begins with a single step.",
        "author": "Lao Tzu",
        "tags": ["inspiration", "journey"]
    }
]

@api_view(["GET"])
@permission_classes([AllowAny])
def get_random_quote(request):
    """Get a random quote, first trying the external API, then falling back to local quotes if that fails."""
    try:
        # Try to get quote from Zen Quotes API
        response = requests.get(
            "https://zenquotes.io/api/random",
            timeout=3,
            headers={
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            verify=True,
        )
        response.raise_for_status()
        zen_quote = response.json()[0]  # Zen Quotes returns an array with one quote
        
        # Convert Zen Quotes format to our format
        quote = {
            "content": zen_quote["q"],
            "author": zen_quote["a"],
            "tags": ["zen", "wisdom"]
        }
        
        logger.info(f"Successfully fetched quote from Zen Quotes API")
        return JsonResponse(quote)
        
    except Exception as e:
        # Log any error but don't expose it in the response
        error_msg = f"Error fetching quote from Zen Quotes API: {str(e)}"
        logger.warning(error_msg)
        
        # Return a random quote from our local collection
        fallback_quote = random.choice(FALLBACK_QUOTES)
        logger.info(f"Using fallback quote: {fallback_quote}")
        return JsonResponse(fallback_quote)
