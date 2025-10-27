/**
 * Fast Stock Search - Using Multiple Reliable Sources
 * Faster and more reliable than the previous version
 */

class FastStockSearch {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
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
            const stockData = await this.fetchStockData(symbol);
            if (stockData) {
                this.displayStockData(stockData);
                this.storeInMemory(stockData);
                this.addToWatchlist(stockData);
            } else {
                this.showError('Unable to fetch data for ' + symbol);
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
            console.log('Using cached data for', symbol);
            return cached;
        }

        console.log('Fetching fresh data for', symbol);

        // Try multiple fast APIs - NO FALLBACK DATA, ONLY REAL DATA
        const apis = [
            () => this.fetchFromYahooFinanceFast(symbol),
            () => this.fetchFromAlphaVantageFast(symbol),
            () => this.fetchFromIEXCloudFast(symbol)
            // REMOVED: getFallbackData() - we only want real, up-to-date data
        ];

        for (const api of apis) {
            try {
                console.log('Trying API for', symbol);
                const data = await api();
                if (data) {
                    console.log('Got data for', symbol);
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

    async fetchFromYahooFinanceFast(symbol) {
        try {
            // Using a faster, more reliable method
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
            
            // Use a different CORS proxy that's faster
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            
            const response = await fetch(proxyUrl + encodeURIComponent(url), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                timeout: 5000 // 5 second timeout
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

    async fetchFromAlphaVantageFast(symbol) {
        try {
            // Using demo API key with timeout
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(url, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
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

    async fetchFromIEXCloudFast(symbol) {
        try {
            // IEX Cloud with timeout
            const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=pk_test_1234567890abcdef`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(url, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
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

    // DISABLED: Fallback mock data - ONLY USE REAL API DATA
    // We do not want outdated mock data showing instead of real market prices
    /*
    getFallbackData(symbol) {
        // Enhanced fallback data with more realistic values
        const fallbackData = {
            'AAPL': { price: 175.43, change: 2.34, changePercent: 1.35, volume: 45000000 },
            'MSFT': { price: 332.89, change: -1.23, changePercent: -0.37, volume: 25000000 },
            'GOOGL': { price: 138.21, change: 0.87, changePercent: 0.63, volume: 18000000 },
            'AMZN': { price: 127.74, change: 3.21, changePercent: 2.58, volume: 22000000 },
            'TSLA': { price: 248.50, change: -4.12, changePercent: -1.63, volume: 35000000 },
            'META': { price: 501.25, change: -2.10, changePercent: -0.42, volume: 15000000 },
            'NVDA': { price: 889.45, change: 5.67, changePercent: 0.64, volume: 28000000 },
            'NFLX': { price: 485.73, change: 8.45, changePercent: 1.77, volume: 12000000 },
            'SPY': { price: 428.67, change: 1.23, changePercent: 0.29, volume: 45000000 },
            'QQQ': { price: 372.14, change: 2.87, changePercent: 0.78, volume: 35000000 },
            'JPM': { price: 145.32, change: 0.89, changePercent: 0.62, volume: 12000000 },
            'BAC': { price: 28.45, change: -0.12, changePercent: -0.42, volume: 18000000 },
            'WMT': { price: 165.78, change: 1.23, changePercent: 0.75, volume: 8000000 },
            'JNJ': { price: 158.92, change: -0.45, changePercent: -0.28, volume: 6000000 },
            'KO': { price: 58.34, change: 0.23, changePercent: 0.40, volume: 9000000 }
        };

        if (fallbackData[symbol]) {
            const data = fallbackData[symbol];
            return {
                symbol: symbol,
                price: data.price,
                change: data.change,
                changePercent: data.changePercent,
                volume: data.volume,
                high: data.price * 1.02,
                low: data.price * 0.98,
                open: data.price - data.change,
                previousClose: data.price - data.change,
                timestamp: new Date().toISOString(),
                dataSource: 'Fallback Data'
            };
        }
        return null;
    }
    */

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
            
            // Show data source
            priceChange.title = `Data from ${stockData.dataSource || 'API'}`;
            
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
            priceChange.textContent = 'Fetching data...';
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
                this.displayStockData(stockData);
                this.currentStock = stockData;
            }
        } catch (error) {
            console.error('Error loading last searched stock:', error);
        }
    }
}

// Initialize fast stock search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.stockSearch = new FastStockSearch();
    
    // Load last searched stock
    window.stockSearch.loadLastSearchedStock();
    
    console.log('Fast stock search initialized!');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FastStockSearch;
}
