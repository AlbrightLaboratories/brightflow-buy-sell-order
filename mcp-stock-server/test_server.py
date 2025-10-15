#!/usr/bin/env python3
"""
Test script for the MCP Stock Prices Server
"""

import asyncio
import json
import sys
import logging
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.server import StockPricesServer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_server():
    """Test the server functionality"""
    server = StockPricesServer()
    
    print("🧪 Testing MCP Stock Prices Server\n")
    
    # Test 1: Get current price for AAPL
    print("📊 Test 1: Get current price for AAPL")
    result = await server.handle_get_current_price({"ticker": "AAPL"})
    print(f"Result: {json.dumps(result, indent=2)}\n")
    
    # Test 2: Get historical prices for MSFT
    print("📈 Test 2: Get historical prices for MSFT (last 7 days)")
    from datetime import datetime, timedelta
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    result = await server.handle_get_prices({
        "ticker": "MSFT",
        "start": start_date,
        "end": end_date,
        "adjusted": True
    })
    print(f"Result: {json.dumps(result, indent=2)}\n")
    
    # Test 3: Test error handling
    print("❌ Test 3: Test error handling (empty ticker)")
    result = await server.handle_get_current_price({"ticker": ""})
    print(f"Result: {json.dumps(result, indent=2)}\n")
    
    print("✅ Testing complete!")

if __name__ == "__main__":
    asyncio.run(test_server())