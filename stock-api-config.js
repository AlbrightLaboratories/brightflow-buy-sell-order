/**
 * Stock API Configuration
 * Free APIs for stock data - no API key required for basic usage
 */

const STOCK_API_CONFIG = {
    // Primary API - Yahoo Finance (via CORS proxy)
    yahoo: {
        baseUrl: 'https://api.allorigins.win/raw?url=',
        endpoint: 'https://query1.finance.yahoo.com/v8/finance/chart/',
        enabled: true,
        priority: 1
    },
    
    // Secondary API - Alpha Vantage (free tier)
    alphaVantage: {
        baseUrl: 'https://www.alphavantage.co/query',
        apiKey: 'demo', // Replace with your free API key
        enabled: false, // Disabled by default - requires API key
        priority: 2
    },
    
    // Fallback API - IEX Cloud (free tier)
    iexCloud: {
        baseUrl: 'https://cloud.iexapis.com/stable/stock',
        apiKey: 'pk_test_1234567890abcdef', // Replace with your free API key
        enabled: false, // Disabled by default - requires API key
        priority: 3
    },
    
    // Backup API - Financial Modeling Prep (free tier)
    fmp: {
        baseUrl: 'https://financialmodelingprep.com/api/v3',
        apiKey: 'demo', // Replace with your free API key
        enabled: false, // Disabled by default - requires API key
        priority: 4
    }
};

// Popular stocks for auto-complete
const POPULAR_STOCKS = [
    // Tech Giants
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'NFLX', 'TSLA',
    // Financial
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA',
    // Healthcare
    'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR',
    // Consumer
    'WMT', 'PG', 'KO', 'PEP', 'NKE', 'MCD', 'SBUX', 'HD', 'LOW',
    // ETFs
    'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'GLD', 'SLV',
    // Crypto
    'BTC-USD', 'ETH-USD', 'ADA-USD', 'SOL-USD', 'DOT-USD',
    // International
    'ASML', 'TSM', 'NVO', 'SAP', 'UL', 'RHHBY', 'TM', 'SONY'
];

// Cache configuration
const CACHE_CONFIG = {
    timeout: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // Maximum number of cached stocks
    enabled: true
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
    maxRequests: 10, // Maximum requests per minute
    windowMs: 60 * 1000, // 1 minute window
    enabled: true
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STOCK_API_CONFIG,
        POPULAR_STOCKS,
        CACHE_CONFIG,
        RATE_LIMIT_CONFIG
    };
} else {
    window.STOCK_API_CONFIG = STOCK_API_CONFIG;
    window.POPULAR_STOCKS = POPULAR_STOCKS;
    window.CACHE_CONFIG = CACHE_CONFIG;
    window.RATE_LIMIT_CONFIG = RATE_LIMIT_CONFIG;
}
