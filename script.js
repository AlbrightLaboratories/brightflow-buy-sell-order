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
let currentTimeRange = '14d'; // Default view

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
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
    const buttons = document.querySelectorAll('.time-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            buttons.forEach(btn => btn.classList.remove('active'));
            
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
    if (!performanceChart || !historicalData) return;
    
    const chartData = getDataForTimeRange(range);
    
    // Update chart data
    performanceChart.data.labels = chartData.labels;
    performanceChart.data.datasets[0].data = chartData.brightflow;
    performanceChart.data.datasets[1].data = chartData.spy;
    performanceChart.data.datasets[2].data = chartData.vfiax;
    performanceChart.data.datasets[3].data = chartData.spdr;
    
    // Update chart with smooth animation
    performanceChart.update('active');
    
    // Update performance display for the selected period
    updatePerformanceForPeriod(range, chartData);
}

// Load real data from JSON files and initialize portfolio dynamically
async function loadRealData() {
    try {
        // Load performance data
        const performanceResponse = await fetch('./data/performance.json');
        const performanceData = await performanceResponse.json();
        
        // Load transaction data
        const transactionResponse = await fetch('./data/transactions.json');
        const transactionDataResponse = await transactionResponse.json();
        
        // Initialize portfolio from real data
        initializePortfolioFromData(performanceData, transactionDataResponse);
        
        // Set historical data from performance file
        historicalData = convertPerformanceDataToHistorical(performanceData);
        
        // Update chart with real data
        updateChartWithRealData(performanceData);
        
        // Update performance display
        updatePerformanceDisplayWithRealData(performanceData);
        
        // Update transaction table
        transactionData = transactionDataResponse.transactions;
        populateTransactionTable();
        
        // Mark that we have real data loaded to prevent demo mode
        localStorage.setItem('lastRealDataUpdate', Date.now().toString());
        localStorage.setItem('lastDataUpdate', performanceData.lastUpdated);
        
    } catch (error) {
        console.warn('Could not load real data, falling back to mock data:', error);
        // Fallback to mock data if files don't exist yet
        generateMockData();
        populateTransactionTable();
    }
}

// Initialize portfolio values from actual data files
function initializePortfolioFromData(performanceData, transactionData) {
    // Set current value from performance data (this is the normalized value)
    portfolio.currentValue = performanceData.currentValue;
    portfolio.totalValue = performanceData.currentValue; // Keep it as normalized value
    
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
    
    // Show most recent transactions first
    const recentTransactions = [...transactionData].reverse().slice(0, 50);
    
    recentTransactions.forEach((transaction, index) => {
        setTimeout(() => {
            const row = createTransactionRow(transaction);
            tbody.appendChild(row);
        }, index * 50); // Stagger the animations
    });
}

// Create a transaction row element
function createTransactionRow(transaction) {
    const row = document.createElement('tr');
    const isPositive = transaction.amount > 0;
    
    // Format fractional shares properly
    const quantityDisplay = transaction.quantity < 1 ? 
        transaction.quantity.toFixed(4) : 
        transaction.quantity.toFixed(2);
    
    row.innerHTML = `
        <td>${transaction.date.toLocaleDateString()}</td>
        <td>${transaction.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        <td><span class="${transaction.action.toLowerCase()}">${transaction.action}</span></td>
        <td>${transaction.symbol}</td>
        <td>${quantityDisplay}</td>
        <td>$${transaction.price.toFixed(2)}</td>
        <td class="${isPositive ? 'buy' : 'sell'}">
            ${isPositive ? '+' : ''}$${Math.abs(transaction.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </td>
        <td class="running-balance">$${transaction.runningBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
    `;
    
    // Add strategy info as tooltip if available
    if (transaction.strategy && transaction.confidence) {
        row.title = `Strategy: ${transaction.strategy} | Confidence: ${(transaction.confidence * 100).toFixed(1)}%`;
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

// Schedule data updates based on market hours (4:30 AM - 8:00 PM EST)
function scheduleDataUpdates() {
    const checkDataUpdate = () => {
        const now = new Date();
        const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        const hour = est.getHours();
        const minute = est.getMinutes();
        
        // Check if we're in active hours (4:30 AM - 8:00 PM EST)
        const isActiveHours = (hour > 4 || (hour === 4 && minute >= 30)) && hour < 20;
        
        if (isActiveHours) {
            console.log('Active trading hours - checking for data updates');
            checkForUpdates();
        } else {
            console.log('Outside trading hours - using demo mode');
        }
    };
    
    // Check immediately
    checkDataUpdate();
    
    // Then check every hour
    setInterval(checkDataUpdate, 60 * 60 * 1000); // 1 hour
    
    // Also check every 5 minutes during active hours for more frequent updates
    setInterval(() => {
        const now = new Date();
        const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        const hour = est.getHours();
        const minute = est.getMinutes();
        
        const isActiveHours = (hour > 4 || (hour === 4 && minute >= 30)) && hour < 20;
        if (isActiveHours) {
            checkForUpdates();
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Check if we should show demo data (no real data available)
function shouldShowDemo() {
    // If we haven't received real data in the last 2 hours, show demo
    const lastRealDataUpdate = localStorage.getItem('lastRealDataUpdate');
    if (!lastRealDataUpdate) return true;
    
    const timeSinceLastUpdate = Date.now() - parseInt(lastRealDataUpdate);
    return timeSinceLastUpdate > 2 * 60 * 60 * 1000; // 2 hours
}

// Update the performance display with animation
function updatePerformanceDisplay() {
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
    if (!performanceChart) return;
    
    const datasets = ['brightflow', 'spy', 'vfiax', 'spdr'];
    const colors = ['#ffd700', '#ff4444', '#44ff44', '#4488ff'];
    
    datasets.forEach((key, index) => {
        const performanceArray = data.performance[key];
        // Values are already in the correct format from the JSON
        performanceChart.data.datasets[index].data = performanceArray.map(item => item.value);
    });
    
    // Update labels with dates
    performanceChart.data.labels = data.performance.brightflow.map(item => 
        new Date(item.date).toLocaleDateString()
    );
    
    performanceChart.update('active');
}

// Update performance display with real data
function updatePerformanceDisplayWithRealData(data) {
    const currentValueEl = document.getElementById('currentValue');
    const dailyChangeEl = document.getElementById('dailyChange');
    
    // Show the normalized value directly (what $1.00 is worth now)
    const normalizedValue = data.currentValue;
    currentValueEl.textContent = '$' + normalizedValue.toFixed(2);
    
    // Calculate total return percentage from normalized baseline (1.00)
    const totalReturn = ((normalizedValue - portfolio.startValue) / portfolio.startValue) * 100;
    dailyChangeEl.textContent = `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}% total return`;
    dailyChangeEl.className = 'performance-change ' + (totalReturn >= 0 ? 'positive' : 'negative');
    
    console.log('Performance Display Updated:', {
        normalizedValue: normalizedValue,
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
        
        if (!storedLastUpdate || new Date(storedLastUpdate) < lastUpdated) {
            console.log('New data available, updating charts and tables');
            
            // Update charts and display
            updateChartWithRealData(performanceData);
            updatePerformanceDisplayWithRealData(performanceData);
            
            // Update transaction data
            transactionData.transactions = transactionData.transactions || [];
            populateTransactionTableWithRealData(transactionData);
            
            // Store the update time
            localStorage.setItem('lastDataUpdate', performanceData.lastUpdated);
            localStorage.setItem('lastRealDataUpdate', Date.now().toString());
            
            // Show success indicator
            showUpdateIndicator('success');
        } else {
            console.log('No new data available');
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
            
            // For now, just show an alert
            const text = this.textContent;
            alert(`"${text}" feature coming soon!`);
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

// Stock Search Functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('stockSearch');
    const searchButton = document.getElementById('searchButton');
    const priceDisplay = document.getElementById('stockPriceDisplay');
    const stockSymbol = document.getElementById('stockSymbol');
    const stockPrice = document.getElementById('stockPrice');
    const priceChange = document.getElementById('priceChange');

    // Mock stock data for demo (replace with real API later)
    const mockStockData = {
        'AAPL': { price: 175.43, change: 2.34, changePercent: 1.35 },
        'MSFT': { price: 332.89, change: -1.23, changePercent: -0.37 },
        'GOOGL': { price: 138.21, change: 0.87, changePercent: 0.63 },
        'TSLA': { price: 248.50, change: -4.12, changePercent: -1.63 },
        'AMZN': { price: 127.74, change: 3.21, changePercent: 2.58 },
        'NVDA': { price: 118.32, change: 5.67, changePercent: 5.03 },
        'META': { price: 501.25, change: -2.10, changePercent: -0.42 },
        'NFLX': { price: 485.73, change: 8.45, changePercent: 1.77 },
        'SPY': { price: 428.67, change: 1.23, changePercent: 0.29 },
        'QQQ': { price: 372.14, change: 2.87, changePercent: 0.78 }
    };

    function searchStock() {
        const symbol = searchInput.value.trim().toUpperCase();
        
        if (!symbol) {
            alert('Please enter a stock symbol');
            return;
        }

        // Show loading state
        stockSymbol.textContent = symbol;
        stockPrice.textContent = 'Loading...';
        priceChange.textContent = '';
        priceDisplay.classList.add('active');

        // Simulate API delay
        setTimeout(() => {
            if (mockStockData[symbol]) {
                const data = mockStockData[symbol];
                displayStockData(symbol, data);
            } else {
                displayError(symbol);
            }
        }, 500);
    }

    function displayStockData(symbol, data) {
        stockSymbol.textContent = symbol;
        stockPrice.textContent = `$${data.price.toFixed(2)}`;
        
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSign = data.change >= 0 ? '+' : '';
        priceChange.textContent = `${changeSign}$${data.change.toFixed(2)} (${changeSign}${data.changePercent.toFixed(2)}%)`;
        priceChange.className = `price-change ${changeClass}`;
    }

    function displayError(symbol) {
        stockSymbol.textContent = symbol;
        stockPrice.textContent = 'Not Found';
        priceChange.textContent = 'Symbol not available';
        priceChange.className = 'price-change negative';
    }

    // Event listeners
    searchButton.addEventListener('click', searchStock);
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStock();
        }
    });

    searchInput.addEventListener('input', function() {
        // Auto-uppercase and limit to 10 characters
        this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 10);
    });

    // Hide price display when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!priceDisplay.contains(e.target) && 
            !searchInput.contains(e.target) && 
            !searchButton.contains(e.target)) {
            if (priceDisplay.classList.contains('active')) {
                setTimeout(() => {
                    priceDisplay.classList.remove('active');
                }, 3000); // Hide after 3 seconds
            }
        }
    });
});