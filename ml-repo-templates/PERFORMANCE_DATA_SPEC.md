# Performance Data Specification

## Overview
The BrightFlow dashboard requires performance data for your ML algorithm compared against 18 global market indices.

## File Location
**Target**: `data/performance.json` in the `brightflow-buy-sell-order` repository

## Required Format

### Structure
```json
{
  "lastUpdated": "ISO-8601 timestamp",
  "currentValue": number,
  "brightflow": [ ... ],
  "nasdaq": [ ... ],
  "djia": [ ... ],
  // ... 15 more indices
}
```

### Required Fields

#### Top Level
- `lastUpdated` (string): ISO-8601 timestamp of when data was generated
- `currentValue` (number): Current normalized value of BrightFlow algorithm
- All index keys listed below (array of data points)

#### Data Points
Each index is an array of objects with:
```json
{
  "date": "YYYY-MM-DD",
  "value": number
}
```

- **`date`**: Date string in ISO format (YYYY-MM-DD)
- **`value`**: Normalized value (typically starts at 100.0)

### All Required Index Keys

**Must include all 19 keys** (BrightFlow + 18 indices):

#### United States (6)
- `nasdaq` - NASDAQ Composite Index
- `djia` - Dow Jones Industrial Average
- `sp500` - S&P 500 Index
- `russell1000` - Russell 1000 Index
- `russell3000` - Russell 3000 Index
- `russell2000` - Russell 2000 Index

#### Global (3)
- `gold` - S&P GSCI Gold
- `sp_global_bmi` - S&P Global BMI
- `global_dow` - Global Dow Realtime USD

#### Asia-Pacific (5)
- `nikkei225` - Nikkei 225 (Japan)
- `topix` - TOPIX (Japan)
- `sse_composite` - SSE Composite Index (Shanghai, China)
- `hang_seng` - Hang Seng Index (Hong Kong)
- `kospi` - KOSPI (South Korea)

#### Europe (4)
- `ftse100` - FTSE 100 Index (UK)
- `dax` - DAX PERFORMANCE-INDEX (Germany)
- `cac40` - CAC 40 (France)
- `eurostoxx50` - EURO STOXX 50

#### Your Algorithm
- `brightflow` - Your ML algorithm performance

## Data Guidelines

### Normalization
- All values should start at **100.0** on the first date
- Values represent percentage growth from baseline
- Example: 105.5 = 5.5% gain from start

### Date Range
- Provide **at least 30 days** of historical data
- More data is better (up to 5 years)
- All indices must have the **same dates**
- Dates should be in chronological order

### Update Frequency
- Update this file **at minimum once per day**
- Dashboard checks freshness (max age: 30 minutes for recommendations)
- More frequent updates (hourly/5min) are preferred

## Example
See `performance_template.json` in this directory for a complete working example.

## Validation

Your data will be validated for:
1. ✅ All 19 keys present (brightflow + 18 indices)
2. ✅ Each key is an array
3. ✅ Each array has objects with `date` and `value`
4. ✅ All arrays have the same length
5. ✅ Dates are in chronological order
6. ✅ `lastUpdated` is recent (within 30 minutes)

## Testing

Test your data locally:
```bash
python3 -c "
import json
data = json.load(open('data/performance.json'))
required = ['brightflow', 'nasdaq', 'djia', 'sp500', 'russell1000', 'russell3000',
            'russell2000', 'gold', 'sp_global_bmi', 'global_dow', 'nikkei225',
            'topix', 'sse_composite', 'hang_seng', 'kospi', 'ftse100', 'dax',
            'cac40', 'eurostoxx50']
missing = [k for k in required if k not in data]
if missing:
    print(f'❌ Missing keys: {missing}')
else:
    print('✅ All indices present')
    lengths = {k: len(data[k]) for k in required}
    if len(set(lengths.values())) == 1:
        print(f'✅ All arrays same length: {list(lengths.values())[0]}')
    else:
        print(f'❌ Array length mismatch: {lengths}')
"
```

## Questions?
Contact the frontend team or open an issue in the repository.
