/**
 * Real Stock Search with API Integration
 * Supports multiple free APIs for stock data
 */

class StockSearch {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = CACHE_CONFIG.timeout;
        this.currentStock = null;
        this.watchlist = this.loadWatchlist();
        this.rateLimitTracker = [];
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const searchInput = document.getElementById('stockSearch');
        const searchButton = document.getElementById('searchButton');
        
        if (searchInput && searchButton) {
            searchButton.addEventListener('click', () => this.searchStock());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchStock();
                }
            });
            
            // Auto-complete functionality
            searchInput.addEventListener('input', (e) => {
                this.handleAutoComplete(e.target.value);
            });
        }
    }

    async searchStock() {
        const searchInput = document.getElementById('stockSearch');
        const symbol = searchInput.value.trim().toUpperCase();
        
        if (!symbol) {
            this.showError('Please enter a stock symbol');
            return;
        }

        this.showLoading();
        
        try {
            const stockData = await this.fetchStockData(symbol);
            if (stockData) {
                this.displayStockData(stockData);
                this.storeInMemory(stockData);
                this.addToWatchlist(stockData);
            } else {
                this.showError('Stock not found');
            }
        } catch (error) {
            console.error('Stock search error:', error);
            this.showError('Failed to fetch stock data');
        }
    }

    async fetchStockData(symbol) {
        // Check cache first
        const cached = this.getCachedData(symbol);
        if (cached) {
            return cached;
        }

        // Try multiple APIs for better reliability
        const apis = [
            () => this.fetchFromAlphaVantage(symbol),
            () => this.fetchFromYahooFinance(symbol),
            () => this.fetchFromIEXCloud(symbol)
        ];

        for (const api of apis) {
            try {
                const data = await api();
                if (data) {
                    this.cacheData(symbol, data);
                    return data;
                }
            } catch (error) {
                console.warn('API failed, trying next:', error);
            }
        }

        return null;
    }

    async fetchFromAlphaVantage(symbol) {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data['Global Quote']) {
            const quote = data['Global Quote'];
            return {
                symbol: quote['01. symbol'],
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                volume: parseInt(quote['06. volume']),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
                open: parseFloat(quote['02. open']),
                previousClose: parseFloat(quote['08. previous close']),
                timestamp: new Date().toISOString()
            };
        }
        return null;
    }

    async fetchFromYahooFinance(symbol) {
        // Using a CORS proxy for Yahoo Finance
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(yahooUrl));
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const quote = result.quote;
            
            return {
                symbol: meta.symbol,
                price: meta.regularMarketPrice,
                change: meta.regularMarketPrice - meta.previousClose,
                changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                volume: meta.regularMarketVolume,
                high: meta.regularMarketDayHigh,
                low: meta.regularMarketDayLow,
                open: meta.regularMarketOpen,
                previousClose: meta.previousClose,
                timestamp: new Date().toISOString()
            };
        }
        return null;
    }

    async fetchFromIEXCloud(symbol) {
        // IEX Cloud free tier
        const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=pk_test_1234567890abcdef`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.symbol) {
            return {
                symbol: data.symbol,
                price: data.latestPrice,
                change: data.change,
                changePercent: data.changePercent * 100,
                volume: data.volume,
                high: data.high,
                low: data.low,
                open: data.open,
                previousClose: data.previousClose,
                timestamp: new Date().toISOString()
            };
        }
        return null;
    }

    displayStockData(stockData) {
        const stockSymbol = document.getElementById('stockSymbol');
        const stockPrice = document.getElementById('stockPrice');
        const priceChange = document.getElementById('priceChange');
        const priceDisplay = document.getElementById('stockPriceDisplay');

        if (stockSymbol && stockPrice && priceChange && priceDisplay) {
            stockSymbol.textContent = stockData.symbol;
            stockPrice.textContent = `$${stockData.price.toFixed(2)}`;
            
            const changeClass = stockData.change >= 0 ? 'positive' : 'negative';
            const changeSign = stockData.change >= 0 ? '+' : '';
            priceChange.textContent = `${changeSign}$${stockData.change.toFixed(2)} (${changeSign}${stockData.changePercent.toFixed(2)}%)`;
            priceChange.className = `price-change ${changeClass}`;
            
            priceDisplay.classList.add('active');
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                priceDisplay.classList.remove('active');
            }, 10000);
        }
    }

    showLoading() {
        const stockSymbol = document.getElementById('stockSymbol');
        const stockPrice = document.getElementById('stockPrice');
        const priceChange = document.getElementById('priceChange');
        const priceDisplay = document.getElementById('stockPriceDisplay');

        if (stockSymbol && stockPrice && priceChange && priceDisplay) {
            const symbol = document.getElementById('stockSearch').value.toUpperCase();
            stockSymbol.textContent = symbol;
            stockPrice.textContent = 'Loading...';
            priceChange.textContent = '';
            priceDisplay.classList.add('active');
        }
    }

    showError(message) {
        const stockSymbol = document.getElementById('stockSymbol');
        const stockPrice = document.getElementById('stockPrice');
        const priceChange = document.getElementById('priceChange');
        const priceDisplay = document.getElementById('stockPriceDisplay');

        if (stockSymbol && stockPrice && priceChange && priceDisplay) {
            const symbol = document.getElementById('stockSearch').value.toUpperCase();
            stockSymbol.textContent = symbol;
            stockPrice.textContent = 'Error';
            priceChange.textContent = message;
            priceChange.className = 'price-change negative';
            priceDisplay.classList.add('active');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                priceDisplay.classList.remove('active');
            }, 5000);
        }
    }

    storeInMemory(stockData) {
        this.currentStock = stockData;
        
        // Store in localStorage for persistence
        localStorage.setItem('currentStock', JSON.stringify(stockData));
        
        // Store in session storage for current session
        sessionStorage.setItem('lastSearchedStock', JSON.stringify(stockData));
        
        console.log('Stock data stored in memory:', stockData);
    }

    addToWatchlist(stockData) {
        if (!this.watchlist.find(stock => stock.symbol === stockData.symbol)) {
            this.watchlist.push({
                ...stockData,
                addedAt: new Date().toISOString()
            });
            this.saveWatchlist();
        }
    }

    loadWatchlist() {
        try {
            const stored = localStorage.getItem('stockWatchlist');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading watchlist:', error);
            return [];
        }
    }

    saveWatchlist() {
        try {
            localStorage.setItem('stockWatchlist', JSON.stringify(this.watchlist));
        } catch (error) {
            console.error('Error saving watchlist:', error);
        }
    }

    getCachedData(symbol) {
        const cached = this.cache.get(symbol);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    cacheData(symbol, data) {
        this.cache.set(symbol, {
            data: data,
            timestamp: Date.now()
        });
    }

    handleAutoComplete(input) {
        // Simple auto-complete for common stocks
        const commonStocks = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
            'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'GLD',
            'JPM', 'BAC', 'WMT', 'PG', 'JNJ', 'KO', 'PFE', 'HD', 'MA', 'V'
        ];
        
        const suggestions = commonStocks.filter(stock => 
            stock.toLowerCase().includes(input.toLowerCase())
        );
        
        // You could implement a dropdown here
        console.log('Auto-complete suggestions:', suggestions);
    }

    getCurrentStock() {
        return this.currentStock;
    }

    getWatchlist() {
        return this.watchlist;
    }

    removeFromWatchlist(symbol) {
        this.watchlist = this.watchlist.filter(stock => stock.symbol !== symbol);
        this.saveWatchlist();
    }

    clearCache() {
        this.cache.clear();
    }

    // Load last searched stock on page load
    loadLastSearchedStock() {
        try {
            const lastStock = localStorage.getItem('currentStock');
            if (lastStock) {
                const stockData = JSON.parse(lastStock);
                this.displayStockData(stockData);
                this.currentStock = stockData;
            }
        } catch (error) {
            console.error('Error loading last searched stock:', error);
        }
    }
}

// Initialize stock search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.stockSearch = new StockSearch();
    
    // Load last searched stock
    window.stockSearch.loadLastSearchedStock();
    
    // Add some popular stocks to watchlist on first visit
    if (window.stockSearch.getWatchlist().length === 0) {
        const popularStocks = [
            { symbol: 'AAPL', price: 175.43, change: 2.34, changePercent: 1.35 },
            { symbol: 'MSFT', price: 332.89, change: -1.23, changePercent: -0.37 },
            { symbol: 'GOOGL', price: 138.21, change: 0.87, changePercent: 0.63 },
            { symbol: 'TSLA', price: 248.50, change: -4.12, changePercent: -1.63 }
        ];
        
        popularStocks.forEach(stock => {
            window.stockSearch.addToWatchlist(stock);
        });
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockSearch;
}
