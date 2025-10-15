/**
 * MCP Stock Prices Client for BrightFlow
 * Connects to the MCP Stock Prices Server to get real-time stock data
 */

class MCPStockClient {
    constructor(serverEndpoint = 'http://localhost:8000') {
        this.serverEndpoint = serverEndpoint;
        this.requestId = 1;
    }

    /**
     * Send an MCP request to the server
     */
    async sendMCPRequest(method, params = {}) {
        const request = {
            jsonrpc: "2.0",
            id: this.requestId++,
            method: method,
            params: params
        };

        try {
            const response = await fetch(this.serverEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.result;

        } catch (error) {
            console.error('MCP request failed:', error);
            return { error: `Connection failed: ${error.message}` };
        }
    }

    /**
     * Get current price for a stock ticker
     */
    async getCurrentPrice(ticker) {
        return await this.sendMCPRequest('tools/call', {
            name: 'get_current_price',
            arguments: { ticker: ticker.toUpperCase() }
        });
    }

    /**
     * Get historical prices for a date range
     */
    async getHistoricalPrices(ticker, startDate, endDate, adjusted = true) {
        return await this.sendMCPRequest('tools/call', {
            name: 'get_prices',
            arguments: {
                ticker: ticker.toUpperCase(),
                start: startDate,
                end: endDate,
                adjusted: adjusted
            }
        });
    }

    /**
     * Get available tools from the server
     */
    async getAvailableTools() {
        return await this.sendMCPRequest('tools/list');
    }
}

/**
 * Enhanced Stock Search for BrightFlow
 * Integrates with MCP Stock Prices Server
 */
class EnhancedStockSearch {
    constructor() {
        this.mcpClient = new MCPStockClient();
        this.searchInput = document.getElementById('stock-search');
        this.resultsContainer = document.getElementById('search-results');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        this.initializeSearch();
    }

    initializeSearch() {
        if (!this.searchInput) {
            console.warn('Stock search input not found');
            return;
        }

        // Add search functionality
        this.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 500));
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Create results container if it doesn't exist
        if (!this.resultsContainer) {
            this.createResultsContainer();
        }

        console.log('Enhanced stock search initialized with MCP integration');
    }

    createResultsContainer() {
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.id = 'search-results';
        this.resultsContainer.className = 'search-results';
        this.resultsContainer.innerHTML = `
            <div id="loading-indicator" class="loading-indicator" style="display: none;">
                <div class="spinner"></div>
                <span>Fetching stock data...</span>
            </div>
            <div id="results-list" class="results-list"></div>
        `;

        // Insert after the search input
        this.searchInput.parentNode.insertBefore(this.resultsContainer, this.searchInput.nextSibling);
        this.loadingIndicator = document.getElementById('loading-indicator');
    }

    async handleSearch() {
        const ticker = this.searchInput.value.trim();
        
        if (!ticker || ticker.length < 1) {
            this.hideResults();
            return;
        }

        this.showLoading();

        try {
            // Get current price from MCP server
            const priceData = await this.mcpClient.getCurrentPrice(ticker);
            
            if (priceData.error) {
                this.showError(`Error: ${priceData.error}`);
            } else if (priceData.success) {
                this.displayStockData(priceData);
            } else {
                this.showError('No data found for this ticker');
            }

        } catch (error) {
            console.error('Search error:', error);
            this.showError('Failed to fetch stock data');
        } finally {
            this.hideLoading();
        }
    }

    displayStockData(data) {
        const resultsList = document.getElementById('results-list');
        if (!resultsList) return;

        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';

        resultsList.innerHTML = `
            <div class="stock-result">
                <div class="stock-header">
                    <h3>${data.ticker}</h3>
                    <span class="source">via ${data.source}</span>
                </div>
                <div class="stock-price">
                    <span class="current-price">$${data.price.toFixed(2)}</span>
                    <span class="change ${changeClass}">
                        ${changeSymbol}${data.change.toFixed(2)} (${changeSymbol}${data.change_percent.toFixed(2)}%)
                    </span>
                </div>
                <div class="stock-date">
                    Last updated: ${data.date}
                </div>
                <button onclick="window.enhancedStockSearch.getHistoricalData('${data.ticker}')" 
                        class="historical-btn">
                    View Historical Data
                </button>
            </div>
        `;

        this.showResults();
    }

    async getHistoricalData(ticker) {
        this.showLoading();

        try {
            // Get last 30 days of data
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const historicalData = await this.mcpClient.getHistoricalPrices(ticker, startDate, endDate);

            if (historicalData.error) {
                this.showError(`Error: ${historicalData.error}`);
            } else if (historicalData.success) {
                this.displayHistoricalData(historicalData);
            } else {
                this.showError('No historical data available');
            }

        } catch (error) {
            console.error('Historical data error:', error);
            this.showError('Failed to fetch historical data');
        } finally {
            this.hideLoading();
        }
    }

    displayHistoricalData(data) {
        const resultsList = document.getElementById('results-list');
        if (!resultsList || !data.data) return;

        let tableRows = '';
        data.data.slice(-10).forEach(record => {  // Show last 10 days
            const changeClass = record.change >= 0 ? 'positive' : 'negative';
            const changeSymbol = record.change >= 0 ? '+' : '';

            tableRows += `
                <tr>
                    <td>${record.date}</td>
                    <td>$${record.close.toFixed(2)}</td>
                    <td class="${changeClass}">
                        ${changeSymbol}${record.change.toFixed(2)}
                    </td>
                    <td class="${changeClass}">
                        ${changeSymbol}${record.change_percent.toFixed(2)}%
                    </td>
                    <td>${record.volume.toLocaleString()}</td>
                </tr>
            `;
        });

        resultsList.innerHTML = `
            <div class="historical-data">
                <div class="historical-header">
                    <h3>${data.ticker} - Historical Data (Last 10 Days)</h3>
                    <span class="source">via ${data.data[0]?.source}</span>
                </div>
                <table class="historical-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Close</th>
                            <th>Change</th>
                            <th>Change %</th>
                            <th>Volume</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <button onclick="window.enhancedStockSearch.backToSearch()" class="back-btn">
                    Back to Search
                </button>
            </div>
        `;
    }

    backToSearch() {
        this.hideResults();
        this.searchInput.focus();
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }

    showResults() {
        if (this.resultsContainer) {
            this.resultsContainer.style.display = 'block';
        }
    }

    hideResults() {
        if (this.resultsContainer) {
            this.resultsContainer.style.display = 'none';
        }
    }

    showError(message) {
        const resultsList = document.getElementById('results-list');
        if (resultsList) {
            resultsList.innerHTML = `
                <div class="error-message">
                    <span class="error-icon">⚠️</span>
                    <span>${message}</span>
                </div>
            `;
            this.showResults();
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize enhanced stock search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedStockSearch = new EnhancedStockSearch();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MCPStockClient, EnhancedStockSearch };
}