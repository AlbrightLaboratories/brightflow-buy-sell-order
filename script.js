// Chart.js configuration and animation setup
let performanceChart;
let transactionData = [];
let currentBalance = 1000; // Starting balance

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
                    label: 'BrightFlow',
                    data: generatePriceData(dates.length, 1.0, 0.03, 0.02), // 3% trend, 2% volatility
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

// Generate mock transaction data
function generateMockData() {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
    const actions = ['BUY', 'SELL'];
    
    // Generate 50 transactions over the past month
    for (let i = 0; i < 50; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        const action = actions[Math.floor(Math.random() * actions.length)];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const quantity = Math.floor(Math.random() * 100) + 1;
        const price = Math.random() * 200 + 50;
        const amount = quantity * price * (action === 'SELL' ? 1 : -1);
        
        currentBalance += amount;
        
        transactionData.push({
            date: date,
            action: action,
            symbol: symbol,
            quantity: quantity,
            price: price,
            amount: amount,
            runningBalance: currentBalance
        });
    }
    
    // Sort by date (oldest first)
    transactionData.sort((a, b) => a.date - b.date);
    
    // Recalculate running balances
    let balance = 1000;
    transactionData.forEach(transaction => {
        balance += transaction.amount;
        transaction.runningBalance = balance;
    });
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
    
    row.innerHTML = `
        <td>${transaction.date.toLocaleDateString()}</td>
        <td>${transaction.date.toLocaleTimeString()}</td>
        <td><span class="${transaction.action.toLowerCase()}">${transaction.action}</span></td>
        <td>${transaction.symbol}</td>
        <td>${transaction.quantity}</td>
        <td>$${transaction.price.toFixed(2)}</td>
        <td class="${isPositive ? 'buy' : 'sell'}">
            ${isPositive ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
        </td>
        <td class="running-balance">$${transaction.runningBalance.toFixed(2)}</td>
    `;
    
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

// Generate realistic price data with trend and volatility
function generatePriceData(numPoints, startPrice, trendRate, volatility) {
    const data = [startPrice];
    
    for (let i = 1; i < numPoints; i++) {
        const trend = trendRate / 365; // Daily trend
        const randomChange = (Math.random() - 0.5) * volatility;
        const newPrice = data[i - 1] * (1 + trend + randomChange);
        data.push(Math.max(0.1, newPrice)); // Ensure price doesn't go negative
    }
    
    return data;
}

// Real-time updates with intelligent scheduling
function startRealTimeUpdates() {
    // Initial update
    updatePerformanceDisplay();
    
    // Set up intelligent polling based on time
    scheduleDataUpdates();
    
    // Fallback demo updates if no real data
    setInterval(() => {
        if (shouldShowDemo()) {
            addNewTransaction();
            updateChart();
        }
    }, 30000); // Every 30 seconds for demo
    
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
    
    // Get the latest BrightFlow value from chart
    if (performanceChart && performanceChart.data.datasets[0].data.length > 0) {
        const latestValue = performanceChart.data.datasets[0].data.slice(-1)[0];
        const previousValue = performanceChart.data.datasets[0].data.slice(-2, -1)[0] || 1.0;
        
        const change = ((latestValue - previousValue) / previousValue) * 100;
        const changeText = change >= 0 ? '+' : '';
        
        // Animate value change
        animateValue(currentValueEl, parseFloat(currentValueEl.textContent.replace('$', '')), latestValue, 1000);
        
        dailyChangeEl.textContent = `${changeText}${change.toFixed(2)}% today`;
        dailyChangeEl.className = 'performance-change ' + (change >= 0 ? 'positive' : 'negative');
    }
}

// Animate number changes
function animateValue(element, start, end, duration) {
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * easeOutCubic(progress);
        element.textContent = '$' + current.toFixed(2);
        
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

// Add new transaction with animation
function addNewTransaction() {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    const actions = ['BUY', 'SELL'];
    
    const action = actions[Math.floor(Math.random() * actions.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const quantity = Math.floor(Math.random() * 50) + 1;
    const price = Math.random() * 100 + 100;
    const amount = quantity * price * (action === 'SELL' ? 1 : -1);
    
    currentBalance += amount;
    
    const newTransaction = {
        date: new Date(),
        action: action,
        symbol: symbol,
        quantity: quantity,
        price: price,
        amount: amount,
        runningBalance: currentBalance
    };
    
    // Add to data array
    transactionData.push(newTransaction);
    
    // Add to table with animation
    const tbody = document.getElementById('ledgerBody');
    const newRow = createTransactionRow(newTransaction);
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