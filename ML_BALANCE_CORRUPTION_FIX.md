# 🚨 CRITICAL: Fix Balance Corruption in ML Trading Simulator

## Problem Statement

The ML repo's trading simulator is generating corrupted balance data with absurd values:

- **Current Balance**: $8,598,192,321,808.85 (8.6 TRILLION dollars!)
- **Transaction Amounts**: $476 BILLION and $452 BILLION dollar trades
- **Share Quantities**: 730 million, 772 million shares per trade
- **Expected Balance**: $2,000-$3,000 (started with $2,100)

This corruption cascades to:
1. `transactions.json` → `currentBalance` field
2. `performance.json` → `currentValue` field (shows 9.05 trillion)
3. Dashboard displays "ERROR" instead of portfolio value

## Root Cause

**The balance calculation is fundamentally wrong.**

### Current (Incorrect) Approach
The simulator is likely just tracking cash flow:
```python
balance = starting_cash + (sell_proceeds - buy_costs)
```

### Required (Correct) Approach
Portfolio balance MUST include both cash AND stock value:
```python
portfolio_balance = cash + sum(current_stock_price * shares_owned for each position)
```

## Complete Fix Requirements

### 1. Transaction Amount Limits
Each transaction must be realistic:

```python
# Transaction validation
MIN_TRANSACTION = 100    # $100 minimum
MAX_TRANSACTION = 5000   # $5,000 maximum

# Share quantity limits
MIN_SHARES = 0.01        # Fractional shares allowed
MAX_SHARES = 100         # Maximum 100 shares per trade
```

**Examples of valid transactions:**
- Buy 5.2 shares of AAPL at $267.50 = $1,391.00
- Sell 1.5 shares of TSLA at $315.20 = $472.80
- Buy 0.75 shares of NVDA at $950.00 = $712.50

### 2. Balance Calculation Formula

**CRITICAL: This is the proper way to calculate portfolio balance:**

```python
def calculate_portfolio_balance(cash, positions, current_prices):
    """
    Calculate total portfolio value: Cash + Stock Value

    Args:
        cash: Available cash balance
        positions: Dict of {symbol: shares_owned}
        current_prices: Dict of {symbol: current_price}

    Returns:
        Total portfolio balance
    """
    stock_value = sum(
        shares * current_prices[symbol]
        for symbol, shares in positions.items()
        if symbol in current_prices
    )

    total_balance = cash + stock_value

    return total_balance
```

**Example calculation:**
```python
# Starting state
cash = 1500.00

# Current positions
positions = {
    'AAPL': 1.5,    # 1.5 shares
    'MSFT': 2.0,    # 2.0 shares
    'NVDA': 0.5     # 0.5 shares
}

# Current market prices
current_prices = {
    'AAPL': 267.50,
    'MSFT': 425.00,
    'NVDA': 950.00
}

# Calculate stock value
stock_value = (1.5 * 267.50) + (2.0 * 425.00) + (0.5 * 950.00)
            = 401.25 + 850.00 + 475.00
            = 1726.25

# Total portfolio balance
portfolio_balance = cash + stock_value
                  = 1500.00 + 1726.25
                  = 3226.25
```

### 3. Balance Validation Ranges

```python
# Portfolio balance limits
MIN_BALANCE = 1000       # $1,000 minimum (can lose money)
MAX_BALANCE = 100000     # $100,000 maximum (40x growth from $2,500)
STARTING_BALANCE = 2100  # Actual starting investment

def validate_balance(balance):
    """Ensure balance is within reasonable limits"""
    if balance < MIN_BALANCE:
        raise ValueError(f"Balance ${balance:.2f} below minimum ${MIN_BALANCE}")

    if balance > MAX_BALANCE:
        raise ValueError(f"Balance ${balance:.2f} exceeds maximum ${MAX_BALANCE}")

    return True
```

### 4. Data Consistency Requirements

**Both data files must match:**

```python
# transactions.json
{
    "currentBalance": 2850.45,  # Must be cash + stock value
    "transactions": [...]
}

# performance.json
{
    "currentValue": 2850.45,    # MUST MATCH transactions.json currentBalance
    "brightflow": [
        {"date": "2025-11-23", "value": 135.74}  # (2850.45 / 2100) * 100
    ]
}
```

**Formula to convert balance to performance value:**
```python
# Normalize to base 100 (or base 1.0)
performance_value = (current_balance / starting_balance) * 100

# Example:
# current_balance = 2850.45
# starting_balance = 2100.00
# performance_value = (2850.45 / 2100.00) * 100 = 135.74
```

### 5. Transaction Recording

Each transaction must update BOTH cash AND positions:

```python
def execute_buy_order(symbol, shares, price):
    """Execute a buy order and update portfolio"""
    cost = shares * price

    # Validate we have enough cash
    if cash < cost:
        raise ValueError(f"Insufficient cash: ${cash:.2f} < ${cost:.2f}")

    # Update cash (subtract cost)
    cash -= cost

    # Update positions (add shares)
    if symbol not in positions:
        positions[symbol] = 0
    positions[symbol] += shares

    # Record transaction
    transaction = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "symbol": symbol,
        "action": "BUY",
        "shares": shares,
        "price": price,
        "amount": cost,
        "balance": calculate_portfolio_balance(cash, positions, current_prices)
    }

    return transaction

def execute_sell_order(symbol, shares, price):
    """Execute a sell order and update portfolio"""
    proceeds = shares * price

    # Validate we have enough shares
    if positions.get(symbol, 0) < shares:
        raise ValueError(f"Insufficient shares: {positions.get(symbol, 0)} < {shares}")

    # Update cash (add proceeds)
    cash += proceeds

    # Update positions (subtract shares)
    positions[symbol] -= shares
    if positions[symbol] <= 0:
        del positions[symbol]

    # Record transaction
    transaction = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "symbol": symbol,
        "action": "SELL",
        "shares": shares,
        "price": price,
        "amount": proceeds,
        "balance": calculate_portfolio_balance(cash, positions, current_prices)
    }

    return transaction
```

## Data Format Specifications

### transactions.json
```json
{
    "lastUpdated": "2025-11-23T19:30:00Z",
    "totalTransactions": 250,
    "currentBalance": 2850.45,
    "cashBalance": 1500.00,
    "stockValue": 1350.45,
    "positions": {
        "AAPL": {"shares": 1.5, "avgPrice": 265.00, "currentPrice": 267.50},
        "MSFT": {"shares": 2.0, "avgPrice": 420.00, "currentPrice": 425.00}
    },
    "transactions": [
        {
            "timestamp": "2025-11-23T19:25:15.234Z",
            "symbol": "AAPL",
            "action": "BUY",
            "shares": 0.5,
            "price": 267.50,
            "amount": 133.75,
            "balance": 2850.45
        }
    ]
}
```

### performance.json
```json
{
    "currentValue": 2850.45,
    "lastUpdated": "2025-11-23T19:30:00Z",
    "brightflow": [
        {"date": "2024-09-25", "value": 100.00},
        {"date": "2024-09-26", "value": 101.25},
        {"date": "2025-11-23", "value": 135.74}
    ],
    "spy": [...],
    "marketIndices": {...}
}
```

## Validation Checklist

Before pushing data to sandbox, validate:

- [ ] `currentBalance` is between $1,000 and $100,000
- [ ] All transaction amounts are between $100 and $5,000
- [ ] All share quantities are between 0.01 and 100 shares
- [ ] `transactions.json` currentBalance matches `performance.json` currentValue
- [ ] Balance = Cash + (Current Stock Prices × Shares Owned)
- [ ] No absurd values (trillions, billions, millions)
- [ ] All timestamps are ISO 8601 format with UTC timezone
- [ ] BrightFlow performance array last value matches normalized currentValue

## Expected Behavior

### Realistic Trading Example

```
Starting Balance: $2,100.00
Date: 2024-09-25

Day 1:
- Buy 1.5 shares AAPL @ $265.00 = $397.50
- Cash: $2,100 - $397.50 = $1,702.50
- Stock Value: 1.5 × $265.00 = $397.50
- Portfolio Balance: $1,702.50 + $397.50 = $2,100.00 ✓

Day 2: (AAPL rises to $267.50)
- Cash: $1,702.50 (unchanged)
- Stock Value: 1.5 × $267.50 = $401.25 (gain!)
- Portfolio Balance: $1,702.50 + $401.25 = $2,103.75 ✓

Day 3:
- Sell 0.5 shares AAPL @ $270.00 = $135.00
- Cash: $1,702.50 + $135.00 = $1,837.50
- Stock Value: 1.0 × $270.00 = $270.00
- Portfolio Balance: $1,837.50 + $270.00 = $2,107.50 ✓
```

### Performance Normalization

```
Day 1: $2,100.00 → 100.00 (baseline)
Day 2: $2,103.75 → 100.18 (+0.18%)
Day 3: $2,107.50 → 100.36 (+0.36%)
```

## Testing Commands

```bash
# Test balance validation
python -c "
balance = 8598192321808.85
if balance > 100000:
    print(f'❌ FAIL: Balance {balance} is absurd (> $100,000)')
else:
    print(f'✅ PASS: Balance {balance} is valid')
"

# Validate transaction amounts
jq '.transactions[] | select(.amount > 5000 or .amount < 100)' data/transactions.json

# Verify balance matches currentValue
jq '{balance: .currentBalance}' data/transactions.json
jq '{currentValue: .currentValue}' data/performance.json

# Check for consistency
python -c "
import json
with open('data/transactions.json') as f:
    t = json.load(f)
with open('data/performance.json') as f:
    p = json.load(f)

if abs(t['currentBalance'] - p['currentValue']) > 0.01:
    print('❌ FAIL: Balance mismatch!')
else:
    print('✅ PASS: Balances match')
"
```

## Priority

**CRITICAL - P0**

This bug completely breaks the dashboard and displays corrupted financial data to users. Fix must be deployed before next trading session.

---

**Created:** 2025-11-23
**Status:** 🚨 CRITICAL BUG - Immediate fix required
**Owner:** ML Team
**Related Files:**
- `transactions.json` (corrupted currentBalance)
- `performance.json` (corrupted currentValue and brightflow data)
- ML trading simulator code (root cause)
