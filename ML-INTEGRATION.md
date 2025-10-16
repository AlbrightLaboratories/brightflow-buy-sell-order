# BrightFlow ML Integration Guide

## The Problem
Your ML backend is not actually updating the data files. The data shows "41 minutes since last update" because the last real update was on October 15th, 2025.

## Solutions

### Option 1: Direct File Update (Recommended)
Use the `update-data-api.py` script to directly update the data files:

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_github_token_here

# Update performance data
python3 update-data-api.py --github-token $GITHUB_TOKEN --performance-file your_performance_data.json

# Update transaction data  
python3 update-data-api.py --github-token $GITHUB_TOKEN --transaction-file your_transaction_data.json

# Update both at once
python3 update-data-api.py --github-token $GITHUB_TOKEN --performance-file your_performance_data.json --transaction-file your_transaction_data.json
```

### Option 2: Trigger GitHub Actions
Use the `trigger-update.py` script to trigger the GitHub Actions workflow:

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_github_token_here

# Trigger the workflow
python3 trigger-update.py
```

### Option 3: Webhook Server
Run the webhook server and have your ML backend POST data to it:

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_github_token_here

# Start the webhook server
python3 webhook-update.py
```

Then your ML backend can POST to `http://your-server:5000/update-data`:

```python
import requests

data = {
    "performance_data": {
        "currentValue": 1.0523,
        "dailyChange": 0.0234,
        "performance": {
            "brightflow": [...],
            "spy": [...],
            "vfiax": [...],
            "spdr": [...]
        }
    },
    "transaction_data": {
        "transactions": [...],
        "currentBalance": 10214.43,
        "totalTransactions": 6
    }
}

response = requests.post("http://your-server:5000/update-data", json=data)
```

## Data Format Requirements

### Performance Data Format
```json
{
    "currentValue": 1.0523,
    "dailyChange": 0.0234,
    "performance": {
        "brightflow": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.01}
        ],
        "spy": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "vfiax": [...],
        "spdr": [...]
    }
}
```

### Transaction Data Format
```json
{
    "totalTransactions": 6,
    "currentBalance": 10214.43,
    "transactions": [
        {
            "id": "tx_1",
            "timestamp": "2025-01-16T09:30:00Z",
            "action": "BUY",
            "symbol": "NVDA",
            "quantity": 5.5325,
            "price": 180.75,
            "amount": -1000.0,
            "runningBalance": 9000.0,
            "confidence": 0.828,
            "strategy": "ml-algorithm-a"
        }
    ]
}
```

## Quick Fix
To immediately update the data with current timestamp:

```bash
# Update just the timestamp to show "fresh" data
python3 -c "
import json
import datetime
from update_data_api import BrightFlowDataUpdater

# Load current data
with open('data/performance.json', 'r') as f:
    perf_data = json.load(f)
with open('data/transactions.json', 'r') as f:
    tx_data = json.load(f)

# Update with current timestamp
updater = BrightFlowDataUpdater('your_github_token')
updater.update_performance_data(
    perf_data['performance']['brightflow'],
    perf_data['performance']['spy'],
    perf_data['performance']['vfiax'],
    perf_data['performance']['spdr'],
    perf_data['currentValue'],
    perf_data['dailyChange']
)
updater.update_transaction_data(
    tx_data['transactions'],
    tx_data['currentBalance'],
    tx_data['totalTransactions']
)
"
```

## Next Steps
1. Choose one of the integration methods above
2. Set up your ML backend to use it
3. Test with a small data update
4. Verify the website shows fresh data

The key is that your ML backend needs to actively push data updates - the current setup only updates timestamps, not real data.
