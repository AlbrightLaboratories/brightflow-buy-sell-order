# 🤖 ML Data Pipeline Setup - brightflow-ml Instructions

## Quick Start for ML Team

You need to push 4 JSON files to `brightflow-sandbox/data/data/` every 5 minutes.

---

## 📋 Required Files & Formats

### 1. **transactions.json** - Trading History
```json
{
  "lastUpdated": "2025-11-16T01:03:20.414860",
  "totalTransactions": 9,
  "currentBalance": 525.37,
  "transactions": [
    {
      "timestamp": "2025-10-26T10:40:57.597192+00:00",
      "symbol": "SPY",
      "action": "BUY",
      "shares": 0.25,
      "price": 650.0,
      "amount": 162.5,
      "balance": 0.0
    }
  ]
}
```

### 2. **performance.json** - Portfolio Performance vs SPY
```json
{
  "currentValue": 100.09,
  "brightflow": [
    {"date": "2025-10-27", "value": 371.43},
    {"date": "2025-10-29", "value": 525.37}
  ],
  "spy": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.06}
  ],
  "lastUpdated": "2025-11-16T01:03:20.862279"
}
```

### 3. **recommendations.json** - Current Recommendations
```json
{
  "date": "2025-11-16",
  "lastUpdated": "2025-11-16T01:03:05.885718",
  "totalRecommendations": 0,
  "openPositions": 5,
  "recommendations": [],
  "positions": [
    {
      "symbol": "AAPL",
      "shares": 1.0,
      "entryPrice": 266.87,
      "currentPrice": 270.25,
      "profitPct": 1.27,
      "profitAmount": 3.38,
      "positionValue": 270.25,
      "entryDate": "2025-11-02",
      "status": "HELD"
    }
  ]
}
```

### 4. **hourly_market_data.json** - Hourly Trading Activity
```json
{
  "lastUpdated": "2025-11-16T01:03:20.727541",
  "data": [
    {
      "timestamp": "2025-10-26T10:00:00+00:00",
      "tradeCount": 1,
      "avgPrice": 650.0,
      "volume": 162.5
    }
  ]
}
```

---

## 🚀 GitHub Actions Workflow

Create `.github/workflows/push-to-sandbox.yml` in **brightflow-ml**:

```yaml
name: Push Data to Sandbox

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  push-data:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'

    - name: Install Dependencies
      run: |
        pip install pandas numpy yfinance python-dateutil requests

    - name: Generate Data
      run: python scripts/generate_trading_data.py

    - name: Clone Sandbox
      env:
        SANDBOX_TOKEN: ${{ secrets.SANDBOX_PUSH_TOKEN }}
      run: |
        git clone https://x-access-token:${SANDBOX_TOKEN}@github.com/AlbrightLaboratories/brightflow-sandbox.git sandbox

    - name: Copy Data Files
      run: |
        mkdir -p sandbox/data/data
        cp output/*.json sandbox/data/data/

    - name: Push to Sandbox
      run: |
        cd sandbox
        git config user.name "BrightFlow ML Bot"
        git config user.email "ml-bot@brightflow.ai"
        git add data/data/*.json
        git commit -m "chore: update trading data $(date -u +'%Y-%m-%d %H:%M:%S') UTC" || exit 0
        git push origin data
```

---

## 🐍 Python Script Template

Create `scripts/generate_trading_data.py` in **brightflow-ml**:

```python
#!/usr/bin/env python3
import json
from datetime import datetime, timezone
from pathlib import Path

def generate_trading_data():
    """Generate all required data files"""
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)

    # Generate transactions
    transactions = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "totalTransactions": 0,
        "currentBalance": 10000.0,
        "transactions": []
    }

    # Generate performance
    performance = {
        "currentValue": 10000.0,
        "brightflow": [],
        "spy": [],
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    }

    # Generate recommendations
    recommendations = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "totalRecommendations": 0,
        "openPositions": 0,
        "recommendations": [],
        "positions": []
    }

    # Generate hourly data
    hourly_data = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "data": []
    }

    # Write files
    with open(output_dir / "transactions.json", 'w') as f:
        json.dump(transactions, f, indent=2)

    with open(output_dir / "performance.json", 'w') as f:
        json.dump(performance, f, indent=2)

    with open(output_dir / "recommendations.json", 'w') as f:
        json.dump(recommendations, f, indent=2)

    with open(output_dir / "hourly_market_data.json", 'w') as f:
        json.dump(hourly_data, f, indent=2)

    print("✅ All data files generated!")

if __name__ == "__main__":
    generate_trading_data()
```

---

## 🔐 Required Secret

In **brightflow-ml** repository → Settings → Secrets → Actions:

**Add:** `SANDBOX_PUSH_TOKEN`
- Create at: https://github.com/settings/tokens/new
- Permissions: `repo` (full control)
- Scope: AlbrightLaboratories/brightflow-sandbox

---

## ✅ Testing

1. Run locally:
   ```bash
   python scripts/generate_trading_data.py
   ls output/  # Should see 4 JSON files
   ```

2. Validate JSON:
   ```bash
   python -m json.tool output/transactions.json
   ```

3. Test workflow:
   - Push workflow to brightflow-ml
   - Go to Actions tab → "Push Data to Sandbox"
   - Click "Run workflow"
   - Check brightflow-sandbox for new commits

---

## 📊 Data Flow

```
brightflow-ml (every 5 min)
    ↓ generates 4 JSON files
    ↓ pushes to brightflow-sandbox/data branch
brightflow-sandbox/data/data/*.json
    ↓
brightflow-buy-sell-order pulls (every 10 min)
    ↓
GitHub Pages auto-deploys
    ↓
Dashboard updates! 🎉
```

---

## 🎯 Critical Notes

1. **Use ISO 8601 timestamps** - Always include timezone (UTC)
2. **Target branch:** Push to `data` branch in sandbox repo
3. **Path:** Files go to `brightflow-sandbox/data/data/*.json`
4. **Frequency:** Every 5 minutes (brightflow-buy-sell-order pulls every 10 min)
5. **lastUpdated field is CRITICAL** - Dashboard validates freshness (max 30 min)

---

**Questions?** See `DATA_PIPELINE_README.md` in brightflow-buy-sell-order repo for full architecture.

**Created:** November 15, 2025
**Status:** Ready for Implementation ✅
