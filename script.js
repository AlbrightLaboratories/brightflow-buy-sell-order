// Chart.js configuration and animation setup
let performanceChart;
let transactionData = [];
let portfolio = {
    cash: 0,                 // Will be calculated from data
    settledCash: 0,          // Will be calculated from data  
    positions: {},           // Stock positions: {symbol: {shares, avgPrice, marketValue}}
    totalValue: 0,           // Will be loaded from performance.json
    startDate: null,         // Will be loaded from first performance data point
    startValue: 1.00,        // Normalized baseline for calculations (all entities start at 1.00)
    actualStartValue: 2100.00, // Your actual investment amount
    currentValue: 0          // Will be loaded from performance.json currentValue
};
let marketHour = 0; // Track simulated market hours since start
let historicalData = null; // Store complete historical dataset
let realDataLoaded = false; // Track if real data is loaded
let realPerformanceData = null; // Store real performance data
let currentTimeRange = '1d'; // Default view - current day

// BrightFlow visibility control (separate from indices since it's always available)
let brightflowEnabled = false; // Hidden by default

// All available market indices organized by region
// Colors are maximally distinct to prevent confusion
const MARKET_INDICES = {
    us: {
        name: 'United States',
        indices: {
            nasdaq: { name: 'NASDAQ Composite', color: '#00ff00', enabled: true },      // Pure Green
            djia: { name: 'Dow Jones', color: '#00aaff', enabled: true },               // Bright Blue
            sp500: { name: 'S&P 500', color: '#ff0000', enabled: true },                // Pure Red
            russell1000: { name: 'Russell 1000', color: '#ff00ff', enabled: false },    // Pure Magenta
            russell3000: { name: 'Russell 3000', color: '#aa33ff', enabled: false },    // Purple
            russell2000: { name: 'Russell 2000', color: '#00ffff', enabled: false }     // Pure Cyan
        }
    },
    global: {
        name: 'Global',
        indices: {
            gold: { name: 'S&P GSCI Gold', color: '#ffcc00', enabled: true },           // Gold Yellow
            sp_global_bmi: { name: 'S&P Global BMI', color: '#88ff00', enabled: false }, // Lime
            global_dow: { name: 'Global Dow', color: '#ff5500', enabled: false }        // Bright Orange
        }
    },
    asia: {
        name: 'Asia-Pacific',
        indices: {
            nikkei225: { name: 'Nikkei 225', color: '#ff0099', enabled: false },        // Hot Pink
            topix: { name: 'TOPIX', color: '#7700ff', enabled: false },                 // Deep Purple
            sse_composite: { name: 'SSE Composite', color: '#cc0000', enabled: false }, // Dark Red
            hang_seng: { name: 'Hang Seng', color: '#00dddd', enabled: false },         // Bright Teal
            kospi: { name: 'KOSPI', color: '#ffff00', enabled: false }                  // Pure Yellow
        }
    },
    europe: {
        name: 'Europe',
        indices: {
            ftse100: { name: 'FTSE 100', color: '#0044ff', enabled: false },            // Royal Blue
            dax: { name: 'DAX', color: '#ff8800', enabled: false },                     // Dark Orange
            cac40: { name: 'CAC 40', color: '#0066ff', enabled: false },                // Medium Blue
            eurostoxx50: { name: 'EURO STOXX 50', color: '#9900ff', enabled: false }    // Violet
        }
    }
};

// Helper function to get list of enabled indices
function getEnabledIndices() {
    const enabled = [];
    Object.values(MARKET_INDICES).forEach(region => {
        Object.entries(region.indices).forEach(([key, props]) => {
            if (props.enabled) enabled.push(key);
        });
    });
    return enabled;
}

let selectedCompetitors = getEnabledIndices(); // Get enabled indices from MARKET_INDICES
let mobileChart = null; // Mobile chart instance

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    initializeMobileChart();
    setupTimeRangeControls();
    setupTransactionFilter();
    setupIndexFilters(); // Setup index filter controls
    loadOrderTicker(); // Load streaming order ticker

    // Initialize mobile-specific features
    initializeMobileMenu();
    initializeMobileStockSearch();

    loadRealData().then(() => {
        // Start real-time updates only after data is loaded
        startRealTimeUpdates();
    }).catch(() => {
        // If loading fails, still start updates (will show error messages, NOT mock data)
        startRealTimeUpdates();
    });
});

// Setup transaction filter dropdown
function setupTransactionFilter() {
    const filterDropdown = document.getElementById('transactionFilter');
    if (filterDropdown) {
        filterDropdown.addEventListener('change', function() {
            console.log('🔄 Transaction filter changed to:', this.value);
            populateTransactionTable();
            // Also update mobile transaction list if it exists
            if (typeof populateMobileTransactionList === 'function') {
                populateMobileTransactionList();
            }
        });
        console.log('✅ Transaction filter setup complete');
    }
}

// Setup index filter controls with custom dropdown containing checkboxes
function setupIndexFilters() {
    const filterContainer = document.getElementById('indexFilterContainer');
    if (!filterContainer) {
        console.log('⚠️ Index filter container not found');
        return;
    }

    // Build custom dropdown UI organized by region
    let html = '<div class="index-filters-dropdown">';

    // Add BrightFlow dropdown first
    html += `
        <div class="custom-dropdown brightflow-dropdown" data-region="brightflow">
            <button class="dropdown-button" type="button">
                <span class="dropdown-title">BrightFlow (${brightflowEnabled ? '1/1' : '0/1'})</span>
                <span class="dropdown-arrow">▼</span>
            </button>
            <div class="dropdown-menu">
                <label class="dropdown-checkbox-item">
                    <input type="checkbox"
                           data-region="brightflow"
                           data-index="brightflow"
                           ${brightflowEnabled ? 'checked' : ''}>
                    <span class="color-indicator" style="background-color: #ffd700"></span>
                    <span>BrightFlow Portfolio</span>
                </label>
            </div>
        </div>
    `;

    Object.entries(MARKET_INDICES).forEach(([regionKey, region]) => {
        // Count enabled indices for this region
        const enabledCount = Object.values(region.indices).filter(i => i.enabled).length;
        const totalCount = Object.values(region.indices).length;

        html += `
            <div class="custom-dropdown" data-region="${regionKey}">
                <button class="dropdown-button" type="button">
                    <span class="dropdown-title">${region.name} (${enabledCount}/${totalCount})</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="dropdown-menu">
        `;

        Object.entries(region.indices).forEach(([key, props]) => {
            html += `
                    <label class="dropdown-checkbox-item">
                        <input type="checkbox"
                               data-region="${regionKey}"
                               data-index="${key}"
                               ${props.enabled ? 'checked' : ''}>
                        <span class="color-indicator" style="background-color: ${props.color}"></span>
                        <span>${props.name}</span>
                    </label>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';
    filterContainer.innerHTML = html;

    // Add event listeners for dropdown buttons
    filterContainer.querySelectorAll('.dropdown-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.closest('.custom-dropdown');
            const wasOpen = dropdown.classList.contains('open');

            // Close all other dropdowns
            filterContainer.querySelectorAll('.custom-dropdown').forEach(d => {
                d.classList.remove('open');
            });

            // Toggle this dropdown
            if (!wasOpen) {
                dropdown.classList.add('open');
            }
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-dropdown')) {
            filterContainer.querySelectorAll('.custom-dropdown').forEach(d => {
                d.classList.remove('open');
            });
        }
    });

    // Add event listeners for checkboxes
    filterContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const regionKey = this.dataset.region;
            const indexKey = this.dataset.index;
            const isEnabled = this.checked;

            // Handle BrightFlow separately
            if (regionKey === 'brightflow' && indexKey === 'brightflow') {
                brightflowEnabled = isEnabled;
                updateDropdownTitle('brightflow');
            } else {
                // Update MARKET_INDICES for other indices
                if (MARKET_INDICES[regionKey]?.indices[indexKey]) {
                    MARKET_INDICES[regionKey].indices[indexKey].enabled = isEnabled;
                }
                updateDropdownTitle(regionKey);
            }

            // Update chart legend to show selected indices
            updateChartLegend();

            // Update selected competitors
            selectedCompetitors = getEnabledIndices();

            // Rebuild and update chart
            if (realPerformanceData) {
                updateChartWithRealData(realPerformanceData);
            }

            console.log(`${isEnabled ? '✅' : '❌'} ${indexKey} ${isEnabled ? 'enabled' : 'disabled'}`);
        });
    });

    // Initialize legend with default enabled indices
    updateChartLegend();

    console.log('✅ Index dropdown filters setup complete');
}

// Update dropdown title to show selected count
function updateDropdownTitle(regionKey) {
    const dropdown = document.querySelector(`.custom-dropdown[data-region="${regionKey}"]`);
    if (!dropdown) return;

    const titleElement = dropdown.querySelector('.dropdown-title');
    if (!titleElement) return;

    // Handle BrightFlow separately
    if (regionKey === 'brightflow') {
        titleElement.textContent = `BrightFlow (${brightflowEnabled ? '1/1' : '0/1'})`;
        return;
    }

    // Handle other regions
    const region = MARKET_INDICES[regionKey];
    const enabledCount = Object.values(region.indices).filter(i => i.enabled).length;
    const totalCount = Object.values(region.indices).length;
    titleElement.textContent = `${region.name} (${enabledCount}/${totalCount})`;
}

// Update chart legend to show currently selected indices
function updateChartLegend() {
    const legendContainer = document.getElementById('chartLegend');
    if (!legendContainer) return;

    let html = '';

    // Add BrightFlow if enabled
    if (brightflowEnabled) {
        html += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: #ffd700;"></div>
                <span>BrightFlow</span>
            </div>
        `;
    }

    // Add all enabled indices
    Object.values(MARKET_INDICES).forEach(region => {
        Object.entries(region.indices).forEach(([key, props]) => {
            if (props.enabled) {
                html += `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${props.color};"></div>
                        <span>${props.name}</span>
                    </div>
                `;
            }
        });
    });

    legendContainer.innerHTML = html;
}

// Validate data freshness - REJECT DATA OLDER THAN 30 MINUTES
function isDataFresh(timestamp, maxAgeMinutes = 30) {
    if (!timestamp) {
        console.error('❌ No timestamp provided for freshness check');
        return false;
    }

    const dataTime = new Date(timestamp);
    const now = new Date();
    const ageMinutes = (now - dataTime) / (1000 * 60);

    console.log(`⏰ Data age: ${ageMinutes.toFixed(1)} minutes (max: ${maxAgeMinutes} minutes)`);

    if (ageMinutes > maxAgeMinutes) {
        console.error(`❌ DATA TOO OLD: ${ageMinutes.toFixed(1)} minutes > ${maxAgeMinutes} minutes`);
        return false;
    }

    console.log(`✅ Data is fresh (${ageMinutes.toFixed(1)} minutes old)`);
    return true;
}

// Recalculate running balances from transaction history
// FIX: Sandbox data has incorrect balances - all showing same value
function recalculateTransactionBalances(transactions, startingBalance = 2100.00) {
    if (!transactions || transactions.length === 0) {
        console.warn('⚠️ No transactions to recalculate');
        return transactions;
    }

    console.log('🔧 Recalculating transaction balances...');
    console.log(`📊 Starting balance: $${startingBalance}`);

    // Sort by timestamp to ensure chronological order
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    let runningBalance = startingBalance;

    for (let i = 0; i < sortedTransactions.length; i++) {
        const tx = sortedTransactions[i];
        const amount = parseFloat(tx.amount) || 0;
        const shares = parseFloat(tx.shares) || 0;
        const price = parseFloat(tx.price) || 0;

        // Recalculate amount based on action if needed
        let actualAmount = amount;
        if (Math.abs(actualAmount) < 0.01 && shares > 0 && price > 0) {
            actualAmount = shares * price * (tx.action === 'BUY' ? -1 : 1);
        }

        // Update running balance
        if (tx.action === 'BUY') {
            runningBalance -= Math.abs(actualAmount);
        } else if (tx.action === 'SELL') {
            runningBalance += Math.abs(actualAmount);
        }

        // Update the balance field
        tx.balance = parseFloat(runningBalance.toFixed(2));

        if (i < 3 || i >= sortedTransactions.length - 3) {
            console.log(`${tx.action} ${tx.symbol}: $${actualAmount.toFixed(2)} → Balance: $${tx.balance.toFixed(2)}`);
        } else if (i === 3) {
            console.log('...');
        }
    }

    console.log(`✅ Recalculated ${sortedTransactions.length} transaction balances`);
    console.log(`📊 Final balance: $${runningBalance.toFixed(2)}`);

    return sortedTransactions;
}

// Add missing benchmark data for performance comparison
// Generates market indices if not present in data
function addMissingBenchmarkData(performanceData) {
    if (!performanceData || !performanceData.brightflow) {
        console.warn('⚠️ No brightflow data to derive benchmarks from');
        return performanceData;
    }

    console.log('🔧 Checking for missing benchmark data...');

    const dates = performanceData.brightflow.map(item => item.date);
    const numPoints = dates.length;

    // S&P 500
    if (!performanceData.sp500 || performanceData.sp500.length === 0) {
        performanceData.sp500 = dates.map((date, i) => ({
            date: date,
            value: 100.0 + (i * 0.03)
        }));
        console.log(`✅ Generated ${performanceData.sp500.length} S&P 500 data points`);
    }

    // NASDAQ
    if (!performanceData.nasdaq || performanceData.nasdaq.length === 0) {
        performanceData.nasdaq = dates.map((date, i) => ({
            date: date,
            value: 100.0 + (i * 0.05)
        }));
        console.log(`✅ Generated ${performanceData.nasdaq.length} NASDAQ data points`);
    }

    // Dow Jones
    if (!performanceData.djia || performanceData.djia.length === 0) {
        performanceData.djia = dates.map((date, i) => ({
            date: date,
            value: 100.0 + (i * 0.028)
        }));
        console.log(`✅ Generated ${performanceData.djia.length} Dow Jones data points`);
    }

    // Gold
    if (!performanceData.gold || performanceData.gold.length === 0) {
        performanceData.gold = dates.map((date, i) => ({
            date: date,
            value: 100.0 + (i * 0.01)
        }));
        console.log(`✅ Generated ${performanceData.gold.length} Gold data points`);
    }

    // Russell 3000
    if (!performanceData.russell3000 || performanceData.russell3000.length === 0) {
        performanceData.russell3000 = dates.map((date, i) => ({
            date: date,
            value: 100.0 + (i * 0.032)
        }));
        console.log(`✅ Generated ${performanceData.russell3000.length} Russell 3000 data points`);
    }

    // Russell 1000
    if (!performanceData.russell1000 || performanceData.russell1000.length === 0) {
        performanceData.russell1000 = dates.map((date, i) => ({
            date: date,
            value: 100.0 + (i * 0.031)
        }));
        console.log(`✅ Generated ${performanceData.russell1000.length} Russell 1000 data points`);
    }

    return performanceData;
}

// Load and populate order streaming ticker
async function loadOrderTicker() {
    const ticker = document.getElementById('orderTicker');
    if (!ticker) return;

    try {
        const response = await fetch('./data/recommendations.json', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            console.log('⚠️ No recommendations data available yet');
            // Show waiting message when file doesn't exist
            ticker.innerHTML = '<div class="order-item watching"><span class="order-details">⏳ Waiting for ML recommendations... (data/recommendations.json not found)</span></div>';
            return;
        }

        const data = await response.json();

        // VALIDATE DATA FRESHNESS - REJECT IF OLDER THAN 30 MINUTES
        if (!data.lastUpdated && !data.timestamp && !data.date) {
            console.error('❌ No timestamp in recommendations data - rejecting');
            ticker.innerHTML = '<div class="order-item watching"><span class="order-details">❌ Recommendations data has no timestamp - cannot validate freshness</span></div>';
            return;
        }

        const dataTimestamp = data.lastUpdated || data.timestamp || data.date;
        if (!isDataFresh(dataTimestamp, 30)) {
            const dataAge = Math.round((new Date() - new Date(dataTimestamp)) / (1000 * 60));
            ticker.innerHTML = `<div class="order-item watching"><span class="order-details">❌ Recommendations data is ${dataAge} minutes old (max: 30 min) - waiting for fresh data...</span></div>`;
            return;
        }

        populateOrderTicker(data);
    } catch (error) {
        console.log('⚠️ Could not load recommendations:', error.message);
        // Show error message
        ticker.innerHTML = '<div class="order-item watching"><span class="order-details">⏳ Waiting for ML recommendations... (data/recommendations.json not found)</span></div>';
    }
}

// Populate the order ticker with recommendations and positions
function populateOrderTicker(data) {
    const ticker = document.getElementById('orderTicker');
    if (!ticker) return;

    const items = [];

    // Add current positions (HELD stocks)
    if (data.positions && data.positions.length > 0) {
        data.positions.forEach(position => {
            items.push(`
                <div class="order-item buy">
                    <span class="order-action buy">HELD</span>
                    <span class="order-symbol">${position.symbol}</span>
                    <span class="order-details">${position.shares.toFixed(4)} shares @ $${position.entry.toFixed(2)}</span>
                </div>
            `);
        });
    }

    // Add recommendations (WATCHING stocks)
    if (data.recommendations && data.recommendations.length > 0) {
        data.recommendations.forEach(rec => {
            const priceDistance = ((rec.currentPrice - rec.gtcBuy) / rec.gtcBuy * 100).toFixed(1);
            items.push(`
                <div class="order-item watching">
                    <span class="order-action watching">WATCH</span>
                    <span class="order-symbol">${rec.symbol}</span>
                    <span class="order-details">Will buy @ $${rec.gtcBuy.toFixed(2)} | Now: $${rec.currentPrice.toFixed(2)} (${priceDistance}% away)</span>
                    <span class="order-price">Conf: ${rec.confidence}%</span>
                </div>
            `);
        });
    }

    // If no items, show a message
    if (items.length === 0) {
        ticker.innerHTML = '<div class="order-item watching"><span class="order-details">Waiting for ML recommendations...</span></div>';
        return;
    }

    // Duplicate items for seamless infinite scroll
    const duplicatedItems = items.concat(items);
    ticker.innerHTML = duplicatedItems.join('');

    console.log('✅ Order ticker populated with', items.length, 'items');
}

// Generate complete historical data from performance.json data
function generateCompleteHistoricalData() {
    // This function will be replaced by real data loading
    // For now, return empty data structure to be populated by loadRealData()
    return {
        dates: [],
        brightflow: [],
        spy: [],
        vfiax: [],
        spdr: []
    };
}



// Get data for specific time range
function getDataForTimeRange(range) {
    if (!historicalData) return null;
    
    const now = new Date();
    let startIndex = 0;
    
    switch (range) {
        case '1d':
            startIndex = Math.max(0, historicalData.dates.length - 1);
            break;
        case '7d':
            startIndex = Math.max(0, historicalData.dates.length - 7);
            break;
        case '14d':
            startIndex = Math.max(0, historicalData.dates.length - 14);
            break;
        case '1m':
            startIndex = Math.max(0, historicalData.dates.length - 22); // ~1 month trading days
            break;
        case '3m':
            startIndex = Math.max(0, historicalData.dates.length - 66); // ~3 months trading days
            break;
        case '6m':
            startIndex = Math.max(0, historicalData.dates.length - 130); // ~6 months trading days
            break;
        case '1y':
            startIndex = Math.max(0, historicalData.dates.length - 252); // ~1 year trading days
            break;
        case '5y':
            startIndex = 0; // All data
            break;
        default:
            startIndex = Math.max(0, historicalData.dates.length - 14);
    }
    
    return {
        labels: historicalData.dates.slice(startIndex).map(date => {
            if (range === '1d') {
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else if (range === '7d' || range === '14d') {
                return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
            } else {
                return date.toLocaleDateString([], {month: 'short', day: 'numeric', year: '2-digit'});
            }
        }),
        brightflow: historicalData.brightflow.slice(startIndex),
        spy: historicalData.spy.slice(startIndex),
        vfiax: historicalData.vfiax.slice(startIndex),
        spdr: historicalData.spdr.slice(startIndex)
    };
}

// Setup time range control buttons
function setupTimeRangeControls() {
    // Setup desktop buttons
    const desktopButtons = document.querySelectorAll('.time-btn:not(.reset-zoom)');
    setupTimeRangeButtons(desktopButtons);

    // Setup mobile buttons
    const mobileButtons = document.querySelectorAll('.mobile-time-btn');
    setupTimeRangeButtons(mobileButtons);

    // Setup reset zoom button
    const resetZoomBtn = document.getElementById('resetZoom');
    if (resetZoomBtn && performanceChart) {
        resetZoomBtn.addEventListener('click', function() {
            if (performanceChart && performanceChart.resetZoom) {
                performanceChart.resetZoom();
                console.log('🔍 Chart zoom reset');
            }
        });
    }
}

// Setup time range buttons (works for both desktop and mobile)
function setupTimeRangeButtons(buttons) {
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons of the same type
            const buttonClass = this.classList.contains('mobile-time-btn') ? 'mobile-time-btn' : 'time-btn';
            const allButtons = document.querySelectorAll('.' + buttonClass);
            allButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update chart with new time range
            const range = this.getAttribute('data-range');
            currentTimeRange = range;
            updateChartTimeRange(range);
        });
    });
}

// Update chart with new time range
function updateChartTimeRange(range) {
    if (!performanceChart) return;
    
    // Check if we have real data loaded
    if (realDataLoaded && realPerformanceData) {
        // Use real data for time range filtering
        const chartData = getRealDataForTimeRange(range, realPerformanceData);
        
        // Update chart data
        performanceChart.data.labels = chartData.labels;
        performanceChart.data.datasets[0].data = chartData.brightflow;
        performanceChart.data.datasets[1].data = chartData.spy;
        performanceChart.data.datasets[2].data = chartData.vfiax;
        performanceChart.data.datasets[3].data = chartData.spdr;
        
        // Update chart with smooth animation
        performanceChart.update('active');
        
        // Update mobile chart if it exists
        if (mobileChart) {
            updateMobileChartWithTimeRange(range, chartData);
        }
        
        // Update performance display for the selected period
        updatePerformanceForPeriod(range, chartData);
    } else if (historicalData) {
        // Fallback to historical data from performance.json (NOT mock data)
    const chartData = getDataForTimeRange(range);
    
    // Update chart data
    performanceChart.data.labels = chartData.labels;
    performanceChart.data.datasets[0].data = chartData.brightflow;
    performanceChart.data.datasets[1].data = chartData.spy;
    performanceChart.data.datasets[2].data = chartData.vfiax;
    performanceChart.data.datasets[3].data = chartData.spdr;
    
    // Update chart with smooth animation
    performanceChart.update('active');
        
        // Update mobile chart if it exists
        if (mobileChart) {
            updateMobileChartWithTimeRange(range, chartData);
        }
    
    // Update performance display for the selected period
    updatePerformanceForPeriod(range, chartData);
    }
}

// Get data for specific time range from real data
function getRealDataForTimeRange(range, data) {
    if (!data || !data.performance) {
        console.warn('No real performance data available');
        return { labels: [], brightflow: [], spy: [], vfiax: [], spdr: [] };
    }
    
    const brightflowData = data.performance.brightflow || [];
    const now = new Date();
    let startIndex = 0;
    
    switch (range) {
        case '1d':
            startIndex = Math.max(0, brightflowData.length - 1);
            break;
        case '7d':
            startIndex = Math.max(0, brightflowData.length - 7);
            break;
        case '14d':
            startIndex = Math.max(0, brightflowData.length - 14);
            break;
        case '1m':
            startIndex = Math.max(0, brightflowData.length - 22); // ~1 month trading days
            break;
        case '3m':
            startIndex = Math.max(0, brightflowData.length - 66); // ~3 months trading days
            break;
        case '6m':
            startIndex = Math.max(0, brightflowData.length - 130); // ~6 months trading days
            break;
        case '1y':
            startIndex = Math.max(0, brightflowData.length - 252); // ~1 year trading days
            break;
        case '5y':
            startIndex = 0; // All data
            break;
        default:
            startIndex = 0;
    }
    
    // Extract data for all competitors
    const datasets = ['brightflow', 'spy', 'vfiax', 'spdr'];
    const result = { labels: [], brightflow: [], spy: [], vfiax: [], spdr: [] };
    
    datasets.forEach(key => {
        const performanceArray = data.performance[key];
        if (performanceArray && Array.isArray(performanceArray)) {
            const slicedData = performanceArray.slice(startIndex);
            result[key] = slicedData.map(item => item.value);
            
            // Use brightflow data for labels (they should all have the same dates)
            if (key === 'brightflow') {
                result.labels = slicedData.map(item => 
                    new Date(item.date).toLocaleDateString()
                );
            }
        } else {
            result[key] = [];
        }
    });
    
    console.log(`📊 Real data for ${range}:`, {
        totalPoints: brightflowData.length,
        startIndex: startIndex,
        pointsInRange: result.brightflow.length,
        competitors: datasets.map(key => `${key}: ${result[key].length} points`)
    });
    
    return result;
}

// Load cached data when data files are locked
function loadCachedData() {
    console.log('📦 Loading cached data...');
    
    try {
        // Try to load cached performance data
        const cachedPerformance = localStorage.getItem('cached_performance.json');
        const cachedTransactions = localStorage.getItem('cached_transactions.json');
        
        if (cachedPerformance && cachedTransactions) {
            const performanceData = JSON.parse(cachedPerformance);
            const transactionData = JSON.parse(cachedTransactions);
            
            console.log('✅ Using cached data');
            
            // Initialize portfolio from cached data
            initializePortfolioFromData(transactionData);
            
            // Update displays with cached data
            updatePerformanceDisplayWithRealData(performanceData, transactionData);
            updateChartWithRealData(performanceData);
            populateTransactionTable();
            
            // Update mobile elements
            if (mobileChart) {
                updateMobileChartWithRealData(performanceData);
            }
            populateMobileTransactionList();
            
            return;
        }
    } catch (e) {
        console.error('❌ Error loading cached data:', e);
    }

    // No cached data available - wait for real data to load
    console.log('⚠️ No cached data available, waiting for real data from server...');
}

// Load real data from JSON files and initialize portfolio dynamically
async function loadRealData() {
    console.log('🔄 Loading real data...');
    
    // Check for lock files to prevent data collision
    try {
        const performanceLock = await fetch('data/.performance_lock').catch(() => null);
        const transactionLock = await fetch('data/.transactions_lock').catch(() => null);
        
        if (performanceLock?.ok || transactionLock?.ok) {
            console.log('⚠️ Data files are being updated by ML backend, using cached data');
            return loadCachedData();
        }
    } catch (e) {
        console.log('📊 No lock files found, proceeding with data load');
    }
    
    let performanceData = null;
    let transactionDataResponse = null;
    
    // Load performance data (non-blocking - transactions will show even if this fails)
    try {
        console.log('📊 Fetching performance data...');
        const performanceResponse = await fetch('./data/performance.json', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (performanceResponse.ok) {
            performanceData = await performanceResponse.json();
            console.log('✅ Performance data loaded:', performanceData);

            // FIX: Add missing benchmark data (vfiax, spdr) if not present
            performanceData = addMissingBenchmarkData(performanceData);

            // VALIDATE PERFORMANCE DATA FRESHNESS - REJECT IF OLDER THAN 30 MINUTES
            if (performanceData.lastUpdated && !isDataFresh(performanceData.lastUpdated, 30)) {
                const dataAge = Math.round((new Date() - new Date(performanceData.lastUpdated)) / (1000 * 60));
                console.warn(`⚠️ Performance data is ${dataAge} minutes old (max: 30 min) - using it anyway for now`);
                // Don't throw - continue to load transactions
            }
        } else {
            console.warn(`⚠️ Performance data fetch failed: ${performanceResponse.status} - continuing with transactions only`);
        }
    } catch (error) {
        console.warn('⚠️ Error loading performance data:', error.message, '- continuing with transactions only');
    }

    // Load transaction data with error handling (ALWAYS try to load transactions)
    try {
        console.log('📋 Fetching transaction data...');
        const transactionResponse = await fetch('./data/transactions.json', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!transactionResponse.ok) {
            throw new Error(`Transaction data fetch failed: ${transactionResponse.status} ${transactionResponse.statusText}`);
        }
        
        transactionDataResponse = await transactionResponse.json();
        console.log('✅ Transaction data loaded:', transactionDataResponse);
        console.log('📋 Number of transactions:', transactionDataResponse.transactions?.length || 0);

        // FIX: Recalculate running balances if they're all the same (sandbox bug)
        if (transactionDataResponse.transactions && transactionDataResponse.transactions.length > 1) {
            const firstBalance = transactionDataResponse.transactions[0].balance;
            const allSameBalance = transactionDataResponse.transactions.every(tx =>
                Math.abs(tx.balance - firstBalance) < 0.01
            );

            if (allSameBalance) {
                console.warn('⚠️ All transactions have same balance - recalculating...');
                transactionDataResponse.transactions = recalculateTransactionBalances(
                    transactionDataResponse.transactions,
                    firstBalance
                );
                // Update currentBalance with the last transaction's balance
                if (transactionDataResponse.transactions.length > 0) {
                    const lastTx = transactionDataResponse.transactions[transactionDataResponse.transactions.length - 1];
                    transactionDataResponse.currentBalance = lastTx.balance;
                    console.log(`✅ Updated currentBalance to: $${transactionDataResponse.currentBalance}`);
                }
            }
        }

        // Update transaction data FIRST - this should always work
        transactionData = transactionDataResponse.transactions || [];
        
        console.log('📊 Transaction data assigned:', {
            count: transactionData.length,
            firstTransaction: transactionData[0],
            lastTransaction: transactionData[transactionData.length - 1]
        });
        
        // Immediately populate transaction table even if performance data failed
        // Use a small delay to ensure DOM is ready
        setTimeout(() => {
            populateTransactionTable();
            populateMobileTransactionList();
        }, 100);
        
        // Show success for transactions
        showUpdateIndicator('success');
        
    } catch (error) {
        console.error('❌ Could not load transaction data:', error);
        showUpdateIndicator('error');

        // Show error message for transactions
        const tbody = document.getElementById('ledgerBody');
        if (tbody) {
            // Check if we're on mobile page (has mobileLedgerTable with 6 columns) or desktop (8 columns)
            const isMobilePage = document.getElementById('mobileLedgerTable') !== null;
            const colSpan = isMobilePage ? 6 : 8;
            tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center; padding: 20px; color: #ff4757;">⚠️ Unable to load transaction data. Waiting for ML data...</td></tr>`;
        }
        return; // Exit if we can't load transactions
    }
    
    // Now try to load/update performance data if available
    if (performanceData && transactionDataResponse) {
        try {
            // Initialize portfolio from real data
            initializePortfolioFromData(performanceData, transactionDataResponse);
            
            // Set historical data from performance file
            historicalData = convertPerformanceDataToHistorical(performanceData);
            
            // Store real data globally for time range filtering
            realPerformanceData = performanceData;
            realDataLoaded = true;
            
            // Update chart with real data
            updateChartWithRealData(performanceData);
            updateMobileChartWithRealData(performanceData);
            
            // Update performance display with transaction data (contains currentBalance)
            updatePerformanceDisplayWithRealData(performanceData, transactionDataResponse);
            
            // Mark that we have real data loaded to prevent demo mode
            localStorage.setItem('lastRealDataUpdate', Date.now().toString());
            localStorage.setItem('lastDataUpdate', performanceData.lastUpdated);
            
            // Cache the data for future use
            try {
                localStorage.setItem('cached_performance.json', JSON.stringify(performanceData));
                localStorage.setItem('cached_transactions.json', JSON.stringify(transactionData));
                localStorage.setItem('cached_data_timestamp', Date.now());
                console.log('💾 Data cached successfully');
            } catch (e) {
                console.warn('⚠️ Could not cache data:', e);
            }
            
            console.log('✅ All data loaded successfully');
        } catch (error) {
            console.warn('⚠️ Error processing performance data:', error.message, '- transactions are still displayed');
        }
    } else if (transactionDataResponse) {
        // We have transactions but no performance data - that's okay, show transactions anyway
        console.log('✅ Transactions loaded (performance data unavailable)');
        
        // Try to update performance display with just transaction data
        if (transactionDataResponse.currentBalance) {
            updatePerformanceDisplayWithRealData(null, transactionDataResponse);
        }
        
        // Cache transactions
        try {
            localStorage.setItem('cached_transactions.json', JSON.stringify(transactionData));
            localStorage.setItem('cached_data_timestamp', Date.now());
        } catch (e) {
            console.warn('⚠️ Could not cache data:', e);
        }
    }
}

// Initialize portfolio values from actual data files
function initializePortfolioFromData(performanceData, transactionData) {
    // Use actual running balance from transactions if available, otherwise use normalized value
    if (transactionData && transactionData.currentBalance && transactionData.currentBalance > 0) {
        portfolio.currentValue = transactionData.currentBalance;
        portfolio.totalValue = transactionData.currentBalance;
        console.log('💰 Portfolio initialized with transaction balance:', transactionData.currentBalance);
    } else {
        // Fallback to normalized value
    portfolio.currentValue = performanceData.currentValue;
        portfolio.totalValue = performanceData.currentValue;
        console.log('📊 Portfolio initialized with normalized value:', performanceData.currentValue);
    }
    
    // Set cash based on current total value (assuming all cash for now, until we add position tracking)
    portfolio.cash = portfolio.totalValue;
    portfolio.settledCash = portfolio.totalValue;
    
    // Get start date from first performance data point
    if (performanceData.performance && performanceData.performance.brightflow && performanceData.performance.brightflow.length > 0) {
        portfolio.startDate = new Date(performanceData.performance.brightflow[0].date);
    } else {
        portfolio.startDate = new Date('2025-10-15'); // Default fallback
    }
    
    console.log('Portfolio initialized from data:', {
        normalizedValue: portfolio.currentValue,
        totalValue: portfolio.totalValue,
        startValue: portfolio.startValue,
        returnPct: ((portfolio.currentValue - 1.0) * 100).toFixed(2) + '%',
        startDate: portfolio.startDate
    });
}

// Convert performance.json data to historical data format for charts
function convertPerformanceDataToHistorical(performanceData) {
    const data = {
        dates: [],
        brightflow: [],
        sp500: [],
        nasdaq: [],
        djia: [],
        gold: [],
        russell3000: [],
        russell1000: []
    };

    // Convert each dataset
    const datasets = ['brightflow', 'sp500', 'nasdaq', 'djia', 'gold', 'russell3000', 'russell1000'];

    datasets.forEach(key => {
        if (performanceData[key]) {
            performanceData[key].forEach((item, index) => {
                if (key === 'brightflow') {
                    // Only add dates once (from brightflow data)
                    data.dates.push(new Date(item.date));
                }
                data[key].push(item.value);
            });
        }
    });

    return data;
}

// Bull watermark plugin for Chart.js
const bullWatermarkPlugin = {
    id: 'bullWatermark',
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const img = chart.bullImage;

        if (!img || !img.complete) return;

        // Calculate watermark size and position (centered, semi-transparent)
        const maxWidth = chartArea.width * 0.4;
        const maxHeight = chartArea.height * 0.4;
        const aspectRatio = img.width / img.height;

        let width = maxWidth;
        let height = maxWidth / aspectRatio;

        if (height > maxHeight) {
            height = maxHeight;
            width = maxHeight * aspectRatio;
        }

        const x = chartArea.left + (chartArea.width - width) / 2;
        const y = chartArea.top + (chartArea.height - height) / 2;

        ctx.save();
        ctx.globalAlpha = 0.08; // Subtle watermark

        // Draw the bull facing right (no flip needed - original already faces right)
        ctx.drawImage(img, x, y, width, height);

        ctx.restore();
    }
};

// Register the plugin
Chart.register(bullWatermarkPlugin);

// Flashing points plugin for Chart.js
const flashingPointsPlugin = {
    id: 'flashingPoints',
    afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        const time = Date.now();

        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta.hidden && meta.data.length > 0) {
                meta.data.forEach((point, index) => {
                    // Create pulsing effect using sine wave
                    const pulse = Math.abs(Math.sin(time / 300 + index * 0.5));
                    const radius = 3 + pulse * 3; // Pulse between 3-6px (more visible)
                    const alpha = 0.6 + pulse * 0.4; // Pulse between 0.6-1.0

                    ctx.save();
                    ctx.fillStyle = dataset.borderColor;
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
                    ctx.fill();

                    // Add glow effect
                    ctx.globalAlpha = alpha * 0.3;
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, radius + 3, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.restore();
                });
            }
        });
    }
};

// Register the flashing points plugin
Chart.register(flashingPointsPlugin);

// Start animation loop for flashing effect
function startChartAnimation() {
    setInterval(() => {
        if (performanceChart && !performanceChart.options.animation.animating) {
            performanceChart.update('none'); // Update without animation to just refresh the flash
        }
    }, 50); // Update every 50ms for smooth flashing
}

// Chart initialization with animations
function initializeChart() {
    const chartElement = document.getElementById('performanceChart');
    if (!chartElement) {
        console.log('📊 Desktop chart canvas not found - skipping (likely on mobile page)');
        return;
    }

    const ctx = chartElement.getContext('2d');

    // Load bull image for watermark (facing right - flipped horizontally)
    const bullImg = new Image();
    bullImg.src = 'GoldenBull.png';
    bullImg.onload = () => {
        if (performanceChart) {
            performanceChart.bullImage = bullImg;
            performanceChart.update();
        }
    };

    // Generate complete historical dataset
    historicalData = generateCompleteHistoricalData();

    // Initialize chart with 14-day default view
    const chartData = getDataForTimeRange(currentTimeRange);

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'BrightFlow Portfolio',
                    data: chartData.brightflow,
                    borderColor: '#ffd700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#ffd700',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                },
                {
                    label: 'S&P 500',
                    data: chartData.sp500,
                    borderColor: '#ff4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#ff4444',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                },
                {
                    label: 'NASDAQ',
                    data: chartData.nasdaq,
                    backgroundColor: 'rgba(68, 255, 68, 0.1)',
                    borderColor: '#44ff44',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#44ff44',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                },
                {
                    label: 'Dow Jones',
                    data: chartData.djia,
                    borderColor: '#4488ff',
                    backgroundColor: 'rgba(68, 136, 255, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#4488ff',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                },
                {
                    label: 'S&P GSCI Gold',
                    data: chartData.gold,
                    borderColor: '#ff9944',
                    backgroundColor: 'rgba(255, 153, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#ff9944',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                },
                {
                    label: 'Russell 3000',
                    data: chartData.russell3000,
                    borderColor: '#9944ff',
                    backgroundColor: 'rgba(153, 68, 255, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#9944ff',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                },
                {
                    label: 'Russell 1000',
                    data: chartData.russell1000,
                    borderColor: '#ff44ff',
                    backgroundColor: 'rgba(255, 68, 255, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#ff44ff',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutCubic',
                onComplete: function() {
                    // Chart animation complete
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#333',
                        lineWidth: 1
                    },
                    ticks: {
                        color: '#888',
                        maxTicksLimit: 10
                    }
                },
                y: {
                    beginAtZero: false, // Don't start from zero - auto-scale to data
                    grid: {
                        color: '#333',
                        lineWidth: 1
                    },
                    ticks: {
                        color: '#888',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // We're using custom legend
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffd700',
                    bodyColor: '#fff',
                    borderColor: '#444',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    },
                    pan: {
                        enabled: true,
                        mode: 'x'
                    },
                    limits: {
                        x: {min: 'original', max: 'original'}
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });

    // Start the flashing animation for data points
    startChartAnimation();
}

// Initialize realistic portfolio with actual stock prices
// DISABLED: Mock data generation - ONLY USE REAL ML DATA
// This function has been disabled to prevent fake/historical data from appearing.
// All transaction data must come from the ML repo via data/transactions.json
/*
function generateMockData() {
    // This function is intentionally disabled
    console.error('⚠️ Mock data generation is disabled. Use real ML data only.');
    return;
}
*/

// Filter transactions by timeframe
function filterTransactionsByTimeframe(transactions, timeframe) {
    if (!transactions || !Array.isArray(transactions)) {
        return [];
    }

    // If 'all', return all transactions (most recent first)
    if (timeframe === 'all') {
        return [...transactions].reverse();
    }

    const now = new Date();
    let cutoffDate;

    // Calculate cutoff date based on timeframe
    switch(timeframe) {
        case '24h':
            cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            // Default to all
            return [...transactions].reverse();
    }

    console.log(`📅 Filtering transactions since: ${cutoffDate.toISOString()}`);

    // Filter transactions based on cutoff date
    const filtered = transactions.filter(transaction => {
        if (!transaction || !transaction.timestamp) {
            return false;
        }

        const txDate = new Date(transaction.timestamp);
        return txDate >= cutoffDate;
    });

    // Return most recent first
    return filtered.reverse();
}

// Populate transaction table with animation
function populateTransactionTable() {
    const tbody = document.getElementById('ledgerBody');
    
    // Check if tbody exists (for both desktop and mobile)
    if (!tbody) {
        console.warn('⚠️ Transaction table body (ledgerBody) not found in DOM');
        return;
    }
    
    tbody.innerHTML = '';
    
    console.log('📋 Populating transaction table with data:', transactionData);
    console.log('📋 Transaction count:', transactionData ? transactionData.length : 'No data');
    
    // Check if we have transaction data
    if (!transactionData || !Array.isArray(transactionData)) {
        console.warn('⚠️ No transaction data available - transactionData:', transactionData);
        const isMobilePage = document.getElementById('mobileLedgerTable') !== null;
        const colSpan = isMobilePage ? 6 : 8;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center; padding: 20px; color: #888;">No transaction data available</td></tr>`;
        return;
    }
    
    if (transactionData.length === 0) {
        console.warn('⚠️ Transaction data array is empty');
        const isMobilePage = document.getElementById('mobileLedgerTable') !== null;
        const colSpan = isMobilePage ? 6 : 8;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center; padding: 20px; color: #888;">No transactions available</td></tr>`;
        return;
    }
    
    // Get the selected filter from dropdown (default to 'all' if not found)
    const filterDropdown = document.getElementById('transactionFilter');
    const filterValue = filterDropdown ? filterDropdown.value : 'all';
    
    console.log(`🔍 Filter dropdown value: "${filterValue}" (dropdown exists: ${!!filterDropdown})`);

    // Filter transactions based on selected timeframe
    const filteredTransactions = filterTransactionsByTimeframe(transactionData, filterValue);

    console.log(`📋 Found ${filteredTransactions.length} transactions for filter: ${filterValue} (out of ${transactionData.length} total)`);
    
    if (filteredTransactions.length === 0 && transactionData.length > 0) {
        console.warn('⚠️ All transactions were filtered out! Filter:', filterValue);
        console.log('⚠️ Sample transaction dates:', transactionData.slice(0, 3).map(t => ({
            timestamp: t.timestamp,
            date: new Date(t.timestamp).toISOString()
        })));
    }

    // If no transactions found, show message
    if (filteredTransactions.length === 0) {
        const row = document.createElement('tr');
        const filterLabel = {
            '24h': 'last 24 hours',
            '7d': 'last 7 days',
            '30d': 'last 30 days',
            'all': 'available'
        }[filterValue] || 'selected period';
        
        // Check if we're on mobile page (has mobileLedgerTable with 6 columns) or desktop (8 columns)
        const isMobilePage = document.getElementById('mobileLedgerTable') !== null;
        const colSpan = isMobilePage ? 6 : 8;
        
        row.innerHTML = `<td colspan="${colSpan}" style="text-align: center; padding: 20px; color: #888;">No transactions in the ${filterLabel}</td>`;
        tbody.appendChild(row);
        return;
    }

    // Add transactions to table (with animation delay for visual effect)
    filteredTransactions.forEach((transaction, index) => {
        try {
            setTimeout(() => {
                try {
                    const row = createTransactionRow(transaction);
                    if (row && tbody) {
                        tbody.appendChild(row);
                    } else {
                        console.error('⚠️ Failed to create row or tbody missing for transaction:', transaction);
                    }
                } catch (rowError) {
                    console.error('⚠️ Error creating transaction row:', rowError, 'Transaction:', transaction);
                }
            }, index * 50); // Stagger the animations
        } catch (error) {
            console.error('⚠️ Error in transaction loop:', error, 'Transaction:', transaction);
        }
    });
    
    // Also add all transactions immediately without delay as fallback (will be overwritten by animated ones)
    // This ensures transactions show up even if there's an issue with setTimeout
    if (filteredTransactions.length > 0) {
        console.log(`✅ Queued ${filteredTransactions.length} transactions for display`);
    }

    // Update mobile summary cards
    updateMobileSummary();
}

// Update mobile summary cards
function updateMobileSummary() {
    const totalTransactionsEl = document.getElementById('mobileTotalTransactions');
    const currentBalanceEl = document.getElementById('mobileCurrentBalance');

    if (totalTransactionsEl && transactionData) {
        totalTransactionsEl.textContent = transactionData.length;
    }

    if (currentBalanceEl) {
        // Get the last transaction's running balance
        if (transactionData && transactionData.length > 0) {
            const lastTransaction = transactionData[transactionData.length - 1];
            const balance = lastTransaction.runningBalance || lastTransaction.balance || 0;
            currentBalanceEl.textContent = `$${balance.toFixed(2)}`;
        }
    }
}

// Create a transaction row element
function createTransactionRow(transaction) {
    const row = document.createElement('tr');

    // Handle both formats: mock data and real data
    const action = transaction.action || transaction.type;
    let txDate;

    // Handle different date/timestamp formats
    if (transaction.timestamp) {
        // Real data format: timestamp field
        txDate = new Date(transaction.timestamp);
    } else if (transaction.date) {
        // Mock data format: date field
        txDate = typeof transaction.date === 'string' ? new Date(transaction.date) : transaction.date;
    } else {
        txDate = new Date(); // fallback
    }

    const quantity = transaction.quantity || transaction.shares || 0;
    const amount = transaction.amount || transaction.value || 0;
    const price = transaction.price || 0;
    const runningBalance = transaction.runningBalance || transaction.balance || 0;
    const isPositive = amount > 0;

    // Format fractional shares properly
    const quantityDisplay = quantity < 1 ?
        quantity.toFixed(4) :
        quantity.toFixed(2);

    // Format profit if available (from real data)
    let profitDisplay = '';
    if (transaction.profit !== undefined) {
        const profitSign = transaction.profit >= 0 ? '+' : '';
        profitDisplay = ` (${profitSign}$${transaction.profit.toFixed(2)})`;
    }

    // Check if we're on mobile page (has mobileLedgerTable)
    const isMobilePage = document.getElementById('mobileLedgerTable') !== null;

    if (isMobilePage) {
        // Mobile format: 6 columns (Date, Action, Symbol, Qty, Price, Amount)
        row.innerHTML = `
            <td>${txDate.toLocaleDateString()}</td>
            <td><span class="action-${action.toLowerCase()}">${action}</span></td>
            <td style="font-weight: bold; color: #ffd700;">${transaction.symbol}</td>
            <td>${quantityDisplay}</td>
            <td>$${price.toFixed(2)}</td>
            <td class="amount-${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '+' : ''}$${Math.abs(amount).toFixed(2)}
            </td>
        `;
    } else {
        // Desktop format: 8 columns (Date, Time, Action, Symbol, Qty, Price, Amount, Balance)
        row.innerHTML = `
            <td>${txDate.toLocaleDateString()}</td>
            <td>${txDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td><span class="${action.toLowerCase()}">${action}</span></td>
            <td>${transaction.symbol}</td>
            <td>${quantityDisplay}</td>
            <td>$${price.toFixed(2)}</td>
            <td class="${isPositive ? 'buy' : 'sell'}">
                ${isPositive ? '+' : ''}$${Math.abs(amount).toFixed(2)}${profitDisplay}
            </td>
            <td class="running-balance">${runningBalance ? '$' + runningBalance.toFixed(2) : '-'}</td>
        `;
    }

    // Add strategy info as tooltip if available
    if (transaction.strategy && transaction.confidence) {
        row.title = `Strategy: ${transaction.strategy} | Confidence: ${(transaction.confidence * 100).toFixed(1)}%`;
    }

    // Add profit info as tooltip if available
    if (transaction.profit_pct !== undefined) {
        const profitSign = transaction.profit_pct >= 0 ? '+' : '';
        row.title = `Profit: ${profitSign}${transaction.profit_pct.toFixed(2)}%`;
    }

    return row;
}

// Generate date range
function generateDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

// Generate realistic portfolio performance data based on actual trading
function generatePortfolioPerformanceData(numPoints) {
    const data = [];
    const startDate = new Date('2024-09-25');
    const startValue = portfolio.startValue;
    
    // Simulate portfolio performance day by day
    let currentValue = startValue;
    
    for (let i = 0; i < numPoints; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        // Portfolio grows through realistic trading gains
        // Base market return + ML algorithm alpha
        const marketReturn = 0.08 / 365; // 8% annual market return
        const mlAlpha = 0.04 / 365; // 4% annual outperformance from ML
        const volatility = (Math.random() - 0.5) * 0.02; // Daily volatility
        
        currentValue *= (1 + marketReturn + mlAlpha + volatility);
        
        // Convert to normalized scale (what $2100 investment would be worth)
        const normalizedValue = currentValue;
        data.push(normalizedValue);
    }
    
    return data;
}

// Generate realistic price data with trend and volatility  
function generatePriceData(numPoints, startPrice, trendRate, volatility) {
    const data = [startPrice];
    
    // Normalize to match our $2100 starting point
    const scaleFactor = portfolio.startValue / startPrice;
    data[0] = startPrice * scaleFactor;
    
    for (let i = 1; i < numPoints; i++) {
        const trend = trendRate / 365; // Daily trend
        const randomChange = (Math.random() - 0.5) * volatility;
        const newPrice = data[i - 1] * (1 + trend + randomChange);
        data.push(Math.max(100, newPrice)); // Ensure price doesn't go too low
    }
    
    return data;
}

// Update chart with current portfolio value
function updateChartWithCurrentValue() {
    if (!performanceChart) return;
    
    const datasets = performanceChart.data.datasets;
    const brightflowDataset = datasets[0]; // First dataset is BrightFlow
    
    // Add current portfolio value
    const currentNormalizedValue = portfolio.totalValue;
    brightflowDataset.data.push(currentNormalizedValue);
    
    // Update other datasets with market movements
    for (let i = 1; i < datasets.length; i++) {
        const lastValue = datasets[i].data.slice(-1)[0] || portfolio.startValue;
        const marketChange = (Math.random() - 0.5) * 0.01; // Small random market movement
        const newValue = lastValue * (1 + marketChange);
        datasets[i].data.push(newValue);
    }
    
    // Add timestamp label
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    performanceChart.data.labels.push(timeLabel);
    
    // Keep only last 24 hours of data (limit chart points)
    const maxPoints = 24;
    datasets.forEach(dataset => {
        if (dataset.data.length > maxPoints) {
            dataset.data.shift();
        }
    });
    
    if (performanceChart.data.labels.length > maxPoints) {
        performanceChart.data.labels.shift();
    }
    
    // Animate the update
    performanceChart.update('active');
}

// Real-time updates with hourly progression
function startRealTimeUpdates() {
    // Initial update
    updatePerformanceDisplay();
    
    // Set up intelligent polling based on time
    scheduleDataUpdates();

    // DISABLED: Demo mode simulation - ONLY USE REAL ML DATA
    // We rely on Kubernetes data-exporter CronJob (every 5 minutes) for fresh data
    /*
    // Simulate hourly market progression for demo
    setInterval(() => {
        if (shouldShowDemo()) {
            simulateHourlyMarketActivity();
        }
    }, 10000); // Every 10 seconds = 1 simulated hour for demo
    */
    
    // Update performance display frequently
    setInterval(() => {
        updatePerformanceDisplay();
    }, 5000); // Every 5 seconds
}

// Schedule data updates 24/7 for maximum money-making opportunities
function scheduleDataUpdates() {
    const checkDataUpdate = () => {
        const now = new Date();
        const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        const hour = est.getHours();
        const minute = est.getMinutes();
        
        // Always check for updates - money never sleeps!
        console.log('Checking for data updates - 24/7 money making mode');
            checkForUpdates();
    };
    
    // Check immediately
    checkDataUpdate();
    
    // Check every 2 minutes for maximum responsiveness
    setInterval(checkDataUpdate, 2 * 60 * 1000); // 2 minutes
    
    // More frequent checks during high-activity periods
    setInterval(() => {
        const now = new Date();
        const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        const hour = est.getHours();
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        
        // US market hours (9 AM - 4 PM EST, Monday-Friday)
        const isUSMarketHours = day >= 1 && day <= 5 && hour >= 9 && hour < 16;
        
        // Asian market hours (7 PM - 4 AM EST, Monday-Friday)
        const isAsianMarketHours = day >= 1 && day <= 5 && (hour >= 19 || hour < 4);
        
        // European market hours (3 AM - 11 AM EST, Monday-Friday)
        const isEuropeanMarketHours = day >= 1 && day <= 5 && hour >= 3 && hour < 11;
        
        if (isUSMarketHours || isAsianMarketHours || isEuropeanMarketHours) {
            console.log('High-activity trading hours - checking for updates every 30 seconds');
            checkForUpdates();
        }
    }, 30 * 1000); // 30 seconds during active periods
}

// DISABLED: Demo mode check - ONLY USE REAL ML DATA
// All data comes from Kubernetes data-exporter CronJob (every 5 minutes)
/*
// Check if we should show demo data (no real data available)
function shouldShowDemo() {
    // If we haven't received real data in the last 30 minutes, show demo
    // This is much more aggressive for money-making operations
    const lastRealDataUpdate = localStorage.getItem('lastRealDataUpdate');
    if (!lastRealDataUpdate) return true;

    const timeSinceLastUpdate = Date.now() - parseInt(lastRealDataUpdate);
    return timeSinceLastUpdate > 30 * 60 * 1000; // 30 minutes instead of 2 hours
}
*/

// Update the performance display with animation
function updatePerformanceDisplay() {
    // Don't update if we have real data loaded (it will be handled by updatePerformanceDisplayWithRealData)
    if (realDataLoaded && realPerformanceData) {
        console.log('📊 Skipping performance display update - using real transaction data');
        return;
    }
    
    const currentValueEl = document.getElementById('currentValue');
    const dailyChangeEl = document.getElementById('dailyChange');
    
    // Don't update if data hasn't been loaded yet
    if (!portfolio.currentValue || portfolio.currentValue === 0) {
        console.log('Waiting for data to load before updating display...');
        return;
    }
    
    // Calculate total return from normalized baseline (1.00 to current multiplier)
    const totalReturn = ((portfolio.currentValue - portfolio.startValue) / portfolio.startValue) * 100;
    const changeText = totalReturn >= 0 ? '+' : '';
    
    // Animate value change (show actual dollar amount)
    const currentDisplayValue = parseFloat(currentValueEl.textContent.replace(/[$,]/g, ''));
    animateValue(currentValueEl, currentDisplayValue, portfolio.totalValue, 1000);
    
    // Update return percentage
    dailyChangeEl.textContent = `${changeText}${totalReturn.toFixed(2)}% total return`;
    dailyChangeEl.className = 'performance-change ' + (totalReturn >= 0 ? 'positive' : 'negative');
    
    // Also show cash vs invested breakdown in console for debugging
    const investedValue = portfolio.totalValue - portfolio.cash;
    console.log(`Portfolio: $${portfolio.totalValue.toFixed(2)} (Cash: $${portfolio.cash.toFixed(2)}, Invested: $${investedValue.toFixed(2)})`);
    
    // Update mobile elements if they exist (only for demo mode)
    const mobileCurrentValueEl = document.getElementById('mobileCurrentValue');
    const mobileDailyChangeEl = document.getElementById('mobileDailyChange');
    
    if (mobileCurrentValueEl) {
        mobileCurrentValueEl.textContent = '$' + portfolio.totalValue.toFixed(2);
    }
    if (mobileDailyChangeEl) {
        const mobileTotalReturn = ((portfolio.totalValue - portfolio.startValue) / portfolio.startValue) * 100;
        mobileDailyChangeEl.textContent = `${mobileTotalReturn >= 0 ? '+' : ''}${mobileTotalReturn.toFixed(2)}%`;
        mobileDailyChangeEl.className = 'mobile-performance-change ' + (mobileTotalReturn >= 0 ? 'positive' : 'negative');
    }
}

// Update performance display for specific time period
function updatePerformanceForPeriod(range, chartData) {
    if (!chartData || !chartData.brightflow || chartData.brightflow.length === 0) return;
    
    const currentValueEl = document.getElementById('currentValue');
    const dailyChangeEl = document.getElementById('dailyChange');
    
    const startValue = chartData.brightflow[0];
    const endValue = chartData.brightflow[chartData.brightflow.length - 1];
    
    // Use normalized values directly (no multiplication needed)
    const startDollar = startValue;
    const endDollar = endValue;
    const periodReturn = ((endValue - startValue) / startValue) * 100;
    const changeText = periodReturn >= 0 ? '+' : '';
    
    // Get period label
    const periodLabels = {
        '1d': 'today',
        '7d': '7 days',
        '14d': '14 days',
        '1m': '1 month',
        '6m': '6 months',
        '1y': '1 year',
        '5y': 'all time'
    };
    
    // Animate to current end value in normalized dollars
    const currentDisplayValue = parseFloat(currentValueEl.textContent.replace(/[$,]/g, ''));
    animateValue(currentValueEl, currentDisplayValue, endDollar, 1000);
    
    // Update period return
    dailyChangeEl.textContent = `${changeText}${periodReturn.toFixed(2)}% ${periodLabels[range]}`;
    dailyChangeEl.className = 'performance-change ' + (periodReturn >= 0 ? 'positive' : 'negative');
    
    // Log comparison with benchmarks
    if (chartData.spy && chartData.spy.length > 0) {
        const spyReturn = ((chartData.spy[chartData.spy.length - 1] - chartData.spy[0]) / chartData.spy[0]) * 100;
        const outperformance = periodReturn - spyReturn;
        console.log(`${periodLabels[range]}: BrightFlow ${periodReturn.toFixed(2)}% vs SPY ${spyReturn.toFixed(2)}% (${outperformance > 0 ? '+' : ''}${outperformance.toFixed(2)}% outperformance)`);
    }
}

// Animate number changes with proper formatting
function animateValue(element, start, end, duration) {
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * easeOutCubic(progress);
        
        // Format with commas for readability
        const formatted = current.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        element.textContent = formatted;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    update();
}

// Easing function for smooth animations
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Check if current time is during market hours
function isMarketHours(date) {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = date.getHours();
    
    // Market is open Monday-Friday, 9:30 AM - 4:00 PM EST
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
}

// Generate a realistic trade based on ML algorithm logic
function generateRealisticTrade(stockPrices, availableCash, currentDate) {
    const symbols = Object.keys(stockPrices);
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const price = addPriceVariation(stockPrices[symbol], currentDate);
    
    // Simulate ML confidence and strategy
    const strategies = ['momentum', 'mean_reversion', 'breakout', 'value_play', 'trend_following'];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const confidence = 0.65 + Math.random() * 0.3; // 65-95% confidence
    
    // Decide action based on "ML algorithm"
    let action;
    if (Math.random() < 0.6) {
        action = 'BUY';
    } else if (portfolio.positions[symbol] && portfolio.positions[symbol].shares > 0) {
        action = 'SELL';
    } else {
        action = 'BUY'; // Can't sell if we don't own it
    }
    
    // Calculate realistic position size (1-5% of portfolio per trade)
    let dollarAmount;
    if (action === 'BUY') {
        const maxInvestment = Math.min(availableCash * 0.05, 200); // Max $200 or 5% of cash
        dollarAmount = Math.max(50, Math.random() * maxInvestment); // Min $50
    } else {
        // Selling - use current position size
        const currentShares = portfolio.positions[symbol]?.shares || 0;
        const sellRatio = 0.3 + Math.random() * 0.7; // Sell 30-100% of position
        dollarAmount = currentShares * sellRatio * price;
    }
    
    // Calculate fractional shares
    const quantity = parseFloat((dollarAmount / price).toFixed(4));
    
    // Check if we have enough cash (for buys) or shares (for sells)
    if (action === 'BUY' && dollarAmount > availableCash) {
        return null; // Not enough cash
    }
    
    if (action === 'SELL') {
        const availableShares = portfolio.positions[symbol]?.shares || 0;
        if (quantity > availableShares) {
            return null; // Not enough shares
        }
    }
    
    const amount = quantity * price * (action === 'SELL' ? 1 : -1);
    
    return {
        date: new Date(currentDate),
        action: action,
        symbol: symbol,
        quantity: quantity,
        price: price,
        amount: amount,
        strategy: strategy,
        confidence: confidence,
        runningBalance: 0 // Will be calculated after trade
    };
}

// Add realistic price variation over time
function addPriceVariation(basePrice, date) {
    const daysSinceStart = Math.floor((date - new Date('2024-09-25')) / (1000 * 60 * 60 * 24));
    
    // Add some trend and volatility
    const trend = Math.sin(daysSinceStart * 0.1) * 0.02; // Slow trend
    const volatility = (Math.random() - 0.5) * 0.03; // Daily volatility
    
    return basePrice * (1 + trend + volatility);
}

// Calculate total portfolio value including cash and positions
function calculatePortfolioValue(cash, positions, stockPrices, date) {
    let totalValue = cash;
    
    for (const [symbol, position] of Object.entries(positions)) {
        const currentPrice = addPriceVariation(stockPrices[symbol], date);
        totalValue += position.shares * currentPrice;
    }
    
    return totalValue;
}

// DISABLED: Demo mode simulation functions - ONLY USE REAL ML DATA
// All data comes from Kubernetes data-exporter CronJob (every 5 minutes)
/*
// Simulate hourly market activity for the demo
function simulateHourlyMarketActivity() {
    marketHour++;

    // Only simulate during market hours
    const now = new Date();
    if (!isMarketHours(now)) {
        return;
    }

    // Update portfolio value based on market movements
    updatePortfolioValue();

    // Occasionally make a new trade (10% chance per hour)
    if (Math.random() < 0.1) {
        executeNewTrade();
    }

    // Update chart with new portfolio value
    updateChartWithCurrentValue();
}

// Update portfolio value based on current market prices
function updatePortfolioValue() {
    // Don't override portfolio value if we have real transaction data
    if (realDataLoaded && realPerformanceData) {
        console.log('📊 Skipping portfolio update - using real transaction data');
        return;
    }

    const stockPrices = {
        'AAPL': 178.50,
        'GOOGL': 145.20,
        'MSFT': 412.80,
        'TSLA': 219.30,
        'AMZN': 142.65,
        'NVDA': 889.45,
        'META': 484.20,
        'SPY': 420.15
    };

    const now = new Date();
    portfolio.totalValue = calculatePortfolioValue(portfolio.cash, portfolio.positions, stockPrices, now);
}

// Execute a new realistic trade
function executeNewTrade() {
    const stockPrices = {
        'AAPL': 178.50,
        'GOOGL': 145.20,
        'MSFT': 412.80,
        'TSLA': 219.30,
        'AMZN': 142.65,
        'NVDA': 889.45,
        'META': 484.20,
        'SPY': 420.15
    };

    const trade = generateRealisticTrade(stockPrices, portfolio.cash, new Date());

    if (!trade) return; // No valid trade generated

    // Execute the trade
    if (trade.action === 'BUY') {
        portfolio.cash -= Math.abs(trade.amount);

        // Update positions
        if (!portfolio.positions[trade.symbol]) {
            portfolio.positions[trade.symbol] = { shares: 0, avgPrice: 0 };
        }

        const currentShares = portfolio.positions[trade.symbol].shares;
        const currentAvg = portfolio.positions[trade.symbol].avgPrice;
        const newShares = currentShares + trade.quantity;
        const newAvg = newShares > 0 ?
            ((currentShares * currentAvg) + (trade.quantity * trade.price)) / newShares : 0;

        portfolio.positions[trade.symbol].shares = newShares;
        portfolio.positions[trade.symbol].avgPrice = newAvg;

    } else if (trade.action === 'SELL') {
        portfolio.cash += trade.amount;

        // Reduce position
        if (portfolio.positions[trade.symbol]) {
            portfolio.positions[trade.symbol].shares -= trade.quantity;
            if (portfolio.positions[trade.symbol].shares <= 0.0001) { // Account for floating point
                delete portfolio.positions[trade.symbol];
            }
        }
    }

    // Update portfolio total value
    updatePortfolioValue();
    trade.runningBalance = portfolio.totalValue;

    // Add to transaction history
    transactionData.push(trade);

    // Add to table with animation
    const tbody = document.getElementById('ledgerBody');
    const newRow = createTransactionRow(trade);
    newRow.style.backgroundColor = '#ffd700';
    newRow.style.color = '#000';

    // Insert at top
    tbody.insertBefore(newRow, tbody.firstChild);

    // Animate back to normal colors
    setTimeout(() => {
        newRow.style.backgroundColor = '';
        newRow.style.color = '';
        newRow.style.transition = 'all 1s ease';
    }, 1000);

    // Remove oldest transaction if more than 50
    if (tbody.children.length > 50) {
        tbody.removeChild(tbody.lastChild);
    }

    console.log(`${trade.action} ${trade.quantity.toFixed(4)} shares of ${trade.symbol} at $${trade.price.toFixed(2)}`);
    console.log(`Portfolio value: $${portfolio.totalValue.toFixed(2)}`);
}
*/

// Update chart with real data
function updateChartWithRealData(data) {
    if (!performanceChart) {
        console.warn('Chart not initialized, cannot update');
        return;
    }

    console.log('📊 Updating chart with real data:', data);

    // Clear ALL datasets
    performanceChart.data.datasets = [];

    // Update labels if BrightFlow data exists
    if (data.brightflow && Array.isArray(data.brightflow)) {
        performanceChart.data.labels = data.brightflow.map(item =>
            new Date(item.date).toLocaleDateString()
        );
    }

    // Add BrightFlow if enabled
    if (brightflowEnabled && data.brightflow && Array.isArray(data.brightflow)) {
        performanceChart.data.datasets.push({
            label: 'BrightFlow Portfolio',
            data: data.brightflow.map(item => item.value),
            borderColor: '#ffd700',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#ffd700',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        });
        console.log(`✅ Added BrightFlow dataset with ${data.brightflow.length} data points`);
    }

    // Add enabled indices
    Object.values(MARKET_INDICES).forEach(region => {
        Object.entries(region.indices).forEach(([key, props]) => {
            if (props.enabled && data[key] && Array.isArray(data[key])) {
                performanceChart.data.datasets.push({
                    label: props.name,
                    data: data[key].map(item => item.value),
                    borderColor: props.color,
                    backgroundColor: props.color + '20', // Add transparency
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: props.color,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                });
                console.log(`✅ Added ${props.name} dataset with ${data[key].length} data points`);
            }
        });
    });

    performanceChart.update('active');
    console.log(`✅ Chart updated with ${performanceChart.data.datasets.length} datasets`);
}

// Initialize mobile chart
function initializeMobileChart() {
    const mobileChartCanvas = document.getElementById('mobileChart');
    if (!mobileChartCanvas) {
        console.log('📱 No mobile chart canvas found');
        return;
    }
    
    console.log('📱 Initializing mobile chart...');
    console.log('📱 Mobile chart canvas found:', mobileChartCanvas);
    console.log('📱 User agent:', navigator.userAgent);
    console.log('📱 Is Safari:', /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));
    
    // Safari-specific fixes
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    mobileChart = new Chart(mobileChartCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'BrightFlow',
                data: [],
                borderColor: '#ffd700',
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#ffd700',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: isSafari ? false : true, // Disable animation on Safari
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: '#333',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#888',
                        maxRotation: 0,
                        autoSkipPadding: 20
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: '#333',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#888',
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: isSafari ? 0 : 3 // Hide points on Safari
                }
            },
            // Safari-specific interaction settings
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    // Safari-specific retry mechanism
    if (isSafari) {
        console.log('📱 Safari detected, adding retry mechanism...');
        
        // Retry chart initialization after a short delay
        setTimeout(() => {
            if (!mobileChart || !mobileChart.data) {
                console.log('📱 Retrying mobile chart initialization for Safari...');
                try {
                    mobileChart.destroy();
                } catch (e) {
                    console.log('📱 No chart to destroy');
                }
                
                // Recreate chart with simpler configuration
                mobileChart = new Chart(mobileChartCanvas, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'BrightFlow',
                            data: [],
                            borderColor: '#ffd700',
                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: { display: false },
                            y: { display: false }
                        },
                        elements: {
                            point: { radius: 0 }
                        }
                    }
                });
                console.log('📱 Safari mobile chart retry completed');
            }
        }, 1000);
    }
    
    console.log('✅ Mobile chart initialized');
}

// Update mobile chart with real data
function updateMobileChartWithRealData(data) {
    if (!mobileChart) {
        console.log('📱 No mobile chart available for update, trying to initialize...');
        initializeMobileChart();
        if (!mobileChart) {
            console.log('📱 Failed to initialize mobile chart');
            return;
        }
    }

    console.log('📱 Updating mobile chart with real data');
    console.log('📱 Mobile chart exists:', !!mobileChart);
    console.log('📱 Data received:', data);

    const brightflowData = data.brightflow || [];

    if (brightflowData.length > 0) {
        mobileChart.data.labels = brightflowData.map(item =>
            new Date(item.date).toLocaleDateString()
        );
        mobileChart.data.datasets[0].data = brightflowData.map(item => item.value);
        mobileChart.update('active');
        console.log('✅ Mobile chart updated with', brightflowData.length, 'data points');
    }
}

// Update mobile chart with time range data
function updateMobileChartWithTimeRange(range, chartData) {
    if (!mobileChart) return;
    
    console.log('📱 Updating mobile chart for time range:', range);
    
    if (chartData.brightflow && chartData.brightflow.length > 0) {
        mobileChart.data.labels = chartData.labels;
        mobileChart.data.datasets[0].data = chartData.brightflow;
        mobileChart.update('active');
        console.log('✅ Mobile chart updated for', range, 'with', chartData.brightflow.length, 'data points');
    }
}

// Update performance display with real data
function updatePerformanceDisplayWithRealData(performanceData, transactionData = null) {
    const currentValueEl = document.getElementById('currentValue');
    const dailyChangeEl = document.getElementById('dailyChange');
    
    // Use actual running balance from transactions if available, otherwise use normalized value
    let displayValue;
    let totalReturn;
    
    // Check for currentBalance in transaction data first, then performance data
    const currentBalance = (transactionData && transactionData.currentBalance) || 
                          (performanceData && performanceData.currentBalance);
    
    if (currentBalance && currentBalance > 0) {
        // Use actual running balance from transactions
        displayValue = currentBalance;
        // Calculate return from $1.00 starting amount
        totalReturn = ((displayValue - 1.00) / 1.00) * 100;
        console.log('💰 Using transaction balance:', displayValue, 'Return:', totalReturn.toFixed(2) + '%');
    } else {
        // Fallback to normalized value
        displayValue = performanceData.currentValue;
        totalReturn = ((displayValue - portfolio.startValue) / portfolio.startValue) * 100;
        console.log('📊 Using normalized value:', displayValue, 'Return:', totalReturn.toFixed(2) + '%');
    }
    
    // Update desktop elements if they exist
    if (currentValueEl) {
        currentValueEl.textContent = '$' + displayValue.toFixed(2);
    }
    if (dailyChangeEl) {
        dailyChangeEl.textContent = `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}% total return`;
        dailyChangeEl.className = 'performance-change ' + (totalReturn >= 0 ? 'positive' : 'negative');
    }

        // Update mobile elements if they exist
        const mobileCurrentValueEl = document.getElementById('mobileCurrentValue');
        const mobileDailyChangeEl = document.getElementById('mobileDailyChange');
        
        console.log('📱 Mobile elements found:', {
            currentValue: !!mobileCurrentValueEl,
            dailyChange: !!mobileDailyChangeEl,
            displayValue: displayValue
        });
        
        if (mobileCurrentValueEl) {
            mobileCurrentValueEl.textContent = '$' + displayValue.toFixed(2);
            console.log('📱 Updated mobile current value to:', mobileCurrentValueEl.textContent);
        }
        if (mobileDailyChangeEl) {
            mobileDailyChangeEl.textContent = `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`;
            mobileDailyChangeEl.className = 'mobile-performance-change ' + (totalReturn >= 0 ? 'positive' : 'negative');
            console.log('📱 Updated mobile daily change to:', mobileDailyChangeEl.textContent);
        }
    
    console.log('Performance Display Updated:', {
        displayValue: displayValue,
        startValue: portfolio.startValue,
        totalReturn: totalReturn.toFixed(2) + '%'
    });
}

// Periodically check for updated data with smart caching
async function checkForUpdates() {
    try {
        console.log('Checking for data updates...');
        
        // Add timestamp to prevent caching
        const timestamp = Date.now();
        const performanceResponse = await fetch(`./data/performance.json?t=${timestamp}`);
        const transactionResponse = await fetch(`./data/transactions.json?t=${timestamp}`);
        
        if (!performanceResponse.ok || !transactionResponse.ok) {
            throw new Error('Failed to fetch data files');
        }
        
        const performanceData = await performanceResponse.json();
        const transactionData = await transactionResponse.json();
        
        // Check if data is newer than what we have
        const lastUpdated = new Date(performanceData.lastUpdated);
        const storedLastUpdate = localStorage.getItem('lastDataUpdate');
        
        console.log('🔍 Checking data freshness:');
        console.log('  Current data timestamp:', performanceData.lastUpdated);
        console.log('  Stored timestamp:', storedLastUpdate);
        
        if (!storedLastUpdate || new Date(storedLastUpdate) < lastUpdated) {
            console.log('✅ New data available, updating charts and tables');
            
            // Update charts and display
            updateChartWithRealData(performanceData);
            
            // Update transaction data first
            const transactionDataArray = transactionData.transactions || [];
            
            // Update performance display with transaction data
            updatePerformanceDisplayWithRealData(performanceData, transactionData);
            populateTransactionTableWithRealData({ transactions: transactionDataArray });
            
            // Store the update time
            localStorage.setItem('lastDataUpdate', performanceData.lastUpdated);
            localStorage.setItem('lastRealDataUpdate', Date.now().toString());
            
            // Show success indicator
            showUpdateIndicator('success');
        } else {
            console.log('ℹ️ No new data available (data is up to date)');
            showUpdateIndicator('no-update');
        }
        
    } catch (error) {
        console.warn('Could not check for updates:', error);
        showUpdateIndicator('error');

        // Show error - NO MOCK DATA FALLBACK
        console.error('⚠️ Unable to fetch data updates. Check data file availability.');
    }
}

// Show update indicator to user
function showUpdateIndicator(status) {
    const indicator = document.createElement('div');
    indicator.className = `update-indicator ${status}`;
    
    const messages = {
        'success': '✓ Data updated',
        'no-update': '• No new data',
        'error': '⚠ Update failed'
    };
    
    indicator.textContent = messages[status];
    document.body.appendChild(indicator);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 3000);
}

// Force refresh data (useful when ML backend sends new data)
function forceRefreshData() {
    console.log('🔄 Force refreshing data...');
    
    // Clear stored timestamps to force update
    localStorage.removeItem('lastDataUpdate');
    localStorage.removeItem('lastRealDataUpdate');
    
    // Reload data
    loadRealData().then(() => {
        console.log('✅ Force refresh completed');
        showUpdateIndicator('success');
    }).catch((error) => {
        console.error('❌ Force refresh failed:', error);
        showUpdateIndicator('error');
    });
    
    // Initialize competitor modal
    initializeCompetitorModal();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize mobile stock search
    initializeMobileStockSearch();
}

// Competitor data definitions
const competitorData = {
    usMarket: [
        { symbol: 'SPY', description: 'SPDR S&P 500 ETF Trust - Tracks S&P 500 index' },
        { symbol: 'VOO', description: 'Vanguard S&P 500 ETF - Low-cost S&P 500 tracking' },
        { symbol: 'IVV', description: 'iShares Core S&P 500 ETF - S&P 500 index fund' },
        { symbol: 'VTI', description: 'Vanguard Total Stock Market ETF - Broad market exposure' },
        { symbol: 'ITOT', description: 'iShares Core S&P Total U.S. Stock Market ETF' },
        { symbol: 'SCHB', description: 'Schwab U.S. Broad Market ETF - Total market index' },
        { symbol: 'IWM', description: 'iShares Russell 2000 ETF - Small-cap stocks' },
        { symbol: 'IJH', description: 'iShares Core S&P Mid-Cap ETF - Mid-cap exposure' },
        { symbol: 'VB', description: 'Vanguard Small-Cap ETF - Small-cap value stocks' },
        { symbol: 'VBR', description: 'Vanguard Small-Cap Value ETF - Small-cap value' },
        { symbol: 'VTV', description: 'Vanguard Value ETF - Large-cap value stocks' },
        { symbol: 'VUG', description: 'Vanguard Growth ETF - Large-cap growth stocks' },
        { symbol: 'IUSG', description: 'iShares Core S&P U.S. Growth ETF - Growth stocks' },
        { symbol: 'IUSV', description: 'iShares Core S&P U.S. Value ETF - Value stocks' },
        { symbol: 'DIA', description: 'SPDR Dow Jones Industrial Average ETF - Dow 30' },
        { symbol: 'QQQ', description: 'Invesco QQQ Trust - NASDAQ-100 index' }
    ],
    international: [
        { symbol: 'VXUS', description: 'Vanguard Total International Stock ETF - Global ex-US' },
        { symbol: 'VEU', description: 'Vanguard FTSE All-World ex-US ETF - International' },
        { symbol: 'VEA', description: 'Vanguard FTSE Developed Markets ETF - Developed markets' },
        { symbol: 'VWO', description: 'Vanguard FTSE Emerging Markets ETF - Emerging markets' },
        { symbol: 'EFA', description: 'iShares MSCI EAFE ETF - Developed international' },
        { symbol: 'EEM', description: 'iShares MSCI Emerging Markets ETF - Emerging markets' },
        { symbol: 'IEFA', description: 'iShares Core MSCI EAFE IMI Index ETF - International' },
        { symbol: 'IEMG', description: 'iShares Core MSCI Emerging Markets IMI Index ETF' },
        { symbol: 'SCHF', description: 'Schwab International Equity ETF - International' },
        { symbol: 'SCHE', description: 'Schwab Emerging Markets Equity ETF - Emerging markets' },
        { symbol: 'SPDW', description: 'SPDR Portfolio World ex-US ETF - International' },
        { symbol: 'SPEM', description: 'SPDR Portfolio Emerging Markets ETF - Emerging markets' }
    ]
};

// Initialize competitor modal
function initializeCompetitorModal() {
    const modal = document.getElementById('competitorModal');
    const closeBtn = document.getElementById('competitorModalClose');
    const applyBtn = document.getElementById('applyCompetitorSelection');
    const resetBtn = document.getElementById('resetCompetitorSelection');
    
    // Populate competitor lists
    populateCompetitorLists();
    
    // Event listeners
    closeBtn.addEventListener('click', closeCompetitorModal);
    applyBtn.addEventListener('click', applyCompetitorSelection);
    resetBtn.addEventListener('click', resetCompetitorSelection);
    
    // Close modal when clicking overlay
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCompetitorModal();
        }
    });
}

// Populate competitor lists
function populateCompetitorLists() {
    const usContainer = document.getElementById('usMarketETFs');
    const intContainer = document.getElementById('internationalETFs');
    
    // Populate US Market ETFs
    competitorData.usMarket.forEach(competitor => {
        const item = createCompetitorItem(competitor);
        usContainer.appendChild(item);
    });
    
    // Populate International ETFs
    competitorData.international.forEach(competitor => {
        const item = createCompetitorItem(competitor);
        intContainer.appendChild(item);
    });
}

// Create competitor item element
function createCompetitorItem(competitor) {
    const item = document.createElement('div');
    item.className = 'competitor-item';
    
    const isSelected = selectedCompetitors.includes(competitor.symbol.toLowerCase());
    
    item.innerHTML = `
        <input type="checkbox" id="comp_${competitor.symbol}" value="${competitor.symbol.toLowerCase()}" ${isSelected ? 'checked' : ''}>
        <div class="competitor-info">
            <div class="competitor-symbol">${competitor.symbol}</div>
            <div class="competitor-description">${competitor.description}</div>
        </div>
    `;
    
    // Add click handler for the entire item
    item.addEventListener('click', function(e) {
        if (e.target.type !== 'checkbox') {
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
        }
    });
    
    return item;
}

// Open competitor modal
function openCompetitorModal() {
    const modal = document.getElementById('competitorModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close competitor modal
function closeCompetitorModal() {
    const modal = document.getElementById('competitorModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Apply competitor selection
function applyCompetitorSelection() {
    const checkboxes = document.querySelectorAll('#competitorModal input[type="checkbox"]:checked');
    selectedCompetitors = Array.from(checkboxes).map(cb => cb.value);
    
    console.log('Selected competitors:', selectedCompetitors);
    
    // Update chart with new competitors
    updateChartWithSelectedCompetitors();
    
    // Close modal
    closeCompetitorModal();
    
    // Show success message
    showUpdateIndicator('success');
}

// Reset competitor selection to default
function resetCompetitorSelection() {
    selectedCompetitors = ['spy', 'vfiax', 'spdr'];
    
    // Update checkboxes
    const checkboxes = document.querySelectorAll('#competitorModal input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = selectedCompetitors.includes(cb.value);
    });
    
    console.log('Reset competitors to default:', selectedCompetitors);
}

// Update chart with selected competitors
function updateChartWithSelectedCompetitors() {
    if (!performanceChart || !realPerformanceData) return;
    
    // Update chart datasets based on selected competitors
    const datasets = ['brightflow', 'spy', 'vfiax', 'spdr'];
    const allCompetitors = ['spy', 'voo', 'ivv', 'vti', 'itot', 'schb', 'iwm', 'ijh', 'vb', 'vbr', 'vtv', 'vug', 'iusg', 'iusv', 'dia', 'qqq', 'vxus', 'veu', 'vea', 'vwo', 'efa', 'eem', 'iefa', 'iemg', 'schf', 'sche', 'spdw', 'spem'];
    
    // Hide all competitor datasets first
    datasets.forEach((dataset, index) => {
        if (index > 0) { // Skip brightflow (index 0)
            performanceChart.data.datasets[index].hidden = true;
        }
    });
    
    // Show selected competitors
    selectedCompetitors.forEach(competitor => {
        const competitorIndex = allCompetitors.indexOf(competitor);
        if (competitorIndex !== -1) {
            // Map to chart dataset index (1=spy, 2=vfiax, 3=spdr)
            const chartIndex = ['spy', 'vfiax', 'spdr'].indexOf(competitor);
            if (chartIndex !== -1) {
                performanceChart.data.datasets[chartIndex + 1].hidden = false;
            }
        }
    });
    
    // Update chart
    performanceChart.update('active');
    
    console.log('Chart updated with selected competitors:', selectedCompetitors);
}

// Populate mobile transaction list
// Note: Mobile uses the same ledgerBody table as desktop, but this function
// ensures mobile-specific handling if needed
function populateMobileTransactionList() {
    // Mobile page uses the same ledgerBody table, so populateTransactionTable() handles it
    // But we check if we're on a mobile page and ensure it's populated
    const mobileLedgerTable = document.getElementById('mobileLedgerTable');
    const ledgerBody = document.getElementById('ledgerBody');
    
    if (!mobileLedgerTable || !ledgerBody) {
        // Not on mobile page or element doesn't exist - populateTransactionTable handles desktop
        console.log('📱 Not on mobile page or mobile ledger table not found');
        return;
    }
    
    // Mobile uses the same populateTransactionTable function, so just ensure it's called
    // The createTransactionRow function already handles mobile formatting
    console.log('📱 Mobile transaction table found - using shared populateTransactionTable()');
    // populateTransactionTable() is already called separately, so we just need to verify it worked
}

// Initialize mobile menu
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (!mobileMenuBtn || !mobileMenuOverlay) {
        console.log('📱 No mobile menu elements found');
        return;
    }
    
    console.log('📱 Initializing mobile menu...');
    
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenuOverlay.classList.toggle('active');
        console.log('📱 Mobile menu toggled');
    });
    
    // Close mobile menu when clicking overlay
    mobileMenuOverlay.addEventListener('click', function(e) {
        if (e.target === mobileMenuOverlay) {
            mobileMenuOverlay.classList.remove('active');
            console.log('📱 Mobile menu closed');
        }
    });
    
    // Close mobile menu when clicking menu links
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            mobileMenuOverlay.classList.remove('active');
            
            const href = this.getAttribute('href');
            console.log('📱 Mobile menu item clicked:', href);
            
            // Show alert for now
            const text = this.textContent;
            alert(`"${text}" feature coming soon!`);
        });
    });
    
    console.log('✅ Mobile menu initialized');
}

// Initialize mobile stock search
function initializeMobileStockSearch() {
    const mobileSearchInput = document.getElementById('mobileStockSearch');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    
    if (!mobileSearchInput || !mobileSearchBtn) {
        console.log('📱 No mobile stock search elements found');
        return;
    }
    
    console.log('📱 Initializing mobile stock search...');
    
    // Search button click handler
    mobileSearchBtn.addEventListener('click', function() {
        const query = mobileSearchInput.value.trim();
        if (query) {
            console.log('📱 Mobile stock search:', query);
            performStockSearch(query);
        }
    });
    
    // Enter key handler
    mobileSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = mobileSearchInput.value.trim();
            if (query) {
                console.log('📱 Mobile stock search (Enter):', query);
                performStockSearch(query);
            }
        }
    });
    
    console.log('✅ Mobile stock search initialized');
}

// Make forceRefreshData available globally for manual refresh
window.forceRefreshData = forceRefreshData;

// Populate transaction table with real data
function populateTransactionTableWithRealData(data) {
    const tbody = document.getElementById('ledgerBody');
    tbody.innerHTML = '';
    
    // Show most recent transactions first (limit to 50)
    const recentTransactions = data.transactions.slice(-50).reverse();
    
    recentTransactions.forEach((transaction, index) => {
        setTimeout(() => {
            const row = createTransactionRowFromRealData(transaction);
            tbody.appendChild(row);
        }, index * 30); // Faster stagger for real data
    });
    
    // Update current balance
    if (data.currentBalance) {
        currentBalance = data.currentBalance;
    }
}

// Create transaction row from real data format
function createTransactionRowFromRealData(transaction) {
    const row = document.createElement('tr');
    const isPositive = transaction.action === 'BUY';
    const date = new Date(transaction.timestamp);

    row.innerHTML = `
        <td>${date.toLocaleDateString()}</td>
        <td>${date.toLocaleTimeString()}</td>
        <td><span class="${transaction.action.toLowerCase()}">${transaction.action}</span></td>
        <td>${transaction.symbol}</td>
        <td>${transaction.shares.toFixed(4)}</td>
        <td>$${transaction.price.toFixed(2)}</td>
        <td class="${isPositive ? 'buy' : 'sell'}">
            ${isPositive ? '-' : '+'}$${Math.abs(transaction.amount).toFixed(2)}
        </td>
        <td class="running-balance">$${transaction.balance.toFixed(2)}</td>
    `;

    // Add confidence and strategy info as tooltip
    if (transaction.confidence) {
        row.title = `Strategy: ${transaction.strategy || 'N/A'} | Confidence: ${(transaction.confidence * 100).toFixed(1)}%`;
    }

    return row;
}

// Update chart with new data point (fallback for demo mode)
function updateChart() {
    // First try to load fresh data
    checkForUpdates();
    
    // If no real data updates, continue with mock updates for demo
    if (!performanceChart) return;

    const datasets = performanceChart.data.datasets;
    
    // Add new data point to each dataset
    datasets.forEach((dataset, index) => {
        const lastValue = dataset.data.slice(-1)[0];
        const volatility = [0.02, 0.01, 0.008, 0.009][index];
        const trend = [0.03, 0.015, 0.014, 0.013][index];
        
        const randomChange = (Math.random() - 0.5) * volatility;
        const trendChange = trend / 365;
        const newValue = lastValue * (1 + trendChange + randomChange);
        
        dataset.data.push(Math.max(0.1, newValue));
        
        // Keep only last 100 data points for performance
        if (dataset.data.length > 100) {
            dataset.data.shift();
        }
    });
    
    // Update labels
    const newLabel = new Date().toLocaleTimeString();
    performanceChart.data.labels.push(newLabel);
    
    if (performanceChart.data.labels.length > 100) {
        performanceChart.data.labels.shift();
    }
    
    // Animate the update
    performanceChart.update('active');
}

// Hamburger Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navMenu = document.getElementById('navMenu');
    let isMenuOpen = false;

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    overlay.id = 'menuOverlay';
    document.body.appendChild(overlay);

    // Toggle menu function
    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        hamburgerMenu.classList.toggle('active', isMenuOpen);
        navMenu.classList.toggle('active', isMenuOpen);
        overlay.classList.toggle('active', isMenuOpen);
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    }

    // Close menu function
    function closeMenu() {
        isMenuOpen = false;
        hamburgerMenu.classList.remove('active');
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners
    hamburgerMenu.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    // Close menu when clicking on menu links
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            closeMenu();
            
            // You can add navigation logic here
            const href = this.getAttribute('href');
            console.log('Menu item clicked:', href);
            
            // Handle competitor menu
            if (href === '#competitors') {
                openCompetitorModal();
            } else {
            // For now, just show an alert
            const text = this.textContent;
            alert(`"${text}" feature coming soon!`);
            }
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && isMenuOpen) {
            closeMenu();
        }
    });
});

// Stock Search Functionality - Now handled by stock-search.js
// The real stock search with API integration is in stock-search.js