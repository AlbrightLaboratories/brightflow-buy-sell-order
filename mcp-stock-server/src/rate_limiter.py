"""
Rate limiter to prevent API abuse and respect rate limits.
"""

import asyncio
import time
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter for API calls to different data sources"""
    
    def __init__(self):
        # Rate limits per source (calls per minute)
        self.limits = {
            'stooq': 60,         # Conservative limit
            'alphavantage': 5,   # Free tier limit
            'yahoo': 30          # Conservative limit
        }
        
        # Track last call times
        self.last_calls: Dict[str, float] = {}
        
        # Track call counts per minute
        self.call_counts: Dict[str, list] = {}
    
    async def wait_if_needed(self, source: str):
        """Wait if necessary to respect rate limits"""
        current_time = time.time()
        
        # Initialize if first call for this source
        if source not in self.call_counts:
            self.call_counts[source] = []
        
        # Clean old calls (older than 1 minute)
        minute_ago = current_time - 60
        self.call_counts[source] = [
            call_time for call_time in self.call_counts[source] 
            if call_time > minute_ago
        ]
        
        # Check if we've hit the limit
        limit = self.limits.get(source, 60)
        
        if len(self.call_counts[source]) >= limit:
            # We've hit the limit, wait until the oldest call is > 1 minute old
            oldest_call = min(self.call_counts[source])
            wait_time = 60 - (current_time - oldest_call)
            
            if wait_time > 0:
                logger.info(f"Rate limit reached for {source}, waiting {wait_time:.1f} seconds")
                await asyncio.sleep(wait_time)
                current_time = time.time()
        
        # Record this call
        self.call_counts[source].append(current_time)
        self.last_calls[source] = current_time
        
        logger.debug(f"API call to {source} (count: {len(self.call_counts[source])}/{limit})")
    
    def get_stats(self) -> dict:
        """Get statistics about API usage"""
        current_time = time.time()
        minute_ago = current_time - 60
        
        stats = {}
        for source in self.limits:
            calls = self.call_counts.get(source, [])
            recent_calls = [c for c in calls if c > minute_ago]
            
            stats[source] = {
                "limit_per_minute": self.limits[source],
                "calls_last_minute": len(recent_calls),
                "last_call": self.last_calls.get(source, 0),
                "seconds_since_last_call": current_time - self.last_calls.get(source, 0)
            }
        
        return stats