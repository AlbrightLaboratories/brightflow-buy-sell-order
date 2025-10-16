# 🚀 BrightFlow Website Integration Instructions

## 🎯 Quick Start Guide for ML Repository

Your ML repository needs to start feeding performance data to the BrightFlow website immediately. Here's exactly how to do it:

## 📍 Website Location
- **Live URL**: `https://albright-laboratories.github.io/brightflow-buy-sell-order/`
- **Repository**: `https://github.com/AlbrightLaboratories/brightflow-buy-sell-order`
- **Data Location**: Push JSON files to the `/data/` folder in the website repo

## 🔧 Step 1: Set up GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a new token with `repo` permissions for `AlbrightLaboratories/brightflow-buy-sell-order`
3. Add it as `BRIGHTFLOW_WEBSITE_TOKEN` in your ML repository secrets

## 📊 Step 2: Required Data Format

Create these **two files** every hour from 4:30 AM to 8:00 PM EST:

### `/data/performance.json`
```json
{
  "lastUpdated": "2025-10-15T15:30:00Z",
  "startDate": "2024-09-25",
  "currentValue": 2147.00,
  "dailyChange": 0.0224,
  "performance": {
    "brightflow": [
      {"date": "2024-09-25", "value": 2100.00},
      {"date": "2024-09-26", "value": 2148.30},
      {"date": "2025-10-15", "value": 2147.00}
    ],
    "spy": [
      {"date": "2024-09-25", "value": 2100.00},
      {"date": "2024-09-26", "value": 2116.80},
      {"date": "2025-10-15", "value": 2584.20}
    ],
    "vfiax": [
      {"date": "2024-09-25", "value": 2100.00},
      {"date": "2024-09-26", "value": 2114.70},
      {"date": "2025-10-15", "value": 2520.00}
    ],
    "spdr": [
      {"date": "2024-09-25", "value": 2100.00},
      {"date": "2024-09-26", "value": 2112.60},
      {"date": "2025-10-15", "value": 2499.40}
    ]
  }
}
```

### `/data/transactions.json`
```json
{
  "lastUpdated": "2025-10-15T15:30:00Z",
  "totalTransactions": 1247,
  "currentBalance": 347.82,
  "transactions": [
    {
      "id": "tx_1247",
      "timestamp": "2025-10-15T09:45:23Z",
      "action": "BUY",
      "symbol": "NVDA",
      "quantity": 5.25,
      "price": 145.67,
      "amount": -764.77,
      "runningBalance": 347.82,
      "confidence": 0.89,
      "strategy": "ai_momentum"
    }
  ]
}
```

## 🤖 Step 3: Copy This Script to Your ML Repo

Create `update_brightflow_website.py`:

```python
import requests
import json
import base64
import os
from datetime import datetime
import yfinance as yf
import pandas as pd

class BrightFlowUpdater:
    def __init__(self, github_token):
        self.github_token = github_token
        self.repo = "AlbrightLaboratories/brightflow-buy-sell-order"
        self.base_url = f"https://api.github.com/repos/{self.repo}/contents"
        
    def get_benchmark_data(self, start_date="2024-09-25"):
        """Get SPY, VFIAX, and SPDR data for comparison"""
        symbols = ["SPY", "VFIAX", "SPLG"]  # SPLG is SPDR S&P 500
        data = {}
        
        for symbol in symbols:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(start=start_date)
            
            # Normalize to $2100 starting value
            start_price = hist['Close'].iloc[0]
            normalized_values = (hist['Close'] / start_price) * 2100
            
            data[symbol.lower().replace('splg', 'spdr')] = [
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "value": round(value, 2)
                }
                for date, value in zip(hist.index, normalized_values)
            ]
            
        return data
    
    def update_file(self, file_path, content):
        """Update a file in the GitHub repository"""
        url = f"{self.base_url}/{file_path}"
        headers = {"Authorization": f"Bearer {self.github_token}"}
        
        # Get current file SHA if it exists
        response = requests.get(url, headers=headers)
        sha = response.json().get("sha") if response.status_code == 200 else None
        
        # Prepare content
        content_encoded = base64.b64encode(json.dumps(content, indent=2).encode()).decode()
        
        payload = {
            "message": f"Update {file_path} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "content": content_encoded
        }
        
        if sha:
            payload["sha"] = sha
            
        response = requests.put(url, json=payload, headers=headers)
        return response.status_code in [200, 201]
    
    def update_performance_data(self, brightflow_performance, current_value, daily_change):
        """Update performance comparison data"""
        
        # Get benchmark data
        benchmarks = self.get_benchmark_data()
        
        performance_data = {
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
            "startDate": "2024-09-25",
            "currentValue": current_value,
            "dailyChange": daily_change,
            "performance": {
                "brightflow": brightflow_performance,
                **benchmarks
            }
        }
        
        return self.update_file("data/performance.json", performance_data)
    
    def update_transaction_data(self, transactions, current_balance, total_transactions):
        """Update transaction history"""
        
        transaction_data = {
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
            "totalTransactions": total_transactions,
            "currentBalance": current_balance,
            "transactions": transactions[-50:]  # Keep last 50 only
        }
        
        return self.update_file("data/transactions.json", transaction_data)

# Usage example:
def main():
    # Initialize updater
    updater = BrightFlowUpdater(os.environ["BRIGHTFLOW_WEBSITE_TOKEN"])
    
    # Your ML algorithm results go here
    brightflow_data = [
        {"date": "2024-09-25", "value": 2100.00},
        {"date": "2025-10-15", "value": 2147.00}  # Your actual performance
    ]
    
    recent_transactions = [
        {
            "id": "tx_1247",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": "BUY",
            "symbol": "NVDA",
            "quantity": 5.25,
            "price": 145.67,
            "amount": -764.77,
            "runningBalance": 347.82,
            "confidence": 0.89,
            "strategy": "ai_momentum"
        }
    ]
    
    # Update website
    perf_success = updater.update_performance_data(
        brightflow_performance=brightflow_data,
        current_value=2147.00,
        daily_change=0.0224
    )
    
    trans_success = updater.update_transaction_data(
        transactions=recent_transactions,
        current_balance=347.82,
        total_transactions=1247
    )
    
    print(f"Performance update: {'✅' if perf_success else '❌'}")
    print(f"Transaction update: {'✅' if trans_success else '❌'}")

if __name__ == "__main__":
    main()
```

## ⏰ Step 4: Set up Automated Schedule

Create `.github/workflows/update-brightflow.yml` in your ML repo:

```yaml
name: Update BrightFlow Website

on:
  schedule:
    # Every hour from 4:30 AM to 8:30 PM EST (9:30-1:30 UTC)
    - cron: '30 9-13,14-23 * * 1-5'  # Monday-Friday market hours
    - cron: '30 0-1 * * 1-5'         # Covers 7:30-8:30 PM EST
  
  workflow_dispatch:  # Manual trigger
    inputs:
      force_update:
        description: 'Force update outside market hours'
        required: false
        default: 'false'

jobs:
  update-brightflow:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout ML Repository
      uses: actions/checkout@v3
      
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        
    - name: Install Dependencies
      run: |
        pip install requests yfinance pandas numpy
        
    - name: Run ML Algorithm
      run: |
        python run_ml_predictions.py  # Your ML script here
        
    - name: Update BrightFlow Website
      env:
        BRIGHTFLOW_WEBSITE_TOKEN: ${{ secrets.BRIGHTFLOW_WEBSITE_TOKEN }}
      run: |
        python update_brightflow_website.py
        
    - name: Verify Success
      run: |
        echo "✅ BrightFlow website updated successfully"
```

## 🚨 Step 5: Test Your Integration

1. **Manual Test**: Run the script locally to verify it works
2. **Check Website**: Visit `https://albright-laboratories.github.io/brightflow-buy-sell-order/`
3. **Look for**: Green "✓ Data updated" indicator in top-right corner
4. **Verify**: Charts show your BrightFlow performance vs benchmarks

## 🔍 Troubleshooting

### Common Issues:
- **403 Error**: Check your GitHub token has `repo` permissions
- **Data Not Showing**: Verify JSON format matches examples exactly
- **Chart Not Updating**: Check browser console for fetch errors
- **Wrong Timestamps**: Use ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`)

### Debug Commands:
```python
# Test your token
response = requests.get(
    f"https://api.github.com/repos/AlbrightLaboratories/brightflow-buy-sell-order",
    headers={"Authorization": f"Bearer {your_token}"}
)
print(f"Token test: {response.status_code}")

# Validate JSON format
import json
with open('test_data.json', 'w') as f:
    json.dump(your_data, f, indent=2)
```

## 📈 Expected Performance Data

Your algorithm should track:
- **Starting Value**: $2,100 (Sept 25, 2024)
- **Current Value**: Your algorithm's current portfolio value
- **Daily Updates**: How much $2,100 would be worth now
- **Benchmarks**: Compare against SPY, VFIAX, SPDR performance

## ✅ Success Criteria

**You'll know it's working when:**
1. Website shows real-time BrightFlow performance
2. Charts display your algorithm vs S&P 500 benchmarks
3. Transaction table shows your recent trades
4. Updates happen automatically every hour during market hours
5. Users see performance notifications

## 🎯 Next Steps

1. **Copy the Python script** to your ML repository
2. **Add GitHub token** to your repository secrets
3. **Create the workflow file** for automated updates
4. **Test manually** to ensure everything works
5. **Monitor the website** for successful updates

The BrightFlow website is ready and waiting for your data! 🚀

---

**Need Help?**
- Check the `AI_AGENT_PROMPT.md` file for full technical details
- Test your JSON format at `jsonlint.com`
- Use GitHub's API documentation for troubleshooting