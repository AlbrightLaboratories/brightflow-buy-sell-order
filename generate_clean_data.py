#!/usr/bin/env python3
"""
Generate clean, realistic transaction data with proper balance tracking.
This replaces the broken sandbox data with valid transactions.
"""

import json
from datetime import datetime, timezone, timedelta
import random

def generate_realistic_transactions(starting_balance=2100.00, num_transactions=50):
    """
    Generate realistic transactions with proper balance tracking.

    Rules:
    1. Never buy if insufficient funds
    2. Never sell if don't own the stock
    3. Keep reasonable position sizes (1-5% of portfolio)
    """

    print(f"💰 Generating {num_transactions} realistic transactions...")
    print(f"📊 Starting balance: ${starting_balance:.2f}")

    # Stock universe with realistic prices
    stocks = {
        'SPY': 665.69,
        'QQQ': 598.72,
        'AAPL': 267.46,
        'MSFT': 415.32,
        'GOOGL': 175.84,
        'AMZN': 195.12,
        'NVDA': 485.23,
        'META': 520.18,
    }

    # Track portfolio state
    cash = starting_balance
    positions = {}  # {symbol: shares}
    transactions = []

    # Start time (3 days ago)
    current_time = datetime.now(timezone.utc) - timedelta(days=3)

    for i in range(num_transactions):
        # Advance time by 30-120 minutes
        current_time += timedelta(minutes=random.randint(30, 120))

        # Choose a random stock
        symbol = random.choice(list(stocks.keys()))
        price = stocks[symbol] * random.uniform(0.98, 1.02)  # Price variation

        # Decide action: 60% BUY, 40% SELL (if we own it)
        if symbol in positions and positions[symbol] > 0 and random.random() < 0.4:
            action = 'SELL'
        else:
            action = 'BUY'

        # Calculate trade size
        if action == 'BUY':
            # Trade 1-3% of portfolio value
            portfolio_value = cash + sum(positions.get(s, 0) * stocks[s] for s in stocks)
            max_trade = min(cash * 0.95, portfolio_value * 0.03)  # Don't spend all cash

            if max_trade < 50:  # Skip if insufficient funds
                continue

            dollar_amount = random.uniform(50, min(200, max_trade))
            shares = round(dollar_amount / price, 4)
            actual_cost = shares * price

            if actual_cost > cash:  # Double-check we can afford it
                continue

            # Execute buy
            cash -= actual_cost
            positions[symbol] = positions.get(symbol, 0) + shares
            amount = actual_cost  # Positive for display, will be negative in JSON

        else:  # SELL
            # Sell 20-80% of position
            current_shares = positions.get(symbol, 0)
            if current_shares < 0.01:  # Skip if we don't own enough
                continue

            sell_ratio = random.uniform(0.2, 0.8)
            shares = round(current_shares * sell_ratio, 4)
            proceeds = shares * price

            # Execute sell
            cash += proceeds
            positions[symbol] -= shares

            # Remove position if nearly zero
            if positions[symbol] < 0.0001:
                del positions[symbol]

            amount = proceeds

        # Record transaction
        tx = {
            'timestamp': current_time.isoformat(),
            'symbol': symbol,
            'action': action,
            'shares': round(shares, 4),
            'price': round(price, 2),
            'amount': round(amount, 2),
            'balance': round(cash, 2)
        }
        transactions.append(tx)

        # Log progress
        if i < 5 or i >= num_transactions - 5:
            print(f"{i+1:3d}. {action:4s} {symbol:5s} {shares:8.4f} @ ${price:7.2f} = ${amount:8.2f} → Balance: ${cash:,.2f}")
        elif i == 5:
            print("...")

    print(f"\n✅ Generated {len(transactions)} valid transactions")
    print(f"📊 Final balance: ${cash:.2f}")
    print(f"📦 Open positions: {len(positions)}")

    return {
        'lastUpdated': datetime.now(timezone.utc).isoformat(),
        'totalTransactions': len(transactions),
        'currentBalance': round(cash, 2),
        'transactions': transactions
    }

def main():
    print("🚀 Generating clean transaction data...\n")

    # Generate transactions
    data = generate_realistic_transactions(
        starting_balance=2100.00,
        num_transactions=50
    )

    # Save to file
    with open('data/transactions.json', 'w') as f:
        json.dump(data, f, indent=2)

    print(f"\n✅ Saved to data/transactions.json")
    print(f"💰 Starting: $2,100.00")
    print(f"💰 Ending: ${data['currentBalance']:,.2f}")
    print(f"📈 Net change: ${data['currentBalance'] - 2100.00:+,.2f}")

    # Validation
    if data['currentBalance'] < 0:
        print("\n⚠️  WARNING: Balance is negative! This shouldn't happen.")
    elif data['currentBalance'] > 10000:
        print("\n⚠️  WARNING: Balance is suspiciously high!")
    else:
        print("\n✅ Balance looks realistic!")

if __name__ == '__main__':
    main()
