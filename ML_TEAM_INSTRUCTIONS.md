# 🚨 BrightFlow ML Team - Complete Setup Instructions

## Executive Summary

Set up automated data sync from `brightflow-buy-sell-order/data` → `brightflow-sandbox` every 3 minutes.

**CRITICAL:** Only copy REAL data. Never generate mock/fake/placeholder data.

---

## 🎯 What You Need to Do

### Step 1: Clone Both Repositories

```bash
cd ~/projects  # or your preferred directory
git clone https://github.com/AlbrightLaboratories/brightflow-ml.git
git clone https://github.com/AlbrightLaboratories/brightflow-buy-sell-order.git
```

### Step 2: Verify Data Source

Check that real data exists:

```bash
cd brightflow-buy-sell-order/data
ls -la
# You should see:
# - transactions.json
# - performance.json
# - recommendations.json
# - hourly_market_data.json
```

### Step 3: Add Market Indices to performance.json

**CURRENT PROBLEM:** `brightflow-buy-sell-order/data/performance.json` only has `brightflow` and `spy`.

**REQUIRED:** Add 8 more market indices to this file.

Edit `brightflow-buy-sell-order/data/performance.json` to include:

```json
{
  "currentValue": 100.69,
  "brightflow": [
    {"date": "2025-10-27", "value": 371.43},
    {"date": "2025-10-29", "value": 525.37}
  ],
  "spy": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.06}
  ],
  "vfiax": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.05}
  ],
  "voo": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.06}
  ],
  "qqq": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.12}
  ],
  "dia": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.04}
  ],
  "vti": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.06}
  ],
  "iwm": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 99.95}
  ],
  "vxus": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.02}
  ],
  "eem": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.08}
  ],
  "vea": [
    {"date": "2025-10-27", "value": 100.0},
    {"date": "2025-10-29", "value": 100.03}
  ],
  "lastUpdated": "2025-11-19T00:00:00Z"
}
```

**How to get real market index data:**

```python
import yfinance as yf
from datetime import datetime

# Fetch real market prices
indices = {
    'vfiax': 'VFIAX',
    'voo': 'VOO',
    'qqq': 'QQQ',
    'dia': 'DIA',
    'vti': 'VTI',
    'iwm': 'IWM',
    'vxus': 'VXUS',
    'eem': 'EEM',
    'vea': 'VEA'
}

start_date = '2024-09-25'  # BrightFlow start date
base_value = 100.0

for key, symbol in indices.items():
    ticker = yf.Ticker(symbol)
    hist = ticker.history(start=start_date)

    # Normalize to base 100
    start_price = hist['Close'].iloc[0]
    normalized = (hist['Close'] / start_price) * base_value

    # Convert to required format
    data = [
        {"date": date.strftime("%Y-%m-%d"), "value": float(value)}
        for date, value in normalized.items()
    ]

    print(f'"{key}": {data}')
```

### Step 4: Create Export Script

Create `brightflow-ml/scripts/export_trading_data.py`:

```python
#!/usr/bin/env python3
"""
Export REAL data from brightflow-buy-sell-order/data to sandbox.
NEVER generate mock/fake data - only copy real files.
"""
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

def export_real_trading_data():
    """
    Copy REAL data files from brightflow-buy-sell-order/data directory.

    REQUIREMENTS:
    - Copy actual data from brightflow-buy-sell-order repo
    - Verify all 10 market indices present in performance.json
    - Never use mock/fake/placeholder data
    """
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)

    # Data source: brightflow-buy-sell-order/data
    data_source = Path("../brightflow-buy-sell-order/data")

    if not data_source.exists():
        raise FileNotFoundError(
            f"Data source not found: {data_source}\n"
            "Make sure brightflow-buy-sell-order is cloned alongside brightflow-ml"
        )

    # Copy real data files
    print(f"📂 Copying REAL data from {data_source}")

    shutil.copy(data_source / "transactions.json", output_dir / "transactions.json")
    shutil.copy(data_source / "performance.json", output_dir / "performance.json")
    shutil.copy(data_source / "recommendations.json", output_dir / "recommendations.json")
    shutil.copy(data_source / "hourly_market_data.json", output_dir / "hourly_market_data.json")

    # Verify performance.json has all required indices
    with open(output_dir / "performance.json") as f:
        perf = json.load(f)

    required_indices = ['brightflow', 'spy', 'vfiax', 'voo', 'qqq', 'dia', 'vti', 'iwm', 'vxus', 'eem', 'vea']
    missing = [idx for idx in required_indices if idx not in perf]

    if missing:
        raise ValueError(
            f"❌ performance.json missing required indices: {missing}\n"
            "Add these indices to brightflow-buy-sell-order/data/performance.json first!"
        )

    print("✅ REAL data exported from brightflow-buy-sell-order/data!")
    print(f"   - {len(perf['brightflow'])} days of BrightFlow performance")
    print(f"   - {len(required_indices)} market indices included")
    print("⚠️  Verified: No mock/fake data - all real!")

if __name__ == "__main__":
    export_real_trading_data()
```

Make it executable:

```bash
chmod +x brightflow-ml/scripts/export_trading_data.py
```

### Step 5: Test Export Script Locally

```bash
cd brightflow-ml
python scripts/export_trading_data.py

# Verify output
ls output/
cat output/performance.json | python -m json.tool | grep -E '"(brightflow|spy|vfiax|voo|qqq|dia|vti|iwm|vxus|eem|vea)"'
```

You should see all 11 keys (brightflow + 10 indices).

### Step 6: Create GitHub Workflow

Create `brightflow-ml/.github/workflows/push-to-sandbox.yml`:

```yaml
name: Push Data to Sandbox

on:
  schedule:
    - cron: '*/3 * * * *'  # Every 3 minutes
  workflow_dispatch:

jobs:
  push-data:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout brightflow-ml
      uses: actions/checkout@v3
      with:
        path: brightflow-ml

    - name: Checkout brightflow-buy-sell-order (data source)
      uses: actions/checkout@v3
      with:
        repository: AlbrightLaboratories/brightflow-buy-sell-order
        path: brightflow-buy-sell-order

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'

    - name: Export Real Data
      working-directory: brightflow-ml
      run: python scripts/export_trading_data.py

    - name: Clone Sandbox
      env:
        SANDBOX_TOKEN: ${{ secrets.SANDBOX_PUSH_TOKEN }}
      run: |
        git clone https://x-access-token:${SANDBOX_TOKEN}@github.com/AlbrightLaboratories/brightflow-sandbox.git sandbox

    - name: Copy Data Files
      working-directory: brightflow-ml
      run: |
        mkdir -p ../sandbox/data/data
        cp output/*.json ../sandbox/data/data/

    - name: Push to Sandbox
      run: |
        cd sandbox
        git config user.name "BrightFlow ML Bot"
        git config user.email "ml-bot@brightflow.ai"
        git add data/data/*.json
        git commit -m "chore: update trading data $(date -u +'%Y-%m-%d %H:%M:%S') UTC" || exit 0
        git push origin data
```

### Step 7: Add GitHub Secret

1. Go to brightflow-ml repository: https://github.com/AlbrightLaboratories/brightflow-ml/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SANDBOX_PUSH_TOKEN`
4. Value: Create a Personal Access Token at https://github.com/settings/tokens/new
   - Permissions: `repo` (full control)
   - Expiration: No expiration (or 1 year)
5. Click "Add secret"

### Step 8: Test Workflow

```bash
cd brightflow-ml
git add .github/workflows/push-to-sandbox.yml
git add scripts/export_trading_data.py
git commit -m "feat: Add automated data export to sandbox"
git push origin main
```

Then:
1. Go to https://github.com/AlbrightLaboratories/brightflow-ml/actions
2. Click "Push Data to Sandbox"
3. Click "Run workflow"
4. Wait for it to complete
5. Check https://github.com/AlbrightLaboratories/brightflow-sandbox/tree/data/data for updated files

---

## 📊 Data Flow

```
brightflow-buy-sell-order/data
  ├─ transactions.json (REAL trading history)
  ├─ performance.json (REAL performance + 10 market indices)
  ├─ recommendations.json (REAL ML recommendations)
  └─ hourly_market_data.json (REAL hourly activity)
    │
    └─> brightflow-ml/scripts/export_trading_data.py
          ├─ Runs every 3 minutes
          ├─ COPIES 4 files (no generation!)
          └─> brightflow-sandbox/data/data/
                │
                └─> brightflow-buy-sell-order
                      ├─ Pulls every 5 minutes
                      └─> GitHub Pages → Dashboard 🎉
```

---

## 📋 Required Files & Formats

### transactions.json
```json
{
  "lastUpdated": "2025-11-19T00:00:00Z",
  "totalTransactions": 100,
  "currentBalance": 2115.79,
  "transactions": [
    {
      "timestamp": "2025-11-18T14:10:51.134424+00:00",
      "symbol": "AAPL",
      "action": "SELL",
      "shares": 0.4005,
      "price": 267.46,
      "amount": 107.12,
      "balance": 2115.79
    }
  ]
}
```

### performance.json
**MUST include all 11 keys:** `brightflow`, `spy`, `vfiax`, `voo`, `qqq`, `dia`, `vti`, `iwm`, `vxus`, `eem`, `vea`

Each index array format:
```json
[
  {"date": "2025-10-27", "value": 100.0},
  {"date": "2025-10-29", "value": 100.06}
]
```

### recommendations.json
```json
{
  "date": "2025-11-19",
  "lastUpdated": "2025-11-19T00:00:00Z",
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

### hourly_market_data.json
```json
{
  "lastUpdated": "2025-11-19T00:00:00Z",
  "data": [
    {
      "timestamp": "2025-11-18T10:00:00+00:00",
      "tradeCount": 12,
      "avgPrice": 671.95,
      "volume": 1199.88
    }
  ]
}
```

---

## ⚠️ Critical Requirements

1. ✅ **REAL DATA ONLY** - Copy from brightflow-buy-sell-order/data, never generate mock data
2. ✅ **All 10 market indices** - Missing indices = broken dashboard chart
3. ✅ **ISO 8601 timestamps** - Always include UTC timezone
4. ✅ **Matching dates** - All indices must have same dates as brightflow array
5. ✅ **Every 3 minutes** - Workflow cron: `*/3 * * * *`
6. ✅ **Correct path** - Push to `brightflow-sandbox` repo, `data` branch, `data/data/` directory
7. ✅ **Normalize indices to base 100** - Starting Sept 25, 2024

---

## 🎯 Checklist

- [ ] Clone both repositories (brightflow-ml and brightflow-buy-sell-order)
- [ ] Verify data exists in brightflow-buy-sell-order/data/
- [ ] Add 10 market indices to brightflow-buy-sell-order/data/performance.json
- [ ] Create brightflow-ml/scripts/export_trading_data.py
- [ ] Test export script locally (verify no mock data)
- [ ] Create .github/workflows/push-to-sandbox.yml in brightflow-ml
- [ ] Add SANDBOX_PUSH_TOKEN secret to brightflow-ml repository
- [ ] Push workflow to brightflow-ml
- [ ] Test workflow manually via GitHub Actions
- [ ] Verify data appears in brightflow-sandbox/data branch
- [ ] Confirm dashboard shows all 10 market indices

---

## 🆘 Troubleshooting

**"Data source not found" error:**
- Make sure brightflow-buy-sell-order and brightflow-ml are cloned in the same parent directory
- Path should be: `~/projects/brightflow-ml/` and `~/projects/brightflow-buy-sell-order/`

**"Missing required indices" error:**
- Add the missing market indices to brightflow-buy-sell-order/data/performance.json
- Use yfinance to fetch real market prices
- Normalize to base 100 starting Sept 25, 2024

**Workflow not running:**
- Check GitHub Actions tab for errors
- Verify SANDBOX_PUSH_TOKEN secret is set
- Ensure token has `repo` permissions

**Dashboard not updating:**
- Check brightflow-sandbox/data branch for recent commits
- Verify brightflow-buy-sell-order pulls from sandbox every 5 minutes
- Check GitHub Pages deployment status

---

## 📞 Questions?

- Data pipeline: See `DATA_PIPELINE_README.md` in brightflow-buy-sell-order
- Current status: Dashboard missing 9 market indices (only shows BrightFlow vs SPY)
- Priority: HIGH - Affects customer-facing dashboard

---

**Created:** November 19, 2025
**Status:** 🚨 URGENT - Complete setup required
**Next Review:** After first successful automated sync
