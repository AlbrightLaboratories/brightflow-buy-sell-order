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
let selectedCompetitors = ['spy', 'vfiax', 'spdr']; // Default competitors
let mobileChart = null; // Mobile chart instance

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    initializeMobileChart();
    setupTimeRangeControls();
    loadRealData().then(() => {
        // Start real-time updates only after data is loaded
        startRealTimeUpdates();
    }).catch(() => {
        // If loading fails, still start updates for demo mode
        startRealTimeUpdates();
    });
});

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
    const desktopButtons = document.querySelectorAll('.time-btn');
    setupTimeRangeButtons(desktopButtons);
    
    // Setup mobile buttons
    const mobileButtons = document.querySelectorAll('.mobile-time-btn');
    setupTimeRangeButtons(mobileButtons);
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
        // Fallback to mock data
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
    
    // Fallback to demo mode if no cached data
    console.log('⚠️ No cached data available, falling back to demo mode');
    showDemoMode();
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
    
    try {
        // Load performance data with error handling
        console.log('📊 Fetching performance data...');
        const performanceResponse = await fetch('./data/performance.json', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!performanceResponse.ok) {
            throw new Error(`Performance data fetch failed: ${performanceResponse.status} ${performanceResponse.statusText}`);
        }
        
        const performanceData = await performanceResponse.json();
        console.log('✅ Performance data loaded:', performanceData);
        
        // Load transaction data with error handling
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
        
        const transactionDataResponse = await transactionResponse.json();
        console.log('✅ Transaction data loaded:', transactionDataResponse);
        
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
        
        // Update transaction data first
        transactionData = transactionDataResponse.transactions || [];
        
        // Update performance display with transaction data (contains currentBalance)
        updatePerformanceDisplayWithRealData(performanceData, transactionDataResponse);
        
        populateTransactionTable();
        populateMobileTransactionList();
        
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
        
        console.log('✅ Real data loaded successfully');
        showUpdateIndicator('success');
        
    } catch (error) {
        console.error('❌ Could not load real data:', error);
        showUpdateIndicator('error');
        
        // Fallback to mock data if files don't exist yet
        console.log('🔄 Falling back to mock data...');
        generateMockData();
        populateTransactionTable();
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
        spy: [],
        vfiax: [],
        spdr: []
    };
    
    // Convert each dataset
    const datasets = ['brightflow', 'spy', 'vfiax', 'spdr'];
    
    datasets.forEach(key => {
        if (performanceData.performance[key]) {
            performanceData.performance[key].forEach((item, index) => {
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

// Chart initialization with animations
function initializeChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
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
                    label: 'SPY',
                    data: chartData.spy,
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
                    label: 'VFIAX',
                    data: chartData.vfiax,
                    borderColor: '#44ff44',
                    backgroundColor: 'rgba(68, 255, 68, 0.1)',
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
                    label: 'SPDR S&P 500',
                    data: chartData.spdr,
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
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Initialize realistic portfolio with actual stock prices
function generateMockData() {
    console.log('Initializing realistic BrightFlow portfolio...');
    
    // Realistic stock prices (approximate Oct 2024 prices)
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
    
    // Generate realistic trading history over past weeks
    const symbols = Object.keys(stockPrices);
    let currentDate = new Date('2024-09-25T09:30:00'); // Market open Sept 25
    const endDate = new Date();
    
    // Start with initial cash
    let runningCash = portfolio.cash;
    let runningTotalValue = portfolio.startValue;
    
    // Generate 40-50 realistic transactions
    let transactionCount = 0;
    
    while (currentDate < endDate && transactionCount < 45) {
        // Only trade during market hours (9:30 AM - 4 PM EST, weekdays)
        if (isMarketHours(currentDate)) {
            // Simulate ML algorithm making a decision every few hours
            if (Math.random() < 0.15) { // 15% chance each market hour
                const trade = generateRealisticTrade(stockPrices, runningCash, currentDate);
                
                if (trade) {
                    // Update portfolio
                    if (trade.action === 'BUY') {
                        runningCash -= trade.amount;
                        // Update positions
                        if (!portfolio.positions[trade.symbol]) {
                            portfolio.positions[trade.symbol] = { shares: 0, avgPrice: 0 };
                        }
                        
                        const currentShares = portfolio.positions[trade.symbol].shares;
                        const currentAvg = portfolio.positions[trade.symbol].avgPrice;
                        const newShares = currentShares + trade.quantity;
                        const newAvg = ((currentShares * currentAvg) + (trade.quantity * trade.price)) / newShares;
                        
                        portfolio.positions[trade.symbol].shares = newShares;
                        portfolio.positions[trade.symbol].avgPrice = newAvg;
                        
                    } else if (trade.action === 'SELL') {
                        runningCash += trade.amount;
                        // Reduce position
                        if (portfolio.positions[trade.symbol]) {
                            portfolio.positions[trade.symbol].shares -= trade.quantity;
                            if (portfolio.positions[trade.symbol].shares <= 0) {
                                delete portfolio.positions[trade.symbol];
                            }
                        }
                    }
                    
                    // Calculate portfolio value after trade
                    runningTotalValue = calculatePortfolioValue(runningCash, portfolio.positions, stockPrices, currentDate);
                    
                    trade.runningBalance = runningTotalValue;
                    transactionData.push(trade);
                    transactionCount++;
                }
            }
        }
        
        // Advance time by 1 hour
        currentDate.setHours(currentDate.getHours() + 1);
    }
    
    // Update current portfolio state
    portfolio.cash = runningCash;
    portfolio.totalValue = runningTotalValue;
    
    console.log(`Generated ${transactionCount} realistic trades`);
    console.log(`Portfolio value: $${runningTotalValue.toFixed(2)}`);
    console.log('Current positions:', portfolio.positions);
}

// Populate transaction table with animation
function populateTransactionTable() {
    const tbody = document.getElementById('ledgerBody');
    tbody.innerHTML = '';
    
    console.log('📋 Populating transaction table with data:', transactionData);
    console.log('📋 Transaction count:', transactionData ? transactionData.length : 'No data');
    
    // Check if we have transaction data
    if (!transactionData || !Array.isArray(transactionData)) {
        console.warn('No transaction data available');
        return;
    }
    
    // Filter transactions from last 24 hours (or today if no time data available)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Since transactions.json only has dates (no times), show today's transactions
    const todayStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const yesterdayStr = oneDayAgo.toISOString().split('T')[0];
    
    console.log('📅 Looking for transactions from:', todayStr, 'and', yesterdayStr);
    
    const last24HourTransactions = transactionData.filter(transaction => {
        // Check if transaction and timestamp exist
        if (!transaction || !transaction.timestamp) {
            console.warn('Transaction missing timestamp:', transaction);
            return false;
        }
        
        let txDateStr;
        if (typeof transaction.timestamp === 'string') {
            // Extract date from timestamp (format: 2025-10-15T09:30:00Z)
            txDateStr = transaction.timestamp.split('T')[0];
        } else if (transaction.timestamp instanceof Date) {
            txDateStr = transaction.timestamp.toISOString().split('T')[0];
        } else {
            // Handle other date formats or invalid dates
            console.warn('Invalid transaction timestamp format:', transaction.timestamp);
            return false;
        }
        
        // Show transactions from today and yesterday
        return txDateStr === todayStr || txDateStr === yesterdayStr;
    }).reverse(); // Most recent first
    
    console.log('📋 Found transactions for display:', last24HourTransactions.length);
    console.log('📋 Transaction details:', last24HourTransactions);
    
    // If no transactions in last 24 hours, show message
    if (last24HourTransactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" style="text-align: center; padding: 20px; color: #888;">No transactions in the last 24 hours</td>`;
        tbody.appendChild(row);
        return;
    }
    
    last24HourTransactions.forEach((transaction, index) => {
        setTimeout(() => {
            const row = createTransactionRow(transaction);
            tbody.appendChild(row);
        }, index * 50); // Stagger the animations
    });
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
    const isPositive = action === 'BUY' || amount > 0;
    
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
    
    row.innerHTML = `
        <td>${txDate.toLocaleDateString()}</td>
        <td>${txDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        <td><span class="${action.toLowerCase()}">${action}</span></td>
        <td>${transaction.symbol}</td>
        <td>${quantityDisplay}</td>
        <td>$${transaction.price.toFixed(2)}</td>
        <td class="${isPositive ? 'buy' : 'sell'}">
            ${isPositive ? '+' : ''}$${Math.abs(amount).toFixed(2)}${profitDisplay}
        </td>
        <td class="running-balance">${transaction.runningBalance ? '$' + transaction.runningBalance.toFixed(2) : '-'}</td>
    `;
    
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
    
    // Simulate hourly market progression for demo
    setInterval(() => {
        if (shouldShowDemo()) {
            simulateHourlyMarketActivity();
        }
    }, 10000); // Every 10 seconds = 1 simulated hour for demo
    
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

// Check if we should show demo data (no real data available)
function shouldShowDemo() {
    // If we haven't received real data in the last 30 minutes, show demo
    // This is much more aggressive for money-making operations
    const lastRealDataUpdate = localStorage.getItem('lastRealDataUpdate');
    if (!lastRealDataUpdate) return true;
    
    const timeSinceLastUpdate = Date.now() - parseInt(lastRealDataUpdate);
    return timeSinceLastUpdate > 30 * 60 * 1000; // 30 minutes instead of 2 hours
}

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

// Update chart with real data
function updateChartWithRealData(data) {
    if (!performanceChart) {
        console.warn('Chart not initialized, cannot update');
        return;
    }
    
    console.log('📊 Updating chart with real data:', data);
    
    const datasets = ['brightflow', 'spy', 'vfiax', 'spdr'];
    const colors = ['#ffd700', '#ff4444', '#44ff44', '#4488ff'];
    
    datasets.forEach((key, index) => {
        const performanceArray = data.performance[key];
        console.log(`Processing ${key}:`, performanceArray);
        
        if (performanceArray && Array.isArray(performanceArray)) {
        // Values are already in the correct format from the JSON
        performanceChart.data.datasets[index].data = performanceArray.map(item => item.value);
            console.log(`✅ Updated ${key} dataset with ${performanceArray.length} data points`);
        } else {
            console.warn(`⚠️ No data found for ${key}, using empty array`);
            performanceChart.data.datasets[index].data = [];
        }
    });
    
    // Update labels with dates from brightflow data
    if (data.performance.brightflow && Array.isArray(data.performance.brightflow)) {
    performanceChart.data.labels = data.performance.brightflow.map(item => 
        new Date(item.date).toLocaleDateString()
    );
        console.log('✅ Updated chart labels with dates');
    } else {
        console.warn('⚠️ No brightflow data found for labels');
    }
    
    performanceChart.update('active');
    console.log('✅ Chart updated successfully');
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
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            },
            elements: {
                point: {
                    radius: 0
                }
            }
        }
    });
    
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
    
    const brightflowData = data.performance.brightflow || [];
    
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
    
    currentValueEl.textContent = '$' + displayValue.toFixed(2);
    dailyChangeEl.textContent = `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}% total return`;
    dailyChangeEl.className = 'performance-change ' + (totalReturn >= 0 ? 'positive' : 'negative');
    
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
        
        // If this is the first load and no real data, fall back to demo
        if (!localStorage.getItem('lastRealDataUpdate')) {
            console.log('No real data available, using demo mode');
            generateMockData();
            populateTransactionTable();
        }
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
function populateMobileTransactionList() {
    const mobileTransactionList = document.getElementById('mobileTransactionList');
    if (!mobileTransactionList) {
        console.log('📱 No mobile transaction list found');
        return;
    }
    
    console.log('📱 Populating mobile transaction list with data:', transactionData);
    console.log('📱 Mobile transaction list element found:', !!mobileTransactionList);
    
    // Clear existing content
    mobileTransactionList.innerHTML = '';
    
    // Check if we have transaction data
    if (!transactionData || !Array.isArray(transactionData)) {
        console.warn('📱 No transaction data available for mobile');
        mobileTransactionList.innerHTML = '<div class="mobile-no-transactions">No recent trades</div>';
        return;
    }
    
    // Filter transactions from last 24 hours (or today if no time data available)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Since transactions.json only has dates (no times), show today's transactions
    const todayStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const yesterdayStr = oneDayAgo.toISOString().split('T')[0];
    
    const last24HourTransactions = transactionData.filter(transaction => {
        // Check if transaction and timestamp exist
        if (!transaction || !transaction.timestamp) {
            return false;
        }
        
        let txDateStr;
        if (typeof transaction.timestamp === 'string') {
            // Extract date from timestamp (format: 2025-10-15T09:30:00Z)
            txDateStr = transaction.timestamp.split('T')[0];
        } else if (transaction.timestamp instanceof Date) {
            txDateStr = transaction.timestamp.toISOString().split('T')[0];
        } else {
            return false;
        }
        
        // Show transactions from today and yesterday
        return txDateStr === todayStr || txDateStr === yesterdayStr;
    }).reverse(); // Most recent first
    
    console.log('📱 Found transactions for mobile display:', last24HourTransactions.length);
    
    // If no transactions in last 24 hours, show message
    if (last24HourTransactions.length === 0) {
        mobileTransactionList.innerHTML = '<div class="mobile-no-transactions">No recent trades</div>';
        return;
    }
    
    // Show only the last 5 transactions for mobile
    const recentTransactions = last24HourTransactions.slice(0, 5);
    
    recentTransactions.forEach((transaction, index) => {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'mobile-transaction-item';
        
        const txDate = new Date(transaction.timestamp);
        const isPositive = transaction.amount > 0;
        
        transactionDiv.innerHTML = `
            <div class="mobile-transaction-header">
                <span class="mobile-transaction-symbol">${transaction.symbol}</span>
                <span class="mobile-transaction-action ${transaction.action.toLowerCase()}">${transaction.action}</span>
            </div>
            <div class="mobile-transaction-details">
                <span class="mobile-transaction-amount ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                </span>
                <span class="mobile-transaction-time">${txDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;
        
        mobileTransactionList.appendChild(transactionDiv);
    });
    
    console.log('✅ Mobile transaction list populated with', recentTransactions.length, 'transactions');
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
    const isPositive = transaction.amount > 0;
    const date = new Date(transaction.timestamp);
    
    row.innerHTML = `
        <td>${date.toLocaleDateString()}</td>
        <td>${date.toLocaleTimeString()}</td>
        <td><span class="${transaction.action.toLowerCase()}">${transaction.action}</span></td>
        <td>${transaction.symbol}</td>
        <td>${transaction.quantity}</td>
        <td>$${transaction.price.toFixed(2)}</td>
        <td class="${isPositive ? 'buy' : 'sell'}">
            ${isPositive ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
        </td>
        <td class="running-balance">$${transaction.runningBalance.toFixed(2)}</td>
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