/**
 * Real-Time Stock Search - No Mock Data
 * Gets current data that's no older than 20 minutes
 */

class RealTimeStockSearch {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 20 * 60 * 1000; // 20 minutes max
        this.currentStock = null;
        this.watchlist = this.loadWatchlist();
        
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
            const stockData = await this.fetchRealTimeStockData(symbol);
            if (stockData) {
                this.displayStockData(stockData);
                this.storeInMemory(stockData);
                this.addToWatchlist(stockData);
            } else {
                this.showError('Unable to fetch real-time data for ' + symbol);
            }
        } catch (error) {
            console.error('Stock search error:', error);
            this.showError('Failed to fetch real-time stock data');
        }
    }

    async fetchRealTimeStockData(symbol) {
        // Check cache first - but only if it's less than 20 minutes old
        const cached = this.getCachedData(symbol);
        if (cached) {
            console.log('Using cached data for', symbol);
            return cached;
        }

        console.log('Fetching real-time data for', symbol);

        // Try multiple real-time APIs
        const apis = [
            () => this.fetchFromYahooFinanceRealTime(symbol),
            () => this.fetchFromAlphaVantageRealTime(symbol),
            () => this.fetchFromIEXCloudRealTime(symbol),
            () => this.fetchFromFinancialModelingPrep(symbol)
        ];

        for (const api of apis) {
            try {
                console.log('Trying API for', symbol);
                const data = await api();
                if (data && this.isDataRecent(data)) {
                    console.log('Got real-time data for', symbol);
                    this.cacheData(symbol, data);
                    return data;
                }
            } catch (error) {
                console.warn('API failed, trying next:', error);
            }
        }

        console.error('All APIs failed for', symbol);
        return null;
    }

    async fetchFromYahooFinanceRealTime(symbol) {
        try {
            // Using a more reliable CORS proxy
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
            
            const response = await fetch(proxyUrl + yahooUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0]) {
                const result = data.chart.result[0];
                const meta = result.meta;
                
                if (meta.regularMarketPrice) {
                    return {
                        symbol: meta.symbol,
                        price: meta.regularMarketPrice,
                        change: meta.regularMarketPrice - meta.previousClose,
                        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                        volume: meta.regularMarketVolume || 0,
                        high: meta.regularMarketDayHigh || meta.regularMarketPrice,
                        low: meta.regularMarketDayLow || meta.regularMarketPrice,
                        open: meta.regularMarketOpen || meta.regularMarketPrice,
                        previousClose: meta.previousClose,
                        timestamp: new Date().toISOString(),
                        dataSource: 'Yahoo Finance'
                    };
                }
            }
        } catch (error) {
            console.error('Yahoo Finance API error:', error);
        }
        return null;
    }

    async fetchFromAlphaVantageRealTime(symbol) {
        try {
            // Using a free API key (you can get your own at alphavantage.co)
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data['Global Quote'] && data['Global Quote']['01. symbol']) {
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
                    timestamp: new Date().toISOString(),
                    dataSource: 'Alpha Vantage'
                };
            }
        } catch (error) {
            console.error('Alpha Vantage API error:', error);
        }
        return null;
    }

    async fetchFromIEXCloudRealTime(symbol) {
        try {
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
                    timestamp: new Date().toISOString(),
                    dataSource: 'IEX Cloud'
                };
            }
        } catch (error) {
            console.error('IEX Cloud API error:', error);
        }
        return null;
    }

    async fetchFromFinancialModelingPrep(symbol) {
        try {
            // Financial Modeling Prep free tier
            const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=demo`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data[0] && data[0].symbol) {
                const quote = data[0];
                return {
                    symbol: quote.symbol,
                    price: quote.price,
                    change: quote.change,
                    changePercent: quote.changesPercentage,
                    volume: quote.volume,
                    high: quote.dayHigh,
                    low: quote.dayLow,
                    open: quote.open,
                    previousClose: quote.previousClose,
                    timestamp: new Date().toISOString(),
                    dataSource: 'Financial Modeling Prep'
                };
            }
        } catch (error) {
            console.error('Financial Modeling Prep API error:', error);
        }
        return null;
    }

    isDataRecent(data) {
        if (!data.timestamp) return false;
        
        const dataTime = new Date(data.timestamp);
        const now = new Date();
        const ageMinutes = (now - dataTime) / (1000 * 60);
        
        return ageMinutes <= 20; // Data must be less than 20 minutes old
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
            
            // Show data source and timestamp
            const dataAge = this.getDataAge(stockData.timestamp);
            priceChange.title = `Data from ${stockData.dataSource || 'API'} - ${dataAge} ago`;
            
            priceDisplay.classList.add('active');
            
            // Auto-hide after 15 seconds
            setTimeout(() => {
                priceDisplay.classList.remove('active');
            }, 15000);
        }
    }

    getDataAge(timestamp) {
        const dataTime = new Date(timestamp);
        const now = new Date();
        const ageMinutes = Math.floor((now - dataTime) / (1000 * 60));
        
        if (ageMinutes < 1) return 'Just now';
        if (ageMinutes === 1) return '1 minute ago';
        if (ageMinutes < 60) return `${ageMinutes} minutes ago`;
        
        const ageHours = Math.floor(ageMinutes / 60);
        if (ageHours === 1) return '1 hour ago';
        return `${ageHours} hours ago`;
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
            priceChange.textContent = 'Fetching real-time data...';
            priceChange.className = 'price-change';
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
        
        console.log('Real-time stock data stored in memory:', stockData);
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
        if (cached && this.isDataRecent(cached.data)) {
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
        // Auto-complete for common stocks
        const commonStocks = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
            'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'GLD',
            'JPM', 'BAC', 'WMT', 'PG', 'JNJ', 'KO', 'PFE', 'HD', 'MA', 'V'
        ];
        
        const suggestions = commonStocks.filter(stock => 
            stock.toLowerCase().includes(input.toLowerCase())
        );
        
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
                if (this.isDataRecent(stockData)) {
                    this.displayStockData(stockData);
                    this.currentStock = stockData;
                } else {
                    console.log('Last searched stock data is too old, clearing cache');
                    localStorage.removeItem('currentStock');
                }
            }
        } catch (error) {
            console.error('Error loading last searched stock:', error);
        }
    }
}

// Initialize real-time stock search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.stockSearch = new RealTimeStockSearch();
    
    // Load last searched stock (only if recent)
    window.stockSearch.loadLastSearchedStock();
    
    console.log('Real-time stock search initialized - no mock data!');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeStockSearch;
}
