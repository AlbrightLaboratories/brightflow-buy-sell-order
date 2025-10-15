# MCP Stock Prices Server

A Model Context Protocol (MCP) server that provides real-time and historical stock price data from multiple free data sources with intelligent fallback logic.

## Features

- **Multiple Data Sources**: Stooq, Alpha Vantage, and Yahoo Finance with automatic fallback
- **Parquet Caching**: Efficient data storage and retrieval using Parquet format
- **Rate Limiting**: Respects API limits to prevent abuse
- **MCP Protocol**: Standard protocol for tool integration with AI assistants
- **Real-time & Historical**: Both current prices and historical data ranges

## Quick Start

### Installation

```bash
cd mcp-stock-server
pip install -r requirements.txt
```

### Usage

#### As MCP Server
```bash
python src/server.py
```

#### Testing
```bash
python test_server.py
```

### Configuration

The server uses the following data sources in order:

1. **Stooq** (Primary) - Free CSV data, no API key required
2. **Alpha Vantage** (Fallback) - Free tier with demo key
3. **Yahoo Finance** (Final fallback) - Using yfinance library

## MCP Tools

### get_current_price
Get the current stock price for a ticker.

**Parameters:**
- `ticker` (string, required): Stock ticker symbol

**Example:**
```json
{
  "ticker": "AAPL"
}
```

### get_prices
Get historical stock price data for a date range.

**Parameters:**
- `ticker` (string, required): Stock ticker symbol
- `start` (string, required): Start date (YYYY-MM-DD)
- `end` (string, required): End date (YYYY-MM-DD)
- `adjusted` (boolean, optional): Use adjusted prices (default: true)

**Example:**
```json
{
  "ticker": "MSFT",
  "start": "2024-01-01",
  "end": "2024-01-31",
  "adjusted": true
}
```

## Data Sources

### Stooq
- **URL**: https://stooq.com
- **Format**: CSV
- **Rate Limit**: 60 calls/minute
- **Cost**: Free
- **Pros**: No API key required, reliable
- **Cons**: Limited to basic data

### Alpha Vantage
- **URL**: https://www.alphavantage.co
- **Format**: CSV/JSON
- **Rate Limit**: 5 calls/minute (free tier)
- **Cost**: Free tier available
- **Pros**: Professional API, good documentation
- **Cons**: Limited free calls

### Yahoo Finance (yfinance)
- **Library**: yfinance
- **Rate Limit**: 30 calls/minute (conservative)
- **Cost**: Free
- **Pros**: Comprehensive data, widely used
- **Cons**: Unofficial API, may change

## Caching

Data is cached locally using Parquet format in `/data/prices/`:

- **Format**: `{TICKER}.parquet`
- **Expiry**: 24 hours for historical data
- **Benefits**: Faster responses, reduced API calls
- **Management**: Automatic cleanup and merging

## Rate Limiting

The server implements intelligent rate limiting:

- **Per-source limits**: Different limits for each data source
- **Automatic waiting**: Blocks when limits are reached
- **Transparent**: Continues automatically after wait period
- **Logging**: Detailed information about rate limit status

## Integration with BrightFlow

This MCP server integrates with the BrightFlow website to provide real stock price data for the search functionality. When a user searches for a stock ticker, the website calls the MCP server to get current prices and display them in real-time.

### Integration Steps

1. Start the MCP server: `python src/server.py`
2. The BrightFlow website connects to the server
3. Stock searches trigger MCP tool calls
4. Real-time price data is displayed to users

## Error Handling

- **Graceful degradation**: Falls back through data sources automatically
- **Detailed logging**: All errors are logged with context
- **User-friendly messages**: Clean error responses for tool calls
- **Retry logic**: Automatic retries with different sources

## Development

### Project Structure
```
mcp-stock-server/
├── src/
│   ├── __init__.py
│   ├── server.py           # Main MCP server
│   ├── data_sources.py     # Data source adapters
│   ├── cache_manager.py    # Parquet caching
│   └── rate_limiter.py     # API rate limiting
├── data/
│   └── prices/            # Parquet cache files
├── mcp.json              # MCP manifest
├── requirements.txt      # Python dependencies
├── test_server.py       # Test script
└── README.md           # This file
```

### Adding New Data Sources

To add a new data source:

1. Create a new adapter class inheriting from `DataSourceAdapter`
2. Implement the `fetch_data` method
3. Add the adapter to the `data_sources` list in `server.py`
4. Update rate limiting configuration

### Testing

The test script (`test_server.py`) provides comprehensive testing:

```bash
python test_server.py
```

Tests include:
- Current price fetching
- Historical data retrieval
- Error handling
- Data source fallback

## License

MIT License - see LICENSE file for details.