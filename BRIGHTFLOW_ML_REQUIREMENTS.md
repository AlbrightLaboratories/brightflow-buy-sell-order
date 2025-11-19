# 🚨 URGENT: BrightFlow ML Requirements

## Executive Summary

The **brightflow-ml** repository needs to push 4 JSON data files to **brightflow-sandbox** every 3 minutes. The dashboard is currently missing market index comparison data.

---

## 📍 Current Issues

1. ❌ **Missing Market Indices** - Performance chart only shows BrightFlow vs SPY
   - Dashboard supports 10+ market indices but data only includes SPY
   - **VFIAX is completely missing from your data generation**

2. ⚠️ **Update Frequency** - Need faster data refresh
   - Current: Unknown frequency
   - Required: **Every 3 minutes**

---

## ✅ What You Need to Do

### 1. Add Market Index Data Collection

Your ML system needs to fetch and normalize performance data for **10 market indices**:

**Required Indices (use lowercase keys in JSON):**
- `spy` - SPDR S&P 500 ETF ✅ (you have this)
- `vfiax` - Vanguard 500 Index Fund Admiral Shares ❌ **MISSING - ADD THIS!**
- `voo` - Vanguard S&P 500 ETF ❌ MISSING
- `qqq` - Invesco QQQ (NASDAQ-100) ❌ MISSING
- `dia` - SPDR Dow Jones Industrial Average ❌ MISSING
- `vti` - Vanguard Total Stock Market ETF ❌ MISSING
- `iwm` - iShares Russell 2000 (small-cap) ❌ MISSING
- `vxus` - Vanguard Total International Stock ❌ MISSING
- `eem` - iShares MSCI Emerging Markets ❌ MISSING
- `vea` - Vanguard FTSE Developed Markets ❌ MISSING

### 2. Update performance.json Format

**Current format (INCOMPLETE):**
```json
{
  "currentValue": 100.69,
  "brightflow": [
    {"date": "2025-10-27", "value": 371.43}
  ],
  "spy": [
    {"date": "2025-10-27", "value": 100.0}
  ],
  "lastUpdated": "2025-11-19T00:00:00Z"
}
```

**Required format (COMPLETE):**
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

### 3. Set Up Automated Data Push

**Location:** brightflow-ml repository
**Workflow file:** `.github/workflows/push-to-sandbox.yml`
**Frequency:** Every 3 minutes
**Target:** `brightflow-sandbox` repository, `data` branch, `data/data/` directory

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

### 4. Update Your Data Generation Script

**Key changes needed:**

1. **Fetch market index data** using yfinance or similar:
   ```python
   import yfinance as yf

   # Fetch index data
   indices = ['SPY', 'VFIAX', 'VOO', 'QQQ', 'DIA', 'VTI', 'IWM', 'VXUS', 'EEM', 'VEA']

   for symbol in indices:
       ticker = yf.Ticker(symbol)
       hist = ticker.history(start='2024-09-25', end=datetime.now())
       # Normalize to starting value of 100
       # Store in performance dict with lowercase key
   ```

2. **Normalize all indices to base 100** (starting Sept 25, 2024)
   - Each index starts at 100.0 on Sept 25, 2024
   - Calculate percentage change from that date
   - Formula: `normalized_value = 100 * (current_price / start_price)`

3. **Match dates exactly** across all indices
   - All indices must have data for the same dates as `brightflow` array
   - Use the same date format: `"YYYY-MM-DD"`

### 5. Required GitHub Secret

**Repository:** brightflow-ml
**Settings:** Settings → Secrets → Actions
**Secret name:** `SANDBOX_PUSH_TOKEN`
**Value:** Personal Access Token with `repo` scope
**Create at:** https://github.com/settings/tokens/new

---

## 📂 File Locations and Paths

**Source (brightflow-ml):**
- Your ML scripts generate to: `output/*.json`
- 4 files: `transactions.json`, `performance.json`, `recommendations.json`, `hourly_market_data.json`

**Destination (brightflow-sandbox):**
- Repository: `AlbrightLaboratories/brightflow-sandbox`
- Branch: `data`
- Path: `data/data/*.json`

**Final consumption (brightflow-buy-sell-order):**
- Pulls from sandbox every 5 minutes
- Displays on dashboard at: https://albrightlaboratories.github.io/brightflow-buy-sell-order/

---

## 🔄 Data Pipeline Flow

```
brightflow-ml
  ├─ ML scripts run every 3 minutes
  ├─ Generate 4 JSON files with ALL market indices
  ├─ Push to brightflow-sandbox/data branch
  │
  └─> brightflow-sandbox (data/data/*.json)
        │
        └─> brightflow-buy-sell-order pulls every 5 minutes
              │
              └─> GitHub Pages deploys automatically
                    │
                    └─> Dashboard shows live data! 🎉
```

---

## ⚠️ Critical Requirements

1. ✅ **ISO 8601 timestamps** - Always use UTC timezone
2. ✅ **All 10 market indices** - Missing indices = broken chart
3. ✅ **Matching dates** - All indices must have same date arrays
4. ✅ **Every 3 minutes** - Set cron to `*/3 * * * *`
5. ✅ **Correct path** - `brightflow-sandbox/data/data/*.json`
6. ✅ **Correct branch** - Push to `data` branch (not `main`)

---

## 📞 Questions?

- Full documentation: `ML_DATA_PUSH_PROMPT.md` in brightflow-buy-sell-order repo
- Architecture details: `DATA_PIPELINE_README.md` in brightflow-buy-sell-order repo
- Current issue: Dashboard only shows BrightFlow vs SPY (missing 9 other indices)

---

## 🎯 Action Items Summary

- [ ] Add VFIAX and 8 other market index data sources to ML pipeline
- [ ] Update performance.json generation to include all 10 indices
- [ ] Normalize all indices to base 100 (starting Sept 25, 2024)
- [ ] Create `.github/workflows/push-to-sandbox.yml` workflow
- [ ] Set workflow schedule to every 3 minutes (`*/3 * * * *`)
- [ ] Add `SANDBOX_PUSH_TOKEN` secret to brightflow-ml repository
- [ ] Test workflow manually before enabling scheduled runs
- [ ] Verify data appears in brightflow-sandbox/data branch
- [ ] Confirm dashboard displays all 10 market indices in comparison chart

---

**Document Created:** November 19, 2025
**Status:** 🚨 URGENT - Dashboard missing critical comparison data
**Priority:** HIGH - Affects customer-facing dashboard functionality
