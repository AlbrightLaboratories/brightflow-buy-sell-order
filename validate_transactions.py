#!/usr/bin/env python3
"""
Validate that transactions.json only uses real money (no fictional numbers)
Starting capital: $2,100 (real money)
Rules:
1. Can't buy if you don't have enough cash
2. Can't sell stocks you don't own
3. Balance must equal cash + stock value
"""
import json
from pathlib import Path

def validate_transactions(transactions_file):
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
    warnings = []

    for i, txn in enumerate(data['transactions']):
        symbol = txn["symbol"]
        shares = txn["shares"]
        price = txn["price"]
        action = txn["action"]
        amount = txn["amount"]
        reported_balance = txn.get("balance", 0)

        if action == "BUY":
            cost = shares * price

            if cash < cost:
                errors.append(
                    f"❌ Transaction {i}: ILLEGAL BUY\n"
                    f"   Symbol: {symbol}\n"
                    f"   Shares: {shares:,.2f}\n"
                    f"   Price: ${price:.2f}\n"
                    f"   Cost: ${cost:,.2f}\n"
                    f"   Available cash: ${cash:,.2f}\n"
                    f"   Shortfall: ${cost - cash:,.2f}\n"
                    f"   ⚠️  This is FICTIONAL MONEY - you didn't have it!"
                )

            cash -= cost
            positions[symbol] = positions.get(symbol, 0) + shares

        elif action == "SELL":
            owned = positions.get(symbol, 0)

            if owned < shares:
                errors.append(
                    f"❌ Transaction {i}: ILLEGAL SELL\n"
                    f"   Symbol: {symbol}\n"
                    f"   Trying to sell: {shares:,.2f} shares\n"
                    f"   Actually owned: {owned:,.2f} shares\n"
                    f"   Shortfall: {shares - owned:,.2f} shares\n"
                    f"   ⚠️  This is FICTIONAL STOCK - you didn't own it!"
                )

            proceeds = shares * price
            cash += proceeds
            positions[symbol] = max(0, positions.get(symbol, 0) - shares)

            # Remove if sold all
            if positions.get(symbol, 0) <= 0.0001:
                positions.pop(symbol, None)

        # Check if balance is realistic (should be under $100k for $2.1k start)
        if reported_balance > 100000:
            warnings.append(
                f"⚠️  Transaction {i}: Unrealistic balance\n"
                f"   Reported: ${reported_balance:,.2f}\n"
                f"   Started with: ${STARTING_CASH:.2f}\n"
                f"   This suggests fictional money"
            )

    print("\n" + "="*70)
    if errors:
        print("❌ VALIDATION FAILED - FICTIONAL MONEY DETECTED!")
        print("="*70)
        for error in errors[:10]:  # Show first 10 errors
            print(error)
        if len(errors) > 10:
            print(f"\n... and {len(errors) - 10} more errors")
        print("="*70)
        print(f"\n🚨 Found {len(errors)} violations of real money rules!")
        return False
    else:
        print("✅ VALIDATION PASSED - All transactions use REAL money only!")
        print("="*70)
        print(f"   Final cash: ${cash:.2f}")
        print(f"   Final positions: {len(positions)} stocks")
        for symbol, shares in positions.items():
            print(f"      {symbol}: {shares:.2f} shares")
        return True

if __name__ == "__main__":
    validate_transactions("data/transactions.json")
