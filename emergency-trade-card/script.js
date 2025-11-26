// Emergency Trade Card JavaScript
const API_BASE = '/api/emergency-trade';
const STOCK_PULLER_API = 'http://stock-puller-service.brightflow-ml.svc.cluster.local:80/api/stock';

// State
let currentPrice = null;
let selectedRoute = 'immediate';

// DOM Elements
const tradeAction = document.getElementById('tradeAction');
const tradeSymbol = document.getElementById('tradeSymbol');
const tradeQuantity = document.getElementById('tradeQuantity');
const orderType = document.getElementById('orderType');
const limitPrice = document.getElementById('limitPrice');
const limitPriceSection = document.getElementById('limitPriceSection');
const stopLoss = document.getElementById('stopLoss');
const takeProfit = document.getElementById('takeProfit');

const currentPriceDisplay = document.getElementById('currentPrice');
const displayQuantity = document.getElementById('displayQuantity');
const stopLossPriceDisplay = document.getElementById('stopLossPrice');
const takeProfitPriceDisplay = document.getElementById('takeProfitPrice');
const totalValueDisplay = document.getElementById('totalValue');

const routeButtons = document.querySelectorAll('.route-button');
const executeButton = document.getElementById('executeButton');
const cancelButton = document.getElementById('cancelButton');
const statusMessage = document.getElementById('statusMessage');

const docModal = document.getElementById('docModal');
const closeModal = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');

// Event Listeners
orderType.addEventListener('change', () => {
    if (orderType.value === 'LIMIT') {
        limitPriceSection.style.display = 'grid';
    } else {
        limitPriceSection.style.display = 'none';
    }
});

tradeSymbol.addEventListener('blur', async () => {
    const symbol = tradeSymbol.value.trim().toUpperCase();
    if (symbol) {
        await fetchStockPrice(symbol);
    }
});

tradeSymbol.addEventListener('input', () => {
    tradeSymbol.value = tradeSymbol.value.toUpperCase();
});

[tradeQuantity, stopLoss, takeProfit, limitPrice].forEach(input => {
    input.addEventListener('input', calculateTrade);
});

routeButtons.forEach(button => {
    button.addEventListener('click', () => {
        routeButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedRoute = button.dataset.route;
    });
});

executeButton.addEventListener('click', executeTrade);
cancelButton.addEventListener('click', resetForm);

// Help link handlers
document.getElementById('howItWorksLink').addEventListener('click', (e) => {
    e.preventDefault();
    showDocumentation('how-it-works');
});

document.getElementById('techDetailsLink').addEventListener('click', (e) => {
    e.preventDefault();
    showDocumentation('tech-details');
});

document.getElementById('apiDocsLink').addEventListener('click', (e) => {
    e.preventDefault();
    showDocumentation('api-docs');
});

closeModal.addEventListener('click', () => {
    docModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === docModal) {
        docModal.style.display = 'none';
    }
});

// Functions
async function fetchStockPrice(symbol) {
    try {
        showStatus('Fetching price...', 'info');

        // Try stock-puller service first
        const response = await fetch(`${STOCK_PULLER_API}/${symbol}`);

        if (response.ok) {
            const data = await response.json();
            currentPrice = parseFloat(data.price || data.current_price || data.last_price);

            currentPriceDisplay.textContent = `$${currentPrice.toFixed(2)}`;
            calculateTrade();
            showStatus(`Price for ${symbol}: $${currentPrice.toFixed(2)}`, 'success');
        } else {
            throw new Error('Stock not found');
        }
    } catch (error) {
        showStatus(`Error fetching price for ${symbol}: ${error.message}`, 'error');
        currentPrice = null;
        currentPriceDisplay.textContent = '--';
    }
}

function calculateTrade() {
    const quantity = parseFloat(tradeQuantity.value) || 0;
    const stopLossPercent = parseFloat(stopLoss.value) || 0;
    const takeProfitPercent = parseFloat(takeProfit.value) || 0;
    const action = tradeAction.value;

    if (!currentPrice || quantity === 0) {
        return;
    }

    // Display quantity
    displayQuantity.textContent = quantity.toFixed(4);

    // Calculate stop loss and take profit prices
    let stopLossPrice, takeProfitPrice;

    if (action === 'BUY') {
        stopLossPrice = currentPrice * (1 - stopLossPercent / 100);
        takeProfitPrice = currentPrice * (1 + takeProfitPercent / 100);
    } else {
        // For SELL, inverse the logic
        stopLossPrice = currentPrice * (1 + stopLossPercent / 100);
        takeProfitPrice = currentPrice * (1 - takeProfitPercent / 100);
    }

    stopLossPriceDisplay.textContent = `$${stopLossPrice.toFixed(2)}`;
    takeProfitPriceDisplay.textContent = `$${takeProfitPrice.toFixed(2)}`;

    // Calculate total value
    const totalValue = currentPrice * quantity;
    totalValueDisplay.textContent = `$${totalValue.toFixed(2)}`;
}

async function executeTrade() {
    const symbol = tradeSymbol.value.trim().toUpperCase();
    const quantity = parseFloat(tradeQuantity.value);
    const action = tradeAction.value;
    const stopLossPercent = parseFloat(stopLoss.value);
    const takeProfitPercent = parseFloat(takeProfit.value);
    const orderTypeValue = orderType.value;
    const limitPriceValue = orderTypeValue === 'LIMIT' ? parseFloat(limitPrice.value) : null;

    // Validation
    if (!symbol) {
        showStatus('Please enter a stock symbol', 'error');
        return;
    }

    if (!quantity || quantity <= 0) {
        showStatus('Please enter a valid quantity', 'error');
        return;
    }

    if (!currentPrice) {
        showStatus('Please wait for price to load', 'error');
        return;
    }

    if (stopLossPercent < 3) {
        showStatus('Stop loss must be at least 3%', 'error');
        return;
    }

    if (takeProfitPercent < 5) {
        showStatus('Take profit must be at least 5%', 'error');
        return;
    }

    if (orderTypeValue === 'LIMIT' && (!limitPriceValue || limitPriceValue <= 0)) {
        showStatus('Please enter a valid limit price', 'error');
        return;
    }

    // Confirm
    const totalValue = currentPrice * quantity;
    const confirmMessage = `Confirm ${action} ${quantity} shares of ${symbol} @ $${currentPrice.toFixed(2)}?\\n\\nTotal: $${totalValue.toFixed(2)}\\nStop Loss: ${stopLossPercent}%\\nTake Profit: ${takeProfitPercent}%\\n\\nRoute: ${selectedRoute.toUpperCase()}`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // Disable button
    executeButton.disabled = true;
    executeButton.textContent = 'EXECUTING...';

    try {
        const tradeData = {
            symbol,
            action,
            quantity,
            order_type: orderTypeValue,
            limit_price: limitPriceValue,
            current_price: currentPrice,
            stop_loss_percent: stopLossPercent,
            take_profit_percent: takeProfitPercent,
            route: selectedRoute
        };

        const response = await fetch(`${API_BASE}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tradeData)
        });

        const result = await response.json();

        if (response.ok) {
            showStatus(
                `✅ Trade executed successfully!\\n` +
                `Order ID: ${result.order_id || 'Pending'}\\n` +
                `Status: ${result.status}\\n` +
                `${result.message || ''}`,
                'success'
            );

            // Reset form after 3 seconds
            setTimeout(resetForm, 3000);
        } else {
            throw new Error(result.error || 'Trade execution failed');
        }
    } catch (error) {
        showStatus(`❌ Error: ${error.message}`, 'error');
    } finally {
        executeButton.disabled = false;
        executeButton.textContent = 'EXECUTE TRADE';
    }
}

function resetForm() {
    tradeSymbol.value = '';
    tradeQuantity.value = '';
    limitPrice.value = '';
    stopLoss.value = '3.0';
    takeProfit.value = '5.0';
    currentPrice = null;

    currentPriceDisplay.textContent = '--';
    displayQuantity.textContent = '--';
    stopLossPriceDisplay.textContent = '--';
    takeProfitPriceDisplay.textContent = '--';
    totalValueDisplay.textContent = '$0.00';

    statusMessage.className = 'status-message';
    statusMessage.textContent = '';
}

function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;

    if (type !== 'error') {
        setTimeout(() => {
            statusMessage.classList.remove('show');
        }, 5000);
    }
}

function showDocumentation(type) {
    let content = '';

    if (type === 'how-it-works') {
        content = `
            <h2>How It Works</h2>

            <h3>Emergency Trade Interface</h3>
            <p>This interface allows you to execute trades instantly, bypassing the normal AI recommendation queue for urgent situations.</p>

            <h3>Trading Routes:</h3>
            <ul>
                <li><strong>Immediate (⚡)</strong>: Executes trade directly via IBKR Gateway within 30 seconds</li>
                <li><strong>Spock Review (🖖)</strong>: Sends to Spock AI for value investing analysis before execution</li>
                <li><strong>Jackson Review (💼)</strong>: Sends to Jackson AI for momentum trading review</li>
            </ul>

            <h3>Risk Management:</h3>
            <p>All trades include automatic risk management:</p>
            <ul>
                <li><strong>Stop Loss</strong>: Minimum 3% - automatically exits position if price moves against you</li>
                <li><strong>Take Profit</strong>: Minimum 5% - automatically secures profit when target is reached</li>
            </ul>

            <h3>Order Types:</h3>
            <ul>
                <li><strong>Market Order</strong>: Executes at current market price immediately</li>
                <li><strong>Limit Order</strong>: Executes only at your specified price or better</li>
            </ul>

            <h3>Fractional Shares:</h3>
            <p>You can trade fractional shares (e.g., 0.5, 0.25) to fit your budget and risk tolerance.</p>
        `;
    } else if (type === 'tech-details') {
        content = `
            <h2>Technical Details</h2>

            <h3>Architecture:</h3>
            <ul>
                <li><strong>Stock Price Data</strong>: Real-time prices from stock-puller-service via IBKR Gateway</li>
                <li><strong>Order Execution</strong>: Direct integration with IBKR paper trading account</li>
                <li><strong>Database</strong>: PostgreSQL with trades recorded in <code>ibkr_paper_trades</code> table</li>
                <li><strong>Balance Updates</strong>: Real-time balance sync from IBKR every 5 minutes</li>
            </ul>

            <h3>Backend API:</h3>
            <p>Endpoint: <code>POST /api/emergency-trade/execute</code></p>

            <h3>Request Format:</h3>
            <pre><code>{
  "symbol": "AAPL",
  "action": "BUY",
  "quantity": 0.5,
  "order_type": "MARKET",
  "current_price": 180.50,
  "stop_loss_percent": 3.0,
  "take_profit_percent": 5.0,
  "route": "immediate"
}</code></pre>

            <h3>Security:</h3>
            <ul>
                <li>Paper trading account only (no real money)</li>
                <li>Price validation (30% threshold)</li>
                <li>PDT protection (max 3 day trades per 5 days)</li>
                <li>Position size limits (max $100 per position)</li>
            </ul>
        `;
    } else if (type === 'api-docs') {
        content = `
            <h2>API Documentation</h2>

            <h3>Endpoints:</h3>

            <h4>1. Execute Trade</h4>
            <p><code>POST /api/emergency-trade/execute</code></p>
            <p>Executes an emergency trade via IBKR Gateway.</p>

            <h4>Request Body:</h4>
            <pre><code>{
  "symbol": string,           // Stock symbol (e.g., "AAPL")
  "action": "BUY" | "SELL",   // Trade action
  "quantity": number,          // Number of shares (fractional OK)
  "order_type": "MARKET" | "LIMIT",
  "limit_price": number,       // Required if order_type is LIMIT
  "current_price": number,     // Current market price
  "stop_loss_percent": number, // Min 3.0
  "take_profit_percent": number, // Min 5.0
  "route": "immediate" | "spock" | "jackson"
}</code></pre>

            <h4>Response:</h4>
            <pre><code>{
  "success": true,
  "order_id": "12345",
  "status": "filled",
  "message": "Trade executed successfully",
  "execution_price": 180.50,
  "filled_quantity": 0.5,
  "total_value": 90.25
}</code></pre>

            <h4>2. Get Current Price</h4>
            <p><code>GET /api/stock/{symbol}</code></p>
            <p>Fetches real-time stock price from IBKR Gateway.</p>

            <h4>Response:</h4>
            <pre><code>{
  "symbol": "AAPL",
  "price": "180.50",
  "bid": "180.45",
  "ask": "180.55",
  "volume": "50M",
  "change": "+2.30",
  "change_percent": 1.29
}</code></pre>

            <h3>Error Codes:</h3>
            <ul>
                <li><code>400</code>: Invalid request (missing fields, validation errors)</li>
                <li><code>404</code>: Symbol not found</li>
                <li><code>503</code>: IBKR Gateway not available</li>
                <li><code>500</code>: Internal server error</li>
            </ul>
        `;
    }

    modalBody.innerHTML = content;
    docModal.style.display = 'flex';
}
