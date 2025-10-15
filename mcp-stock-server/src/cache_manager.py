"""
Cache manager for storing stock price data using Parquet format.
"""

import pandas as pd
import os
from pathlib import Path
from datetime import datetime, timedelta
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class CacheManager:
    """Manages caching of stock price data using Parquet files"""
    
    def __init__(self, cache_dir: Optional[str] = None):
        if cache_dir is None:
            cache_dir = Path(__file__).parent.parent / "data" / "prices"
        
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Cache expiry time (1 day for historical data)
        self.cache_expiry_hours = 24
        
    def get_cache_file_path(self, ticker: str) -> Path:
        """Get the cache file path for a ticker"""
        return self.cache_dir / f"{ticker.upper()}.parquet"
    
    async def get_cached_data(self, ticker: str, start_date: str, end_date: str) -> Optional[pd.DataFrame]:
        """Retrieve cached data if available and not expired"""
        try:
            cache_file = self.get_cache_file_path(ticker)
            
            if not cache_file.exists():
                return None
            
            # Check file age
            file_age = datetime.now() - datetime.fromtimestamp(cache_file.stat().st_mtime)
            if file_age > timedelta(hours=self.cache_expiry_hours):
                logger.info(f"Cache expired for {ticker}")
                return None
            
            # Load cached data
            df = pd.read_parquet(cache_file)
            
            # Filter by date range
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            
            df['date_dt'] = pd.to_datetime(df['date'])
            filtered_df = df[(df['date_dt'] >= start_dt) & (df['date_dt'] <= end_dt)]
            
            if filtered_df.empty:
                return None
            
            # Remove temporary date column
            filtered_df = filtered_df.drop('date_dt', axis=1)
            
            logger.info(f"Cache hit for {ticker}: {len(filtered_df)} records")
            return filtered_df
            
        except Exception as e:
            logger.warning(f"Error reading cache for {ticker}: {str(e)}")
            return None
    
    async def save_data(self, ticker: str, data: pd.DataFrame):
        """Save data to cache"""
        try:
            if data is None or data.empty:
                return
            
            cache_file = self.get_cache_file_path(ticker)
            
            # Load existing data if available
            existing_data = None
            if cache_file.exists():
                try:
                    existing_data = pd.read_parquet(cache_file)
                except Exception as e:
                    logger.warning(f"Error loading existing cache for {ticker}: {str(e)}")
            
            # Merge with existing data
            if existing_data is not None and not existing_data.empty:
                # Combine data and remove duplicates
                combined_data = pd.concat([existing_data, data], ignore_index=True)
                combined_data = combined_data.drop_duplicates(subset=['date'], keep='last')
                combined_data = combined_data.sort_values('date')
            else:
                combined_data = data.sort_values('date')
            
            # Save to parquet
            combined_data.to_parquet(cache_file, index=False)
            logger.info(f"Cached {len(combined_data)} records for {ticker}")
            
        except Exception as e:
            logger.error(f"Error saving cache for {ticker}: {str(e)}")
    
    def clear_cache(self, ticker: Optional[str] = None):
        """Clear cache for a specific ticker or all tickers"""
        try:
            if ticker:
                cache_file = self.get_cache_file_path(ticker)
                if cache_file.exists():
                    cache_file.unlink()
                    logger.info(f"Cleared cache for {ticker}")
            else:
                # Clear all cache files
                for cache_file in self.cache_dir.glob("*.parquet"):
                    cache_file.unlink()
                logger.info("Cleared all cache")
                
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
    
    def get_cache_stats(self) -> dict:
        """Get statistics about the cache"""
        try:
            cache_files = list(self.cache_dir.glob("*.parquet"))
            total_size = sum(f.stat().st_size for f in cache_files)
            
            return {
                "total_files": len(cache_files),
                "total_size_mb": total_size / (1024 * 1024),
                "cache_dir": str(self.cache_dir),
                "files": [f.stem for f in cache_files]
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {str(e)}")
            return {"error": str(e)}