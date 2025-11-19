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

    - name: Export Real Data
      run: python scripts/export_trading_data.py

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

### 4. Export Your Real Data Files

**CRITICAL: DO NOT generate mock/fake data. Export REAL data from your ML system.**

Create `scripts/export_trading_data.py` to COPY your real data:

```python
#!/usr/bin/env python3
"""
EXPORT REAL DATA ONLY - No mock/fake data allowed.
This script must copy actual data from your ML trading system.
"""
import json
import shutil
from pathlib import Path

def export_real_trading_data():
    """
    Copy REAL data files from your ML system to output directory.

    YOU MUST:
    - Locate where your ML system stores real transaction data
    - Find your real performance calculations
    - Export actual market index data
    - Copy real trading recommendations

    NEVER:
    - Generate placeholder data
    - Create fake/mock transactions
    - Use empty arrays
    - Make up values
    """
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)

    # TODO: Replace with YOUR actual data file paths
    # Example:
    # shutil.copy("/path/to/real/transactions.json", output_dir / "transactions.json")
    # shutil.copy("/path/to/real/performance.json", output_dir / "performance.json")
    # shutil.copy("/path/to/real/recommendations.json", output_dir / "recommendations.json")
    # shutil.copy("/path/to/real/hourly_market_data.json", output_dir / "hourly_market_data.json")

    print("✅ REAL data exported (verify no mock/fake data!)")

if __name__ == "__main__":
    export_real_trading_data()
```

**Key requirements for your REAL data:**

1. **Add market index data to your ML system:**
   - Your ML system must track all 10 market indices
   - Fetch REAL market prices using yfinance or your data provider
   - Calculate actual normalized performance (base 100 from Sept 25, 2024)
   - Store alongside your BrightFlow performance data

2. **Normalize all indices to base 100** (starting Sept 25, 2024):
   - Formula: `normalized_value = 100 * (current_price / start_price)`
   - Each index starts at 100.0 on Sept 25, 2024
   - Track daily percentage changes from that baseline

3. **Match dates exactly** across all indices:
   - All indices must have data for the same dates as `brightflow` array
   - Use format: `"YYYY-MM-DD"`
   - No gaps, no mismatched dates

4. **Export, don't generate:**
   - Your script should COPY existing data files
   - Don't create new fake data each time
   - Export the same real data your ML system uses internally

### 5. Add Market Index Tracking to Your ML System

**Your ML system needs to store REAL market index data alongside BrightFlow data.**

Where you currently track BrightFlow performance, also track these 10 indices:
- Fetch real market prices daily for: SPY, VFIAX, VOO, QQQ, DIA, VTI, IWM, VXUS, EEM, VEA
- Normalize each to base 100 (starting Sept 25, 2024)
- Store in the same database/storage as your BrightFlow performance
- When you export data, include all indices in performance.json

**This must be added to your ML system's data collection process, not generated at export time.**

### 6. Required GitHub Secret

**Repository:** brightflow-ml
**Settings:** Settings → Secrets → Actions
**Secret name:** `SANDBOX_PUSH_TOKEN`
**Value:** Personal Access Token with `repo` scope
**Create at:** https://github.com/settings/tokens/new

---

## 📂 File Locations and Paths

**Source (brightflow-ml):**
- Your ML system stores REAL data at: `[wherever your ML system stores data]`
- Export script copies REAL data to: `output/*.json`
- 4 files: `transactions.json`, `performance.json`, `recommendations.json`, `hourly_market_data.json`
- **CRITICAL:** These must be REAL data files, not generated/mock data

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
  ├─ ML system tracks real trading + market indices
  ├─ Export script runs every 3 minutes
  ├─ COPIES 4 REAL data files (no mock/fake data!)
  ├─ Pushes REAL data to brightflow-sandbox/data branch
  │
  └─> brightflow-sandbox (data/data/*.json)
        │
        └─> brightflow-buy-sell-order pulls every 5 minutes
              │
              └─> GitHub Pages deploys automatically
                    │
                    └─> Dashboard shows REAL live data! 🎉
```

---

## ⚠️ Critical Requirements

1. ✅ **REAL DATA ONLY** - No mock/fake/placeholder data. Export actual trading data from your ML system
2. ✅ **ISO 8601 timestamps** - Always use UTC timezone
3. ✅ **All 10 market indices** - Missing indices = broken chart
4. ✅ **Matching dates** - All indices must have same date arrays
5. ✅ **Every 3 minutes** - Set cron to `*/3 * * * *`
6. ✅ **Correct path** - `brightflow-sandbox/data/data/*.json`
7. ✅ **Correct branch** - Push to `data` branch (not `main`)
8. ✅ **Export, don't generate** - Copy existing data files from your ML system

---

## 📞 Questions?

- Full documentation: `ML_DATA_PUSH_PROMPT.md` in brightflow-buy-sell-order repo
- Architecture details: `DATA_PIPELINE_README.md` in brightflow-buy-sell-order repo
- Current issue: Dashboard only shows BrightFlow vs SPY (missing 9 other indices)

---

## 🎯 Action Items Summary

- [ ] **CRITICAL:** Locate where your ML system stores REAL trading data
- [ ] Add market index tracking to ML system (fetch REAL prices for 10 indices daily)
- [ ] Update ML system to normalize all indices to base 100 (starting Sept 25, 2024)
- [ ] Create `scripts/export_trading_data.py` to COPY real data files (not generate fake data)
- [ ] Create `.github/workflows/push-to-sandbox.yml` workflow
- [ ] Set workflow schedule to every 3 minutes (`*/3 * * * *`)
- [ ] Add `SANDBOX_PUSH_TOKEN` secret to brightflow-ml repository
- [ ] Test export script locally - verify REAL data (no mock/fake/placeholder data)
- [ ] Test workflow manually before enabling scheduled runs
- [ ] Verify REAL data appears in brightflow-sandbox/data branch
- [ ] Confirm dashboard displays all 10 market indices with REAL market data

---

**Document Created:** November 19, 2025
**Status:** 🚨 URGENT - Dashboard missing critical comparison data
**Priority:** HIGH - Affects customer-facing dashboard functionality
