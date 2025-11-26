#!/usr/bin/env python3
"""
Generate realistic performance data matching the transaction history
"""
import json
from datetime import datetime, timedelta, timezone
import yfinance as yf

def get_historical_prices(symbol, days_back=30):
    """Get historical closing prices"""
    try:
        ticker = yf.Ticker(symbol)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back + 5)
        data = ticker.history(start=start_date, end=end_date)
        if not data.empty:
            return data['Close'].to_dict()
    except:
        pass
    return {}

def generate_performance_data():
    """Generate performance data from transactions"""
    # Load transactions
    with open("data/transactions.json") as f:
        txn_data = json.load(f)

    transactions = txn_data["transactions"]

    # Get date range
    first_date = datetime.fromisoformat(transactions[0]["timestamp"].replace('Z', '+00:00'))
    last_date = datetime.fromisoformat(transactions[-1]["timestamp"].replace('Z', '+00:00'))

    print(f"📊 Generating performance data from {first_date.date()} to {last_date.date()}")

    # Calculate portfolio value for each day
    portfolio_history = []
    current_date = first_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = last_date.replace(hour=23, minute=59, second=59)

    cash = 2100.00
    positions = {}

    # Process transactions chronologically
    txn_index = 0

    while current_date <= end_date:
        # Process all transactions for this day
        while txn_index < len(transactions):
            txn = transactions[txn_index]
            txn_time = datetime.fromisoformat(txn["timestamp"].replace('Z', '+00:00'))

            if txn_time.date() > current_date.date():
                break

            # Apply transaction
            if txn["action"] == "BUY":
                cash -= txn["amount"]
                positions[txn["symbol"]] = positions.get(txn["symbol"], 0) + txn["shares"]
            elif txn["action"] == "SELL":
                cash += txn["amount"]
                positions[txn["symbol"]] = positions.get(txn["symbol"], 0) - txn["shares"]
                if positions[txn["symbol"]] <= 0.0001:
                    positions.pop(txn["symbol"], None)

            txn_index += 1

        # Calculate portfolio value at end of day
        # (Use transaction prices as proxy for EOD prices)
        portfolio_value = cash
        for symbol, shares in positions.items():
            # Find most recent price for this symbol
            recent_price = 100.0  # Default
            for i in range(txn_index - 1, -1, -1):
                if transactions[i]["symbol"] == symbol:
                    recent_price = transactions[i]["price"]
                    break
            portfolio_value += shares * recent_price

        portfolio_history.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "value": round(portfolio_value, 2)
        })

        current_date += timedelta(days=1)

    print(f"✅ Generated {len(portfolio_history)} daily values")

    # Get market index data for comparison
    print("📥 Fetching market index data...")

    days_back = (last_date - first_date).days + 5

    spy_data = get_historical_prices("SPY", days_back)
    nasdaq_data = get_historical_prices("^IXIC", days_back)
    djia_data = get_historical_prices("^DJI", days_back)

    # Normalize indices to start at 100
    def normalize_to_100(price_dict, start_date):
        if not price_dict:
            return []

        # Find first valid price on or after start_date
        baseline = None
        for date, price in sorted(price_dict.items()):
            if date.date() >= start_date.date():
                baseline = price
                break

        if not baseline:
            return []

        result = []
        for date, price in sorted(price_dict.items()):
            if date.date() >= start_date.date():
                normalized = (price / baseline) * 100
                result.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "value": round(normalized, 2)
                })

        return result

    spy_normalized = normalize_to_100(spy_data, first_date)
    nasdaq_normalized = normalize_to_100(nasdaq_data, first_date)
    djia_normalized = normalize_to_100(djia_data, first_date)

    # Build output
    output = {
        "currentValue": round(txn_data["currentBalance"], 2),
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "brightflow": portfolio_history,
        "spy": spy_normalized,
        "nasdaq": nasdaq_normalized,
        "djia": djia_normalized,
        "sp500": spy_normalized,  # Use SPY as proxy for S&P 500
        "gold": [{"date": d["date"], "value": 100.0} for d in portfolio_history]  # Flat line
    }

    # Save
    with open("data/performance.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n✅ Exported to data/performance.json")
    print(f"   BrightFlow: {len(portfolio_history)} days")
    print(f"   Market indices: {len(spy_normalized)} days")
    print(f"   Current value: ${output['currentValue']:.2f}")

if __name__ == "__main__":
    generate_performance_data()
