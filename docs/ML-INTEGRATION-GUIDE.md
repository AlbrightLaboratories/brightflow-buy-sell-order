# BrightFlow ML Integration Guide

## 🎯 Mission: 24/7 Money-Making Data Pipeline

Your ML repository needs to continuously update the BrightFlow website with fresh trading data to maximize profit opportunities. This guide provides everything you need to integrate your ML algorithms with the BrightFlow data pipeline.

## 📋 Quick Start Checklist

- [ ] Set up GitHub token for API access
- [ ] Choose integration method (API, webhook, or GitHub Actions)
- [ ] Implement data format conversion
- [ ] Set up automated data updates
- [ ] Test with sample data
- [ ] Deploy to production

## 🔑 Required GitHub Token

First, create a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Copy the token and set it as an environment variable:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

## 🚀 Integration Methods

### Method 1: Direct API Updates (Recommended)

**Best for**: Real-time updates, maximum control

```python
from update_data_api import BrightFlowDataUpdater
import json

# Initialize updater
updater = BrightFlowDataUpdater(github_token="your_token_here")

# Update performance data
updater.update_performance_data(
    brightflow_values=[
        {"date": "2024-09-25", "value": 1.0},
        {"date": "2024-09-26", "value": 1.01},
        # ... your ML predictions
    ],
    spy_values=[
        {"date": "2024-09-25", "value": 1.0},
        {"date": "2024-09-26", "value": 1.02},
        # ... SPY benchmark data
    ],
    vfiax_values=[...],  # VFIAX benchmark data
    spdr_values=[...],   # SPDR benchmark data
    current_value=1.0523,  # Current portfolio value
    daily_change=0.0234    # Daily change as decimal (2.34%)
)

# Update transaction data
updater.update_transaction_data(
    transactions=[
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
        # ... more transactions
    ],
    current_balance=10214.43,
    total_transactions=6
)
```

### Method 2: Webhook Server

**Best for**: High-frequency updates, microservices architecture

1. Start the webhook server:
```bash
python3 webhook-update.py
```

2. POST data from your ML backend:
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

### Method 3: GitHub Actions Trigger

**Best for**: Scheduled updates, existing CI/CD pipelines

```python
import requests

def trigger_brightflow_update(github_token):
    url = "https://api.github.com/repos/AlbrightLaboratories/brightflow-buy-sell-order/actions/workflows/update-data.yml/dispatches"
    
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    data = {
        "ref": "main",
        "inputs": {
            "market_focus": "all",
            "emergency_update": "true"
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.status_code == 204
```

## 📊 Data Format Requirements

### Performance Data Structure

```json
{
    "lastUpdated": "2025-01-16T15:30:00Z",
    "startDate": "2024-09-25",
    "currentValue": 1.0523,
    "dailyChange": 0.0234,
    "updateMode": "24-7-aggressive",
    "performance": {
        "brightflow": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.01},
            {"date": "2024-09-27", "value": 1.02}
        ],
        "spy": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02},
            {"date": "2024-09-27", "value": 1.01}
        ],
        "vfiax": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.01},
            {"date": "2024-09-27", "value": 1.00}
        ],
        "spdr": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02},
            {"date": "2024-09-27", "value": 1.01}
        ]
    }
}
```

### Transaction Data Structure

```json
{
    "lastUpdated": "2025-01-16T15:30:00Z",
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
        },
        {
            "id": "tx_2",
            "timestamp": "2025-01-16T15:30:00Z",
            "action": "SELL",
            "symbol": "NVDA",
            "quantity": 5.5325,
            "price": 198.82,
            "amount": 1099.97,
            "runningBalance": 10099.97,
            "confidence": 0.828,
            "strategy": "ml-algorithm-a"
        }
    ]
}
```

## 🤖 ML Algorithm Integration

### Python Example for Your ML Repository

```python
import json
import requests
from datetime import datetime, timezone
import pandas as pd

class BrightFlowMLIntegration:
    def __init__(self, github_token):
        self.github_token = github_token
        self.base_url = "https://api.github.com/repos/AlbrightLaboratories/brightflow-buy-sell-order/contents"
        
    def update_performance_data(self, ml_predictions, benchmark_data):
        """Update performance data with ML predictions"""
        
        # Convert your ML predictions to BrightFlow format
        brightflow_data = []
        for date, prediction in ml_predictions.items():
            brightflow_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "value": prediction
            })
        
        # Convert benchmark data
        spy_data = self._convert_benchmark_data(benchmark_data['SPY'])
        vfiax_data = self._convert_benchmark_data(benchmark_data['VFIAX'])
        spdr_data = self._convert_benchmark_data(benchmark_data['SPDR'])
        
        # Calculate current value and daily change
        current_value = ml_predictions[list(ml_predictions.keys())[-1]]
        previous_value = ml_predictions[list(ml_predictions.keys())[-2]]
        daily_change = (current_value - previous_value) / previous_value
        
        # Update via API
        updater = BrightFlowDataUpdater(self.github_token)
        return updater.update_performance_data(
            brightflow_data, spy_data, vfiax_data, spdr_data,
            current_value, daily_change
        )
    
    def update_transaction_data(self, trading_decisions, current_balance):
        """Update transaction data with trading decisions"""
        
        transactions = []
        running_balance = current_balance
        
        for decision in trading_decisions:
            transaction = {
                "id": f"tx_{len(transactions) + 1}",
                "timestamp": decision['timestamp'].isoformat(),
                "action": decision['action'],  # BUY or SELL
                "symbol": decision['symbol'],
                "quantity": decision['quantity'],
                "price": decision['price'],
                "amount": decision['amount'],
                "runningBalance": running_balance,
                "confidence": decision['confidence'],
                "strategy": decision['strategy']
            }
            transactions.append(transaction)
            running_balance += decision['amount']
        
        updater = BrightFlowDataUpdater(self.github_token)
        return updater.update_transaction_data(
            transactions, current_balance, len(transactions)
        )
    
    def _convert_benchmark_data(self, benchmark_df):
        """Convert pandas DataFrame to BrightFlow format"""
        data = []
        for date, row in benchmark_df.iterrows():
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "value": row['value']
            })
        return data

# Usage in your ML pipeline
def main():
    # Initialize integration
    integration = BrightFlowMLIntegration(github_token="your_token_here")
    
    # Your ML predictions
    ml_predictions = {
        datetime(2024, 9, 25): 1.0,
        datetime(2024, 9, 26): 1.01,
        datetime(2024, 9, 27): 1.02
    }
    
    # Your benchmark data
    benchmark_data = {
        'SPY': spy_df,      # Your SPY data
        'VFIAX': vfiax_df,  # Your VFIAX data
        'SPDR': spdr_df     # Your SPDR data
    }
    
    # Your trading decisions
    trading_decisions = [
        {
            'timestamp': datetime.now(timezone.utc),
            'action': 'BUY',
            'symbol': 'NVDA',
            'quantity': 5.5325,
            'price': 180.75,
            'amount': -1000.0,
            'confidence': 0.828,
            'strategy': 'ml-algorithm-a'
        }
    ]
    
    # Update data
    integration.update_performance_data(ml_predictions, benchmark_data)
    integration.update_transaction_data(trading_decisions, 10214.43)
```

## ⏰ Update Schedule Recommendations

### High-Frequency Trading (Recommended)
- **Performance data**: Every 5 minutes during market hours
- **Transaction data**: Real-time when trades occur
- **Off-hours**: Every 30 minutes

### Standard Trading
- **Performance data**: Every 15 minutes during market hours
- **Transaction data**: Every hour
- **Off-hours**: Every 2 hours

### Conservative Trading
- **Performance data**: Every hour
- **Transaction data**: Daily
- **Off-hours**: Every 6 hours

## 🔧 Testing Your Integration

### 1. Test with Sample Data
```python
# Test performance update
test_performance = {
    "currentValue": 1.0523,
    "dailyChange": 0.0234,
    "performance": {
        "brightflow": [{"date": "2024-09-25", "value": 1.0}],
        "spy": [{"date": "2024-09-25", "value": 1.0}],
        "vfiax": [{"date": "2024-09-25", "value": 1.0}],
        "spdr": [{"date": "2024-09-25", "value": 1.0}]
    }
}

# Test transaction update
test_transactions = {
    "transactions": [{
        "id": "test_tx_1",
        "timestamp": "2025-01-16T15:30:00Z",
        "action": "BUY",
        "symbol": "TEST",
        "quantity": 1.0,
        "price": 100.0,
        "amount": -100.0,
        "runningBalance": 9900.0,
        "confidence": 0.95,
        "strategy": "test-strategy"
    }],
    "currentBalance": 9900.0,
    "totalTransactions": 1
}
```

### 2. Verify Website Updates
1. Check the BrightFlow website
2. Look for updated timestamps
3. Verify data appears in charts and tables
4. Check console for any errors

## 🚨 Error Handling

### Common Issues and Solutions

1. **Authentication Error (401)**
   - Check GitHub token permissions
   - Ensure token has `repo` scope

2. **File Not Found (404)**
   - Verify repository name and file paths
   - Check if files exist in the repository

3. **Rate Limit Exceeded (429)**
   - Implement exponential backoff
   - Reduce update frequency

4. **Invalid Data Format (400)**
   - Validate JSON structure
   - Check required fields

### Error Handling Example
```python
import time
import logging

def safe_update_data(updater, data, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = updater.update_performance_data(**data)
            if result:
                logging.info("Data updated successfully")
                return True
        except Exception as e:
            logging.error(f"Update attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
    return False
```

## 📈 Performance Optimization

### 1. Batch Updates
```python
# Update multiple data points at once
def batch_update_performance(updater, daily_predictions):
    # Group predictions by date
    grouped_data = {}
    for prediction in daily_predictions:
        date = prediction['date']
        if date not in grouped_data:
            grouped_data[date] = []
        grouped_data[date].append(prediction)
    
    # Convert to BrightFlow format
    brightflow_data = []
    for date, predictions in grouped_data.items():
        avg_value = sum(p['value'] for p in predictions) / len(predictions)
        brightflow_data.append({"date": date, "value": avg_value})
    
    # Single update call
    updater.update_performance_data(brightflow_data, ...)
```

### 2. Caching
```python
import hashlib

def get_data_hash(data):
    return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()

def update_if_changed(updater, new_data, last_hash):
    current_hash = get_data_hash(new_data)
    if current_hash != last_hash:
        updater.update_performance_data(**new_data)
        return current_hash
    return last_hash
```

## 🎯 Success Metrics

Track these metrics to ensure your integration is working:

1. **Data Freshness**: Timestamps should be within 5 minutes
2. **Update Success Rate**: >99% successful updates
3. **Website Performance**: Charts load within 2 seconds
4. **Error Rate**: <1% failed updates

## 🆘 Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Verify data format matches requirements
3. Test with sample data first
4. Check network connectivity
5. Verify GitHub token permissions

## 🚀 Next Steps

1. **Choose your integration method** (API, webhook, or GitHub Actions)
2. **Set up your GitHub token**
3. **Implement the data conversion** in your ML pipeline
4. **Test with sample data**
5. **Deploy to production**
6. **Monitor and optimize**

Remember: The goal is 24/7 money-making opportunities, so keep that data fresh! 💰
