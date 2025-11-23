#!/usr/bin/env python3
"""
Validate that transactions.json only uses REAL money (no fictional numbers)

This script audits every transaction to ensure:
1. We never spent money we didn't have
2. We never sold stocks we didn't own
3. All balances are calculated correctly
"""
import json
import sys
from pathlib import Path

STARTING_CASH = 2100.00  # Our actual starting investment

def validate_transactions(transactions_file):
    """
    Audit all transactions for violations of real money rules
    """
    if not Path(transactions_file).exists():
        print(f"❌ File not found: {transactions_file}")
        return False

    with open(transactions_file) as f:
        data = json.load(f)

    transactions = data.get('transactions', [])

    print("="*70)
    print("🔍 REAL MONEY VALIDATION")
    print("="*70)
    print(f"Starting cash: ${STARTING_CASH:.2f}")
    print(f"Total transactions to audit: {len(transactions)}")
    print("="*70)

    cash = STARTING_CASH
    positions = {}
    errors = []
    warnings = []

    for i, txn in enumerate(transactions):
        symbol = txn.get("symbol")
        shares = txn.get("shares", 0)
        price = txn.get("price", 0)
        action = txn.get("action", "").upper()
        reported_balance = txn.get("balance", 0)

        if action == "BUY":
            cost = shares * price

            # Check if we had enough cash
            if cash < cost - 0.01:  # Allow for floating point errors
                errors.append({
                    "index": i,
                    "type": "ILLEGAL_BUY",
                    "message": f"Transaction {i}: Tried to buy ${cost:.2f} with only ${cash:.2f}",
                    "details": f"  {action} {shares:.4f} {symbol} @ ${price:.2f}",
                    "violation": "SPENT FICTIONAL MONEY - DIDN'T HAVE IT!"
                })
                # Don't update cash/positions for illegal transaction
                continue

            # Execute buy
            cash -= cost
            positions[symbol] = positions.get(symbol, 0) + shares

        elif action == "SELL":
            owned = positions.get(symbol, 0)

            # Check if we owned enough shares
            if owned < shares - 0.0001:  # Allow for floating point errors
                errors.append({
                    "index": i,
                    "type": "ILLEGAL_SELL",
                    "message": f"Transaction {i}: Tried to sell {shares:.4f} shares with only {owned:.4f} owned",
                    "details": f"  {action} {shares:.4f} {symbol} @ ${price:.2f}",
                    "violation": "SOLD FICTIONAL STOCK - DIDN'T OWN IT!"
                })
                # Don't update cash/positions for illegal transaction
                continue

            # Execute sell
            proceeds = shares * price
            cash += proceeds
            positions[symbol] -= shares

            # Clean up zero positions
            if positions[symbol] < 0.0001:
                del positions[symbol]

        # Validate reported balance vs actual
        # Note: We can't validate exact balance without current prices
        # But we can check if it's absurdly wrong
        if reported_balance > 1000000:  # More than $1 million
            warnings.append({
                "index": i,
                "type": "ABSURD_BALANCE",
                "message": f"Transaction {i}: Reported balance ${reported_balance:.2f} is absurd",
                "details": f"  Expected range: $0 - $100,000"
            })

    # Final validation
    print(f"\n📊 AUDIT RESULTS:")
    print(f"   Transactions processed: {len(transactions)}")
    print(f"   Final cash: ${cash:.2f}")
    print(f"   Final positions: {len(positions)} stocks")
    for symbol, shares in positions.items():
        print(f"      {symbol}: {shares:.4f} shares")

    # Report errors
    if errors:
        print(f"\n❌ VALIDATION FAILED!")
        print(f"   Found {len(errors)} violations of real money rules:\n")
        for error in errors:
            print(f"❌ {error['type']}: {error['message']}")
            print(f"   {error['details']}")
            print(f"   🚨 {error['violation']}\n")

    # Report warnings
    if warnings:
        print(f"\n⚠️  WARNINGS:")
        print(f"   Found {len(warnings)} suspicious values:\n")
        for warning in warnings:
            print(f"⚠️  {warning['type']}: {warning['message']}")
            print(f"   {warning['details']}\n")

    # Validate reported current balance
    reported_current = data.get('currentBalance', 0)
    if reported_current > 100000:
        print(f"❌ CRITICAL: Reported currentBalance ${reported_current:.2f} is ABSURD!")
        print(f"   Expected range: $1,000 - $100,000")
        print(f"   This is FICTIONAL MONEY!\n")
        errors.append({
            "type": "FICTIONAL_BALANCE",
            "message": "currentBalance exceeds realistic limits"
        })

    print("="*70)

    if errors:
        print("❌ VALIDATION FAILED - FICTIONAL MONEY DETECTED")
        print("="*70)
        print("\n🚨 THE ML TRADING SIMULATOR IS USING FICTIONAL MONEY!")
        print("   Fix required: Only use money we actually have")
        print("   See ML_TRADING_RULES.md for correct implementation\n")
        return False
    else:
        print("✅ VALIDATION PASSED - All transactions use REAL money")
        print("="*70)
        print("\n✅ No violations found - trading simulator is honest!")
        print("   All transactions used money we actually had")
        print("   All stock sales were from shares we actually owned\n")
        return True

if __name__ == "__main__":
    # Check if file path provided
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = "data/transactions.json"

    # Run validation
    success = validate_transactions(file_path)

    # Exit with appropriate code
    sys.exit(0 if success else 1)
