// Chart.js configuration and animation setup
let performanceChart;
let transactionData = [];
let portfolio = {
    cash: 2100.00,           // Starting cash balance
    settledCash: 2100.00,    // Available for trading (T+1 settlement)
    positions: {},           // Stock positions: {symbol: {shares, avgPrice, marketValue}}
    totalValue: 2100.00,     // Total portfolio value
    startDate: new Date('2024-09-25'),
    startValue: 2100.00
};
let marketHour = 0; // Track simulated market hours since start

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    loadRealData();
    startRealTimeUpdates();
});

// Load real data from JSON files
async function loadRealData() {
    try {
        // Load performance data
        const performanceResponse = await fetch('./data/performance.json');
        const performanceData = await performanceResponse.json();
        
        // Load transaction data
        const transactionResponse = await fetch('./data/transactions.json');
        const transactionDataResponse = await transactionResponse.json();
        
        // Update chart with real data
        updateChartWithRealData(performanceData);
        
        // Update performance display
        updatePerformanceDisplayWithRealData(performanceData);
        
        // Update transaction table
        transactionData = transactionDataResponse.transactions;
        currentBalance = transactionDataResponse.currentBalance;
        populateTransactionTable();
        
    } catch (error) {
        console.warn('Could not load real data, falling back to mock data:', error);
        // Fallback to mock data if files don't exist yet
        generateMockData();
        populateTransactionTable();
    }
}

// Chart initialization with animations
function initializeChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Generate sample data from Sept 25, 2024 to current date
    const startDate = new Date('2024-09-25');
    const currentDate = new Date();
    const dates = generateDateRange(startDate, currentDate);
    
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(date => date.toLocaleDateString()),
            datasets: [
                {
                    label: 'BrightFlow Portfolio',
                    data: generatePortfolioPerformanceData(dates.length), // Realistic portfolio performance
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
                    data: generatePriceData(dates.length, 1.0, 0.015, 0.01), // 1.5% trend, 1% volatility
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
                    data: generatePriceData(dates.length, 1.0, 0.014, 0.008),
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
                    data: generatePriceData(dates.length, 1.0, 0.013, 0.009),
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
    
    // Calculate total return from starting value
    const totalReturn = ((portfolio.totalValue - portfolio.startValue) / portfolio.startValue) * 100;
    const changeText = totalReturn >= 0 ? '+' : '';
    
    // Animate value change
    const currentDisplayValue = parseFloat(currentValueEl.textContent.replace(/[$,]/g, ''));
    animateValue(currentValueEl, currentDisplayValue, portfolio.totalValue, 1000);
    
    // Update return percentage
    dailyChangeEl.textContent = `${changeText}${totalReturn.toFixed(2)}% total return`;
    dailyChangeEl.className = 'performance-change ' + (totalReturn >= 0 ? 'positive' : 'negative');
    
    // Also show cash vs invested breakdown in console for debugging
    const investedValue = portfolio.totalValue - portfolio.cash;
    console.log(`Portfolio: $${portfolio.totalValue.toFixed(2)} (Cash: $${portfolio.cash.toFixed(2)}, Invested: $${investedValue.toFixed(2)})`);
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
    
    currentValueEl.textContent = '$' + data.currentValue.toFixed(2);
    
    const changeText = data.dailyChange >= 0 ? '+' : '';
    dailyChangeEl.textContent = `${changeText}${(data.dailyChange * 100).toFixed(2)}% today`;
    dailyChangeEl.className = 'performance-change ' + (data.dailyChange >= 0 ? 'positive' : 'negative');
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