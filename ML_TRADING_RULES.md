# 🔒 BrightFlow Trading Rules - No Fictional Money

## Core Principle

**ONLY USE MONEY WE ACTUALLY HAVE. NEVER MAKE UP FICTIONAL NUMBERS.**

## Starting Conditions

```python
# This is ALL the money we have
STARTING_CASH = 2100.00  # $2,100 real dollars
STARTING_POSITIONS = {}  # No stocks owned initially

# These are HARD LIMITS - can never be violated
cash = 2100.00
positions = {}
```

## Rule 1: Cash Constraint (No Margin, No Leverage, No Fake Money)

**You can ONLY buy stocks if you have enough cash.**

```python
def can_buy(symbol, shares, price):
    """Check if we have enough REAL cash to buy"""
    cost = shares * price

    if cash < cost:
        # ❌ REJECT - We don't have this money!
        return False

    return True

# Example:
cash = 500.00
can_buy("AAPL", 10, 267.50)  # Cost = $2,675
# ❌ REJECTED - We only have $500, not $2,675!

can_buy("AAPL", 1, 267.50)  # Cost = $267.50
# ✅ ALLOWED - We have $500, can afford $267.50
```

**NEVER ALLOW:**
- ❌ Margin trading (borrowing money)
- ❌ Leverage (trading with more than you have)
- ❌ Short selling (selling stocks you don't own)
- ❌ Credit/loans
- ❌ Made-up cash balances

## Rule 2: Position Constraint (Can't Sell What You Don't Own)

**You can ONLY sell stocks you actually own.**

```python
def can_sell(symbol, shares):
    """Check if we own enough shares to sell"""
    owned = positions.get(symbol, 0)

    if owned < shares:
        # ❌ REJECT - We don't own these shares!
        return False

    return True

# Example:
positions = {"AAPL": 1.5}  # We own 1.5 shares of AAPL

can_sell("AAPL", 2.0)
# ❌ REJECTED - We only own 1.5 shares, can't sell 2.0!

can_sell("AAPL", 1.0)
# ✅ ALLOWED - We own 1.5 shares, can sell 1.0

can_sell("TSLA", 1.0)
# ❌ REJECTED - We don't own ANY TSLA shares!
```

## Rule 3: Every Transaction Must Update Cash AND Positions

```python
def execute_buy(symbol, shares, price):
    """Buy stocks - ONLY if we have enough cash"""
    global cash, positions

    cost = shares * price

    # VALIDATE: Do we have enough REAL cash?
    if cash < cost:
        raise ValueError(f"Insufficient cash: ${cash:.2f} < ${cost:.2f}")

    # Execute trade
    cash -= cost                    # Subtract REAL money
    positions[symbol] = positions.get(symbol, 0) + shares  # Add shares

    print(f"✅ BUY {shares} {symbol} @ ${price:.2f} = ${cost:.2f}")
    print(f"   Cash: ${cash:.2f} | Positions: {positions}")

    return {
        "action": "BUY",
        "symbol": symbol,
        "shares": shares,
        "price": price,
        "amount": cost,
        "cash_after": cash,
        "balance": calculate_balance(cash, positions)
    }

def execute_sell(symbol, shares, price):
    """Sell stocks - ONLY if we own them"""
    global cash, positions

    owned = positions.get(symbol, 0)

    # VALIDATE: Do we own enough shares?
    if owned < shares:
        raise ValueError(f"Insufficient shares: {owned} < {shares}")

    proceeds = shares * price

    # Execute trade
    cash += proceeds                # Add REAL money
    positions[symbol] -= shares     # Subtract shares

    # Remove position if we sold everything
    if positions[symbol] <= 0.0001:  # Account for floating point
        del positions[symbol]

    print(f"✅ SELL {shares} {symbol} @ ${price:.2f} = ${proceeds:.2f}")
    print(f"   Cash: ${cash:.2f} | Positions: {positions}")

    return {
        "action": "SELL",
        "symbol": symbol,
        "shares": shares,
        "price": price,
        "amount": proceeds,
        "cash_after": cash,
        "balance": calculate_balance(cash, positions)
    }
```

## Rule 4: Balance Must Always Equal Cash + Stock Value

```python
def calculate_balance(cash, positions):
    """
    Calculate REAL portfolio balance

    Balance = Cash we have + Current value of stocks we own

    NEVER make up numbers!
    """
    # Cash component (what's in our account)
    cash_value = cash

    # Stock component (what our shares are worth NOW)
    stock_value = 0
    for symbol, shares in positions.items():
        current_price = get_current_price(symbol)  # Get REAL market price
        stock_value += shares * current_price

    total_balance = cash_value + stock_value

    return total_balance

# Example:
cash = 1500.00
positions = {
    "AAPL": 1.5,  # 1.5 shares @ $267.50 current price
    "MSFT": 2.0   # 2.0 shares @ $425.00 current price
}

balance = calculate_balance(cash, positions)
# = 1500.00 + (1.5 * 267.50) + (2.0 * 425.00)
# = 1500.00 + 401.25 + 850.00
# = 2751.25

# This is our REAL portfolio value - not made up!
```

## Rule 5: Audit Every Transaction

```python
def validate_transaction_history(transactions):
    """
    Verify every transaction was legal (no fictional money)
    """
    cash = STARTING_CASH  # Start with $2,100
    positions = {}

    for i, txn in enumerate(transactions):
        symbol = txn["symbol"]
        shares = txn["shares"]
        price = txn["price"]
        action = txn["action"]

        if action == "BUY":
            cost = shares * price

            # Check: Did we have enough cash?
            if cash < cost:
                raise ValueError(
                    f"❌ Transaction {i} INVALID: "
                    f"Tried to buy ${cost:.2f} with only ${cash:.2f}!"
                )

            cash -= cost
            positions[symbol] = positions.get(symbol, 0) + shares

        elif action == "SELL":
            owned = positions.get(symbol, 0)

            # Check: Did we own enough shares?
            if owned < shares:
                raise ValueError(
                    f"❌ Transaction {i} INVALID: "
                    f"Tried to sell {shares} shares with only {owned} owned!"
                )

            proceeds = shares * price
            cash += proceeds
            positions[symbol] -= shares

            if positions[symbol] <= 0.0001:
                del positions[symbol]

        # Verify reported balance matches reality
        expected_balance = calculate_balance(cash, positions)
        reported_balance = txn.get("balance", 0)

        if abs(expected_balance - reported_balance) > 0.01:
            raise ValueError(
                f"❌ Transaction {i} INVALID: "
                f"Reported balance ${reported_balance:.2f} != "
                f"Expected ${expected_balance:.2f}"
            )

    print(f"✅ All {len(transactions)} transactions validated!")
    print(f"   Final cash: ${cash:.2f}")
    print(f"   Final positions: {positions}")
    print(f"   Final balance: ${calculate_balance(cash, positions):.2f}")

    return True
```

## Complete Trading Simulator Template

```python
#!/usr/bin/env python3
"""
BrightFlow Trading Simulator
RULE: Only use money we actually have - NO FICTIONAL NUMBERS
"""
import json
from datetime import datetime, timezone

# STARTING CONDITIONS - This is ALL the money we have!
STARTING_CASH = 2100.00
cash = STARTING_CASH
positions = {}
transactions = []

def get_current_price(symbol):
    """Get real market price from yfinance or API"""
    import yfinance as yf
    ticker = yf.Ticker(symbol)
    return ticker.info['currentPrice']

def calculate_balance():
    """Calculate REAL balance: Cash + Stock Value"""
    global cash, positions

    stock_value = sum(
        shares * get_current_price(symbol)
        for symbol, shares in positions.items()
    )

    return cash + stock_value

def buy(symbol, shares, price=None):
    """
    Buy stocks - ONLY if we have enough REAL cash

    Args:
        symbol: Stock ticker (e.g., "AAPL")
        shares: Number of shares to buy
        price: Price per share (if None, use current market price)

    Returns:
        Transaction dict if successful

    Raises:
        ValueError if insufficient cash
    """
    global cash, positions, transactions

    if price is None:
        price = get_current_price(symbol)

    cost = shares * price

    # VALIDATE: Do we have enough REAL money?
    if cash < cost:
        raise ValueError(
            f"❌ Cannot buy {shares} {symbol} @ ${price:.2f}\n"
            f"   Cost: ${cost:.2f}\n"
            f"   Available cash: ${cash:.2f}\n"
            f"   Shortfall: ${cost - cash:.2f}\n"
            f"   YOU CANNOT SPEND MONEY YOU DON'T HAVE!"
        )

    # Execute trade
    cash -= cost
    positions[symbol] = positions.get(symbol, 0) + shares

    # Record transaction
    txn = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "symbol": symbol,
        "action": "BUY",
        "shares": shares,
        "price": price,
        "amount": cost,
        "balance": calculate_balance()
    }
    transactions.append(txn)

    print(f"✅ BUY {shares} {symbol} @ ${price:.2f} = ${cost:.2f}")

    return txn

def sell(symbol, shares, price=None):
    """
    Sell stocks - ONLY if we own them

    Args:
        symbol: Stock ticker
        shares: Number of shares to sell
        price: Price per share (if None, use current market price)

    Returns:
        Transaction dict if successful

    Raises:
        ValueError if insufficient shares
    """
    global cash, positions, transactions

    owned = positions.get(symbol, 0)

    # VALIDATE: Do we own enough shares?
    if owned < shares:
        raise ValueError(
            f"❌ Cannot sell {shares} {symbol}\n"
            f"   Owned: {owned} shares\n"
            f"   Trying to sell: {shares} shares\n"
            f"   Shortfall: {shares - owned} shares\n"
            f"   YOU CANNOT SELL STOCKS YOU DON'T OWN!"
        )

    if price is None:
        price = get_current_price(symbol)

    proceeds = shares * price

    # Execute trade
    cash += proceeds
    positions[symbol] -= shares

    # Remove position if sold everything
    if positions[symbol] <= 0.0001:
        del positions[symbol]

    # Record transaction
    txn = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "symbol": symbol,
        "action": "SELL",
        "shares": shares,
        "price": price,
        "amount": proceeds,
        "balance": calculate_balance()
    }
    transactions.append(txn)

    print(f"✅ SELL {shares} {symbol} @ ${price:.2f} = ${proceeds:.2f}")

    return txn

def get_portfolio_summary():
    """Get current portfolio state"""
    global cash, positions

    stock_value = sum(
        shares * get_current_price(symbol)
        for symbol, shares in positions.items()
    )

    balance = cash + stock_value

    return {
        "cash": cash,
        "stockValue": stock_value,
        "totalBalance": balance,
        "positions": {
            symbol: {
                "shares": shares,
                "currentPrice": get_current_price(symbol),
                "value": shares * get_current_price(symbol)
            }
            for symbol, shares in positions.items()
        },
        "returnPct": ((balance - STARTING_CASH) / STARTING_CASH) * 100
    }

def export_data():
    """Export transactions and balance (REAL DATA ONLY)"""
    summary = get_portfolio_summary()

    output = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "totalTransactions": len(transactions),
        "currentBalance": summary["totalBalance"],
        "cashBalance": summary["cash"],
        "stockValue": summary["stockValue"],
        "positions": summary["positions"],
        "transactions": transactions
    }

    with open("transactions.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"✅ Exported {len(transactions)} transactions")
    print(f"   Balance: ${summary['totalBalance']:.2f}")
    print(f"   Return: {summary['returnPct']:.2f}%")

# Example usage:
if __name__ == "__main__":
    print(f"💰 Starting with ${STARTING_CASH:.2f}")

    # This will work - we have enough cash
    buy("AAPL", 1.5, 267.50)  # Cost: $401.25

    # This will work - we still have cash left
    buy("MSFT", 2.0, 425.00)  # Cost: $850.00

    # This will FAIL - we don't have $10,000!
    try:
        buy("NVDA", 10, 950.00)  # Cost: $9,500
    except ValueError as e:
        print(e)

    # This will work - we own 1.5 shares
    sell("AAPL", 1.0, 270.00)

    # This will FAIL - we don't own 10 shares!
    try:
        sell("AAPL", 10, 270.00)
    except ValueError as e:
        print(e)

    print("\n" + "="*50)
    print("PORTFOLIO SUMMARY:")
    print(json.dumps(get_portfolio_summary(), indent=2))

    export_data()
```

## Validation Script for Existing Data

```python
#!/usr/bin/env python3
"""
Validate that transactions.json only uses real money (no fictional numbers)
"""
import json
from pathlib import Path

def validate_no_fictional_money(transactions_file):
    """
    Audit all transactions to ensure we never:
    1. Spent money we didn't have
    2. Sold stocks we didn't own
    3. Made up balances
    """
    with open(transactions_file) as f:
        data = json.load(f)

    STARTING_CASH = 2100.00
    cash = STARTING_CASH
    positions = {}

    print(f"🔍 Auditing {len(data['transactions'])} transactions...")
    print(f"   Starting cash: ${STARTING_CASH:.2f}\n")

    errors = []

    for i, txn in enumerate(data['transactions']):
        symbol = txn["symbol"]
        shares = txn["shares"]
        price = txn["price"]
        action = txn["action"]
        amount = txn["amount"]

        if action == "BUY":
            cost = shares * price

            if cash < cost:
                errors.append(
                    f"❌ Transaction {i}: ILLEGAL BUY\n"
                    f"   Tried to spend ${cost:.2f} with only ${cash:.2f} available\n"
                    f"   This is FICTIONAL MONEY - we didn't have it!"
                )

            cash -= cost
            positions[symbol] = positions.get(symbol, 0) + shares

        elif action == "SELL":
            owned = positions.get(symbol, 0)

            if owned < shares:
                errors.append(
                    f"❌ Transaction {i}: ILLEGAL SELL\n"
                    f"   Tried to sell {shares} shares with only {owned} owned\n"
                    f"   This is FICTIONAL STOCK - we didn't own it!"
                )

            proceeds = shares * price
            cash += proceeds
            positions[symbol] = max(0, positions.get(symbol, 0) - shares)

    if errors:
        print("❌ VALIDATION FAILED - FICTIONAL MONEY DETECTED!")
        print("="*60)
        for error in errors:
            print(error)
        print("="*60)
        print(f"\n🚨 Found {len(errors)} violations of real money rules!")
        return False
    else:
        print("✅ VALIDATION PASSED - All transactions use REAL money only!")
        print(f"   Final cash: ${cash:.2f}")
        print(f"   Final positions: {positions}")
        return True

if __name__ == "__main__":
    validate_no_fictional_money("data/transactions.json")
```

## Summary

**The Golden Rule: You can only use money you actually have.**

1. ✅ Start with $2,100 real dollars
2. ✅ Only buy if `cash >= cost`
3. ✅ Only sell if `positions[symbol] >= shares`
4. ✅ Balance = Cash + Stock Value (nothing made up)
5. ✅ Every transaction must be auditable
6. ❌ No margin, leverage, or fictional money
7. ❌ No selling stocks you don't own
8. ❌ No made-up balances

**If you can't afford it with REAL money, you can't buy it. Period.**
