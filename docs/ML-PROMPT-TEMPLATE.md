# BrightFlow ML Repository Prompt Template

## 🎯 Copy this prompt to your ML repository:

---

**I need to integrate my ML trading algorithms with the BrightFlow website to enable 24/7 money-making opportunities. Here's what I need:**

### 📊 Data Integration Requirements:

1. **Update Performance Data** - Send my ML predictions to the BrightFlow website every 15 minutes with:
   - Portfolio performance vs benchmarks (SPY, VFIAX, SPDR)
   - Current portfolio value and daily change percentage
   - Historical performance data in JSON format

2. **Update Transaction Data** - Send trading decisions in real-time with:
   - Buy/Sell actions with timestamps
   - Stock symbols, quantities, prices, amounts
   - Running balance and confidence scores
   - ML strategy names and confidence levels

### 🔧 Technical Integration:

I need to implement one of these methods:

**Option A: Direct API Updates** (Recommended)
- Use the `update-data-api.py` script from the BrightFlow repository
- Directly update data files via GitHub API
- Maximum control and real-time updates

**Option B: Webhook Integration**
- POST data to a webhook server
- High-frequency updates for active trading
- Microservices architecture

**Option C: GitHub Actions Trigger**
- Trigger GitHub Actions workflow
- Good for scheduled updates
- Integrates with existing CI/CD

### 📋 Data Format Requirements:

**Performance Data:**
```json
{
    "currentValue": 1.0523,
    "dailyChange": 0.0234,
    "performance": {
        "brightflow": [{"date": "2024-09-25", "value": 1.0}],
        "spy": [{"date": "2024-09-25", "value": 1.0}],
        "vfiax": [{"date": "2024-09-25", "value": 1.0}],
        "spdr": [{"date": "2024-09-25", "value": 1.0}]
    }
}
```

**Transaction Data:**
```json
{
    "transactions": [{
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
    }],
    "currentBalance": 10214.43,
    "totalTransactions": 6
}
```

### ⏰ Update Schedule:
- **Performance data**: Every 15 minutes during market hours
- **Transaction data**: Real-time when trades occur
- **Off-hours**: Every 30 minutes

### 🎯 Success Criteria:
- Website shows fresh data (timestamps within 5 minutes)
- Charts and tables update automatically
- No JavaScript errors on the website
- 99%+ successful update rate

### 📁 Files I Need:
- `update-data-api.py` - Direct API integration
- `webhook-update.py` - Webhook server
- `trigger-update.py` - GitHub Actions trigger
- `ML-INTEGRATION-GUIDE.md` - Complete integration guide

### 🔑 Setup Required:
1. GitHub Personal Access Token with `repo` scope
2. Choose integration method (API, webhook, or GitHub Actions)
3. Implement data format conversion in my ML pipeline
4. Test with sample data before production

**Please help me implement this integration so my ML algorithms can continuously update the BrightFlow website with fresh trading data for maximum profit opportunities!**

---

## 🚀 How to Use This Prompt:

1. **Copy the prompt above** (everything between the dashes)
2. **Paste it into your ML repository** as a new issue or discussion
3. **Customize the details** based on your specific ML setup
4. **Include any specific requirements** about your data sources or algorithms
5. **Ask for help implementing** the integration method you prefer

## 📝 Additional Context to Include:

If you want to provide more context, add:

- **Your current ML pipeline** (Python, R, etc.)
- **Data sources** (Yahoo Finance, Alpha Vantage, etc.)
- **Update frequency** (every 5 minutes, hourly, etc.)
- **Trading strategy** (momentum, mean reversion, etc.)
- **Risk management** (position sizing, stop losses, etc.)
- **Performance metrics** (Sharpe ratio, max drawdown, etc.)

## 🎯 Expected Response:

The ML repository should help you:
1. Set up the GitHub token
2. Choose the best integration method
3. Implement data format conversion
4. Set up automated updates
5. Test the integration
6. Deploy to production

This will enable your ML algorithms to continuously feed fresh data to the BrightFlow website for 24/7 money-making opportunities! 💰
