#!/usr/bin/env python3
"""
MCP Stock Prices Server
Provides stock price data from multiple free sources with fallback logic.
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import traceback

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.data_sources import StooqAdapter, AlphaVantageAdapter, YahooFinanceAdapter
from src.cache_manager import CacheManager
from src.rate_limiter import RateLimiter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class StockPricesServer:
    def __init__(self):
        self.cache_manager = CacheManager()
        self.rate_limiter = RateLimiter()
        
        # Initialize data sources in fallback order
        self.data_sources = [
            StooqAdapter(self.rate_limiter),
            AlphaVantageAdapter(self.rate_limiter),
            YahooFinanceAdapter(self.rate_limiter)
        ]
        
        logger.info("Stock Prices MCP Server initialized")

    async def handle_get_prices(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Handle get_prices tool call"""
        try:
            ticker = arguments.get("ticker", "").upper()
            start_date = arguments.get("start")
            end_date = arguments.get("end")
            adjusted = arguments.get("adjusted", True)
            
            if not ticker:
                return {"error": "Ticker symbol is required"}
            
            if not start_date or not end_date:
                return {"error": "Start and end dates are required"}
            
            logger.info(f"Fetching prices for {ticker} from {start_date} to {end_date}")
            
            # Try each data source in order
            for i, source in enumerate(self.data_sources):
                try:
                    data = await source.fetch_data(ticker, start_date, end_date, adjusted)
                    if data is not None and not data.empty:
                        # Cache the results
                        await self.cache_manager.save_data(ticker, data)
                        
                        # Convert to JSON format
                        records = data.to_dict('records')
                        
                        return {
                            "success": True,
                            "ticker": ticker,
                            "source": data.iloc[0]['source'] if len(data) > 0 else source.__class__.__name__,
                            "records_count": len(records),
                            "data": records
                        }
                except Exception as e:
                    logger.warning(f"Source {source.__class__.__name__} failed: {str(e)}")
                    if i == len(self.data_sources) - 1:  # Last source
                        raise
                    continue
            
            return {"error": "All data sources failed"}
            
        except Exception as e:
            logger.error(f"Error in get_prices: {str(e)}")
            logger.error(traceback.format_exc())
            return {"error": f"Internal server error: {str(e)}"}

    async def handle_get_current_price(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Handle get_current_price tool call"""
        try:
            ticker = arguments.get("ticker", "").upper()
            
            if not ticker:
                return {"error": "Ticker symbol is required"}
            
            # Get last 5 days to ensure we get recent data
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
            
            logger.info(f"Fetching current price for {ticker}")
            
            # Try each data source in order
            for source in self.data_sources:
                try:
                    data = await source.fetch_data(ticker, start_date, end_date, True)
                    if data is not None and not data.empty:
                        # Get the most recent record
                        latest = data.iloc[-1]
                        
                        return {
                            "success": True,
                            "ticker": ticker,
                            "source": latest['source'],
                            "date": latest['date'],
                            "price": float(latest['close']),
                            "change": float(latest.get('change', 0)),
                            "change_percent": float(latest.get('change_percent', 0))
                        }
                except Exception as e:
                    logger.warning(f"Source {source.__class__.__name__} failed: {str(e)}")
                    continue
            
            return {"error": "All data sources failed"}
            
        except Exception as e:
            logger.error(f"Error in get_current_price: {str(e)}")
            return {"error": f"Internal server error: {str(e)}"}

async def main():
    """Main MCP server loop"""
    server = StockPricesServer()
    
    logger.info("Starting MCP Stock Prices Server...")
    logger.info("Waiting for requests on stdin...")
    
    try:
        while True:
            try:
                # Read from stdin
                line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
                
                if not line:
                    break
                
                # Parse JSON request
                request = json.loads(line.strip())
                
                # Handle different MCP message types
                if request.get("method") == "tools/call":
                    tool_name = request["params"]["name"]
                    arguments = request["params"].get("arguments", {})
                    
                    if tool_name == "get_prices":
                        result = await server.handle_get_prices(arguments)
                    elif tool_name == "get_current_price":
                        result = await server.handle_get_current_price(arguments)
                    else:
                        result = {"error": f"Unknown tool: {tool_name}"}
                    
                    # Send response
                    response = {
                        "jsonrpc": "2.0",
                        "id": request.get("id"),
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": json.dumps(result, indent=2)
                                }
                            ]
                        }
                    }
                    
                    print(json.dumps(response))
                    sys.stdout.flush()
                
                elif request.get("method") == "initialize":
                    # Handle initialization
                    response = {
                        "jsonrpc": "2.0",
                        "id": request.get("id"),
                        "result": {
                            "protocolVersion": "2024-11-05",
                            "capabilities": {
                                "tools": {}
                            },
                            "serverInfo": {
                                "name": "stock-prices-server",
                                "version": "1.0.0"
                            }
                        }
                    }
                    
                    print(json.dumps(response))
                    sys.stdout.flush()
                
                elif request.get("method") == "tools/list":
                    # Return available tools
                    response = {
                        "jsonrpc": "2.0",
                        "id": request.get("id"),
                        "result": {
                            "tools": [
                                {
                                    "name": "get_prices",
                                    "description": "Fetch historical stock price data",
                                    "inputSchema": {
                                        "type": "object",
                                        "properties": {
                                            "ticker": {"type": "string"},
                                            "start": {"type": "string"},
                                            "end": {"type": "string"},
                                            "adjusted": {"type": "boolean", "default": True}
                                        },
                                        "required": ["ticker", "start", "end"]
                                    }
                                },
                                {
                                    "name": "get_current_price",
                                    "description": "Get current price for a stock ticker",
                                    "inputSchema": {
                                        "type": "object",
                                        "properties": {
                                            "ticker": {"type": "string"}
                                        },
                                        "required": ["ticker"]
                                    }
                                }
                            ]
                        }
                    }
                    
                    print(json.dumps(response))
                    sys.stdout.flush()
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {e}")
                continue
            except Exception as e:
                logger.error(f"Error processing request: {e}")
                logger.error(traceback.format_exc())
                continue
                
    except KeyboardInterrupt:
        logger.info("Server shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(main())