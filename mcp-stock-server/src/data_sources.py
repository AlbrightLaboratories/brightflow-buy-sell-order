"""
Data source adapters for fetching stock price data.
Each adapter implements the same interface but fetches from different sources.
"""

import asyncio
import aiohttp
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class DataSourceAdapter(ABC):
    """Base class for all data source adapters"""
    
    def __init__(self, rate_limiter):
        self.rate_limiter = rate_limiter
    
    @abstractmethod
    async def fetch_data(self, ticker: str, start_date: str, end_date: str, adjusted: bool = True) -> Optional[pd.DataFrame]:
        """Fetch stock data for the given parameters"""
        pass
    
    def standardize_dataframe(self, df: pd.DataFrame, ticker: str, source_name: str) -> pd.DataFrame:
        """Standardize dataframe format across all sources"""
        if df is None or df.empty:
            return df
        
        # Ensure we have the required columns
        required_columns = ['date', 'open', 'high', 'low', 'close', 'volume']
        
        # Rename columns to standard format
        column_mapping = {
            'Date': 'date',
            'Open': 'open', 
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Adj Close': 'close',
            'Volume': 'volume'
        }
        
        df = df.rename(columns=column_mapping)
        
        # Add missing columns
        for col in required_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Add metadata
        df['ticker'] = ticker
        df['source'] = source_name
        
        # Calculate change and change_percent
        if len(df) > 1:
            df['change'] = df['close'].diff()
            df['change_percent'] = (df['close'].pct_change() * 100)
        else:
            df['change'] = 0
            df['change_percent'] = 0
        
        # Ensure date is string format
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
        
        return df[['date', 'open', 'high', 'low', 'close', 'volume', 'change', 'change_percent', 'ticker', 'source']]

class StooqAdapter(DataSourceAdapter):
    """Adapter for Stooq data (CSV format, free)"""
    
    async def fetch_data(self, ticker: str, start_date: str, end_date: str, adjusted: bool = True) -> Optional[pd.DataFrame]:
        """Fetch data from Stooq"""
        await self.rate_limiter.wait_if_needed('stooq')
        
        try:
            # Convert dates
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            
            # Stooq URL format
            url = f"https://stooq.com/q/d/l/?s={ticker.lower()}&d1={start_dt.strftime('%Y%m%d')}&d2={end_dt.strftime('%Y%m%d')}&i=d"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        
                        # Parse CSV
                        from io import StringIO
                        df = pd.read_csv(StringIO(content))
                        
                        if df.empty or len(df) == 0:
                            return None
                        
                        return self.standardize_dataframe(df, ticker, 'Stooq')
                    else:
                        logger.warning(f"Stooq returned status {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Stooq adapter error: {str(e)}")
            return None

class AlphaVantageAdapter(DataSourceAdapter):
    """Adapter for Alpha Vantage API (free tier available)"""
    
    def __init__(self, rate_limiter):
        super().__init__(rate_limiter)
        self.api_key = "demo"  # Use demo key for now
        
    async def fetch_data(self, ticker: str, start_date: str, end_date: str, adjusted: bool = True) -> Optional[pd.DataFrame]:
        """Fetch data from Alpha Vantage"""
        await self.rate_limiter.wait_if_needed('alphavantage')
        
        try:
            # Alpha Vantage URL
            function = "TIME_SERIES_DAILY_ADJUSTED" if adjusted else "TIME_SERIES_DAILY"
            url = f"https://www.alphavantage.co/query?function={function}&symbol={ticker}&apikey={self.api_key}&outputsize=full&datatype=csv"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        
                        # Check for API limit message
                        if "Thank you for using Alpha Vantage" in content or "API call frequency" in content:
                            logger.warning("Alpha Vantage API limit reached")
                            return None
                        
                        # Parse CSV
                        from io import StringIO
                        df = pd.read_csv(StringIO(content))
                        
                        if df.empty:
                            return None
                        
                        # Filter by date range
                        df['timestamp'] = pd.to_datetime(df['timestamp'])
                        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
                        
                        df = df[(df['timestamp'] >= start_dt) & (df['timestamp'] <= end_dt)]
                        
                        if df.empty:
                            return None
                        
                        # Rename timestamp to date
                        df = df.rename(columns={'timestamp': 'date'})
                        
                        return self.standardize_dataframe(df, ticker, 'Alpha Vantage')
                    else:
                        logger.warning(f"Alpha Vantage returned status {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Alpha Vantage adapter error: {str(e)}")
            return None

class YahooFinanceAdapter(DataSourceAdapter):
    """Adapter for Yahoo Finance using yfinance library"""
    
    async def fetch_data(self, ticker: str, start_date: str, end_date: str, adjusted: bool = True) -> Optional[pd.DataFrame]:
        """Fetch data from Yahoo Finance"""
        await self.rate_limiter.wait_if_needed('yahoo')
        
        try:
            # Use yfinance in an executor to avoid blocking
            loop = asyncio.get_event_loop()
            
            def fetch_yahoo_data():
                stock = yf.Ticker(ticker)
                return stock.history(start=start_date, end=end_date)
            
            df = await loop.run_in_executor(None, fetch_yahoo_data)
            
            if df is None or df.empty:
                return None
            
            # Reset index to get date as column
            df = df.reset_index()
            
            # Use adjusted close if requested
            if adjusted and 'Adj Close' in df.columns:
                df['Close'] = df['Adj Close']
            
            return self.standardize_dataframe(df, ticker, 'Yahoo Finance')
            
        except Exception as e:
            logger.error(f"Yahoo Finance adapter error: {str(e)}")
            return None