# AI Agent Instructions: BrightFlow Data Integration

## 🎯 Your Mission
You are responsible for implementing the data pipeline that feeds the BrightFlow investment tracking website. The website is already built and waiting for your data - you need to create the hourly data updates that will make it come alive.

## 📊 The Big Picture
- **Website Location**: `https://albright-laboratories.github.io/brightflow-buy-sell-order/`
- **Your Job**: Generate and provide investment performance data every hour from 4:30 AM to 8 PM EST
- **Data Flow**: Your ML repo → JSON files → Website automatically updates

## 🎯 What the Website Expects

The website looks for data in these **exact locations**:
- `./data/performance.json` - Contains performance comparison data
- `./data/transactions.json` - Contains recent trading activity

### 📋 Required Data Format

#### 1. Performance Data (`/data/performance.json`)
```json
{
  "lastUpdated": "2024-10-14T15:30:00Z",
  "startDate": "2024-09-25",
  "currentValue": 1.47,
  "dailyChange": 0.0234,
  "performance": {
    "brightflow": [
      {"date": "2024-09-25", "value": 1.0},
      {"date": "2024-09-26", "value": 1.023},
      {"date": "2024-10-14", "value": 1.47}
    ],
    "spy": [
      {"date": "2024-09-25", "value": 1.0},
      {"date": "2024-09-26", "value": 1.008},
      {"date": "2024-10-14", "value": 1.23}
    ],
    "vfiax": [
      {"date": "2024-09-25", "value": 1.0},
      {"date": "2024-09-26", "value": 1.007},
      {"date": "2024-10-14", "value": 1.20}
    ],
    "spdr": [
      {"date": "2024-09-25", "value": 1.0},
      {"date": "2024-09-26", "value": 1.006},
      {"date": "2024-10-14", "value": 1.19}
    ]
  }
}
```

#### 2. Transaction Data (`/data/transactions.json`)
```json
{
  "lastUpdated": "2024-10-14T15:30:00Z",
  "totalTransactions": 847,
  "currentBalance": 12534.67,
  "transactions": [
    {
      "id": "tx_847",
      "timestamp": "2024-10-14T09:45:23Z",
      "action": "BUY",
      "symbol": "AAPL",
      "quantity": 25,
      "price": 178.45,
      "amount": -4461.25,
      "runningBalance": 12534.67,
      "confidence": 0.87,
      "strategy": "momentum"
    }
  ]
}
```

## 🔧 Implementation Options

You have **3 ways** to provide this data:

### Option 1: Use the Provided Python Script (Easiest)
```python
# Copy the update_data.py script to your ML repo
from update_data import BrightFlowUpdater

# Set up updater (requires GitHub token)
updater = BrightFlowUpdater(github_token=os.environ["BRIGHTFLOW_WEBSITE_TOKEN"])

# Update performance data
updater.update_performance_data(
    brightflow_values=your_brightflow_data,
    spy_values=your_spy_data, 
    vfiax_values=your_vfiax_data,
    spdr_values=your_spdr_data,
    current_value=1.47,
    daily_change=0.0234
)

# Update transaction data
updater.update_transaction_data(
    transactions=your_recent_transactions,
    current_balance=your_current_balance,
    total_transactions=total_count
)
```

### Option 2: GitHub Actions Workflow (Recommended for Disaster Recovery)

**IMPORTANT**: Create this workflow in your ML repo for automatic failover if your Kubernetes cluster goes down.

```yaml
# In your ML repo: .github/workflows/update-brightflow.yml
name: Update BrightFlow Website
on:
  schedule:
    - cron: '30 9-23 * * *'    # Every hour 4:30 AM - 7:30 PM EST (UTC-5)
    - cron: '30 0-1 * * *'     # Covers 7:30-8:30 PM EST
  
  # Manual trigger for emergency updates
  workflow_dispatch:
    inputs:
      emergency_update:
        description: 'Emergency update - bypass schedule'
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
        pip install requests pandas numpy yfinance
        # Add your ML dependencies here
        
    - name: Run ML Pipeline
      env:
        # Add your API keys as secrets in the ML repo
        ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }}
        POLYGON_API_KEY: ${{ secrets.POLYGON_API_KEY }}
        # Add other market data API keys as needed
      run: |
        python generate_brightflow_predictions.py
        python calculate_performance_vs_benchmarks.py
        
    - name: Update Website Data
      env:
        BRIGHTFLOW_WEBSITE_TOKEN: ${{ secrets.BRIGHTFLOW_WEBSITE_TOKEN }}
      run: |
        python update_brightflow_website.py
        
    - name: Verify Update Success
      run: |
        python verify_website_update.py
        
    - name: Notify on Failure
      if: failure()
      run: |
        echo "BrightFlow update failed - manual intervention required"
        # Add Slack/Discord notification here if needed
```

#### **Disaster Recovery Benefits:**
✅ **Automatic failover**: If your Kubernetes cluster is down, GitHub Actions takes over  
✅ **No manual intervention**: Continues hourly updates automatically  
✅ **Quick recovery**: Just clone the repo to any machine and it works  
✅ **Manual triggers**: Emergency updates available anytime  
✅ **Self-contained**: All dependencies and logic in one workflow

### Option 3: Direct GitHub API Calls
```python
import requests
import json
import base64

def update_website_file(file_path, data, github_token):
    url = f"https://api.github.com/repos/AlbrightLaboratories/brightflow-buy-sell-order/contents/{file_path}"
    
    # Get current file SHA
    response = requests.get(url, headers={"Authorization": f"Bearer {github_token}"})
    sha = response.json().get("sha") if response.status_code == 200 else None
    
    # Update file
    content = base64.b64encode(json.dumps(data).encode()).decode()
    payload = {
        "message": f"Update {file_path}",
        "content": content,
        "sha": sha
    }
    
    return requests.put(url, json=payload, headers={"Authorization": f"Bearer {github_token}"})
```

## ⏰ Required Schedule

**CRITICAL**: The website expects updates **every hour** from **4:30 AM to 8:00 PM Eastern Standard Time**.

### Cron Schedule:
```
30 9-23 * * *     # 4:30 AM - 7:30 PM EST (accounting for UTC offset)
30 0-1 * * *      # 7:30 PM - 8:30 PM EST
```

### Your Timing Responsibilities:
1. **Run your ML pipeline** hourly during market hours
2. **Calculate performance** vs SPY, VFIAX, SPDR S&P 500
3. **Generate transaction list** (last 50 transactions)
4. **Update both JSON files** before the website checks (at :30 minutes past each hour)

## 🔒 Security Setup

### Required GitHub Token:
1. Create a **Personal Access Token** in GitHub with `repo` permissions
2. Add it as `BRIGHTFLOW_WEBSITE_TOKEN` in your ML repo secrets
3. **Scope**: Only needs write access to `AlbrightLaboratories/brightflow-buy-sell-order`

### What Data is Safe to Share:
✅ **Performance percentages and ratios**  
✅ **Aggregated investment returns**  
✅ **Transaction summaries (symbol, action, quantity)**  
✅ **Historical performance comparisons**  

❌ **Never share**:  
- Your ML algorithms or models
- API keys or credentials  
- Raw market data feeds
- Proprietary trading signals

## 📈 Data Requirements

### Performance Calculations:
- **Start Date**: September 25, 2024 (baseline $1.00)
- **BrightFlow**: Your algorithm's performance
- **Comparison Benchmarks**: SPY, VFIAX, SPDR S&P 500 ETF
- **Daily Updates**: Calculate how $1 invested on 9/25/24 would perform

### Transaction History:
- **Keep last 50 transactions** only
- **Include**: Date, time, action (BUY/SELL), symbol, quantity, price
- **Calculate**: Running balance after each transaction
- **Optional**: Add confidence scores and strategy names

## 🔍 Testing Your Integration

### Verify Your Data:
1. **Push test data** to the JSON files
2. **Check the website** at `https://albright-laboratories.github.io/brightflow-buy-sell-order/`
3. **Look for**: "✓ Data updated" indicator in top-right corner
4. **Verify**: Charts update with your performance data
5. **Check**: Transaction table shows your recent trades

### Debug Issues:
- **Website console**: Check for fetch errors
- **GitHub API**: Verify 200/201 response codes
- **JSON format**: Validate structure matches examples exactly
- **Timestamps**: Ensure ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)

## 🎯 Success Criteria

**You'll know it's working when:**
✅ Website shows real BrightFlow performance data  
✅ Charts display your algorithm vs benchmark comparisons  
✅ Transaction table shows your recent trades  
✅ Updates happen automatically every hour  
✅ Users see "✓ Data updated" notifications  

## 🚀 Next Steps

1. **Copy the `update_data.py` script** to your ML repository
2. **Set up GitHub token** with repo access to the website repository  
3. **Create the complete GitHub Actions workflow** in your ML repo (for disaster recovery)
4. **Add all required secrets** to your ML repository (API keys, GitHub token)
5. **Test with sample data** to verify the integration works
6. **Monitor the website** to ensure updates are appearing correctly

## 🔄 **Disaster Recovery Strategy**

### **Primary Setup**: Your Kubernetes Cluster
- Runs your main ML pipeline
- Updates website data hourly
- Full control and customization

### **Backup Setup**: GitHub Actions Workflow  
- **Automatic failover** if Kubernetes is down
- **Same schedule** (hourly 4:30 AM - 8 PM EST)
- **Same data format** and update process
- **Zero manual intervention** required

### **Recovery Process**:
1. **If Kubernetes fails**: GitHub Actions automatically continues updates
2. **Manual recovery**: Clone ML repo to any machine, workflow runs immediately  
3. **Emergency updates**: Manually trigger workflow anytime
4. **Seamless transition**: Website users never notice the difference

### **Required Setup for Disaster Recovery**:
```bash
# In your ML repository, add these secrets:
BRIGHTFLOW_WEBSITE_TOKEN=your_github_token_here
ALPHA_VANTAGE_API_KEY=your_api_key_here  
POLYGON_API_KEY=your_api_key_here
# Add other market data API keys as needed
```

**This ensures your BrightFlow website never goes dark, even if your entire infrastructure is down!**

## 📞 Support

**Files to reference:**
- `update_data.py` - Ready-to-use Python script
- `DATA_INTEGRATION.md` - Technical documentation  
- `DIAGRAM_PULL.md` - Security and data flow diagrams

**The website is ready and waiting for your data - just follow this format and schedule!**