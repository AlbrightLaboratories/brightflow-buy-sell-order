# ML.md - BrightFlow Data Integration Instructions

**Purpose:** This document provides clear instructions for the GitHub Actions workflow on how to pull, process, and integrate data from multiple sources into the BrightFlow website.

---

## 🎯 **Primary Data Sources**

### 1. **brightflow-ML Repository** 
- **URL:** `https://github.com/AlbrightLaboratories/brightflow-ML`
- **Files to Extract:**
  - `TheChart.md` → Performance analysis and algorithm results
  - `data/transactions.json` → Transaction ledger
  - `data/hourly_market_data.json` → Market data
  - `data/performance.json` → Performance metrics

### 2. **brightflow Issues Repository**
- **URL:** `https://github.com/AlbrightLaboratories/brightflow/issues`
- **Purpose:** Extract real trading signals and recommendations
- **API Endpoint:** `https://api.github.com/repos/AlbrightLaboratories/brightflow/issues`

### 3. **Issue Comments Analysis**
- **Purpose:** Extract detailed trading instructions from comments
- **API Endpoint:** `https://api.github.com/repos/AlbrightLaboratories/brightflow/issues/{issue_number}/comments`

---

## 📊 **Data Processing Instructions**

### **Step 1: Fetch TheChart.md Analysis**
```python
# Extract performance metrics from TheChart.md
performance_patterns = {
    'brightflow_return': r'BrightFlow ML Portfolio.*?\+(\d+\.\d+)% return',
    'spy_return': r'SPY.*?\+(\d+\.\d+)% return', 
    'vfiax_return': r'VFIAX.*?\+(\d+\.\d+)% return',
    'spdr_return': r'SPDR S&P 500.*?\+(\d+\.\d+)% return'
}

# Generate chart data for last 30 days
# Create performance.json with daily values
```

### **Step 2: Extract Trading Signals from Issues**
```python
# Keywords to look for in issues
trading_keywords = [
    'BUY', 'SELL', 'HOLD', 'stock', 'trading', 
    'algorithm', 'ML', 'recommendation', 'signal'
]

# Extract stock symbols (3-5 uppercase letters)
stock_symbols = re.findall(r'\b[A-Z]{3,5}\b', issue_content)

# Extract prices (numbers with $ or decimal)
prices = re.findall(r'\$?(\d+\.?\d*)', issue_content)
```

### **Step 3: Analyze Issue Comments**
```python
# Look for specific trading instructions in comments
trading_instructions = re.findall(
    r'(BUY|SELL|HOLD).*?([A-Z]{3,5}).*?(\$?\d+\.?\d*)', 
    comment_body.upper()
)
```

---

## 🔄 **Workflow Execution Steps**

### **1. Repository Data Fetch**
```bash
# Clone brightflow-ML repository
git clone https://github.com/AlbrightLaboratories/brightflow-ML.git temp-ml-repo

# Copy essential files
cp temp-ml-repo/TheChart.md .
cp temp-ml-repo/data/transactions.json data/
cp temp-ml-repo/data/hourly_market_data.json data/
```

### **2. Issues API Fetch**
```python
# Fetch issues from brightflow repository
issues_url = 'https://api.github.com/repos/AlbrightLaboratories/brightflow/issues'
headers = {'Accept': 'application/vnd.github.v3+json'}
response = requests.get(issues_url, headers=headers)
issues = response.json()
```

### **3. Data Processing Pipeline**
```python
# Process each issue for trading signals
for issue in issues:
    if contains_trading_keywords(issue):
        extract_stock_symbols(issue)
        extract_prices(issue)
        analyze_comments(issue)
```

### **4. Generate Output Files**
```python
# Create structured data files
output_files = {
    'data/performance.json': generate_performance_data(),
    'data/transactions.json': generate_transaction_data(),
    'data/trading_signals.json': generate_trading_signals(),
    'data/detailed_trading_signals.json': generate_detailed_signals()
}
```

---

## 📁 **Output File Specifications**

### **performance.json**
```json
{
  "lastUpdated": "2025-10-16T01:30:00Z",
  "startDate": "2024-09-25",
  "currentValue": 1.2847,
  "dailyChange": 0.000234,
  "performance": {
    "brightflow": [{"date": "2024-09-25", "value": 1.0}, ...],
    "spy": [{"date": "2024-09-25", "value": 1.0}, ...],
    "vfiax": [{"date": "2024-09-25", "value": 1.0}, ...],
    "spdr": [{"date": "2024-09-25", "value": 1.0}, ...]
  },
  "outperformance": 15.07,
  "totalReturn": 28.47,
  "dataSource": "TheChart.md analysis"
}
```

### **trading_signals.json**
```json
{
  "lastUpdated": "2025-10-16T01:30:00Z",
  "totalSignals": 25,
  "source": "brightflow issues repository",
  "signals": [
    {
      "issue_number": 123,
      "title": "ML Recommendation: BUY AAPL",
      "created_at": "2025-10-15T14:30:00Z",
      "stock_symbols": ["AAPL"],
      "prices": [175.50],
      "body_preview": "Algorithm A recommends buying AAPL at $175.50..."
    }
  ]
}
```

### **detailed_trading_signals.json**
```json
{
  "lastUpdated": "2025-10-16T01:30:00Z",
  "totalDetailedSignals": 15,
  "source": "brightflow issues comments",
  "detailed_signals": [
    {
      "issue_number": 123,
      "comment_id": 456789,
      "author": "brightflow-ml-bot",
      "created_at": "2025-10-15T14:35:00Z",
      "body": "BUY 10 shares of AAPL at $175.50",
      "trading_instructions": [["BUY", "AAPL", "175.50"]]
    }
  ]
}
```

---

## ⏰ **Scheduling Instructions**

### **Market Hours (9 AM - 4 PM EST, Mon-Fri)**
- **Frequency:** Every 15 minutes
- **Priority:** High - Real-time trading signals
- **Actions:** Full data refresh + issue analysis

### **After Hours (4 PM - 9 AM EST)**
- **Frequency:** Every 2 hours
- **Priority:** Medium - Background updates
- **Actions:** Basic data refresh + issue monitoring

### **Daily Maintenance**
- **Time:** Midnight UTC
- **Priority:** Low - Cleanup and optimization
- **Actions:** Full repository sync + data validation

---

## 🔍 **Data Validation Rules**

### **Stock Symbol Validation**
```python
def validate_stock_symbol(symbol):
    return (
        len(symbol) >= 3 and 
        len(symbol) <= 5 and 
        symbol.isalpha() and 
        symbol.isupper()
    )
```

### **Price Validation**
```python
def validate_price(price):
    try:
        price_float = float(price)
        return 0.01 <= price_float <= 10000.00
    except ValueError:
        return False
```

### **Date Validation**
```python
def validate_date(date_string):
    try:
        datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return True
    except ValueError:
        return False
```

---

## 🚨 **Error Handling**

### **API Rate Limits**
- **GitHub API:** 5000 requests/hour
- **Strategy:** Implement exponential backoff
- **Fallback:** Use cached data if API fails

### **Data Source Failures**
- **brightflow-ML repo:** Use last known good data
- **Issues API:** Skip issue analysis, continue with other data
- **TheChart.md:** Generate default performance data

### **File Generation Errors**
- **Missing files:** Create empty placeholder files
- **Invalid JSON:** Log error, skip file generation
- **Permission errors:** Retry with different approach

---

## 📈 **Performance Monitoring**

### **Success Metrics**
- **Data freshness:** < 15 minutes during market hours
- **API success rate:** > 95%
- **File generation:** 100% success rate
- **Website updates:** < 5 minutes from data change

### **Alert Conditions**
- **No updates for 30 minutes** during market hours
- **API failure rate > 10%**
- **Missing critical files** (performance.json, transactions.json)
- **Data validation failures > 5%**

---

## 🔧 **Manual Trigger Commands**

### **Force Full Update**
```bash
# Trigger via GitHub API
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/AlbrightLaboratories/brightflow-buy-sell-order/actions/workflows/update-brightflow-data.yml/dispatches \
  -d '{"ref": "main", "inputs": {"force_update": "true"}}'
```

### **Test Data Sources**
```bash
# Test brightflow-ML repository access
curl -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/AlbrightLaboratories/brightflow-ML/contents/TheChart.md

# Test brightflow issues access
curl -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/AlbrightLaboratories/brightflow/issues
```

---

## 📋 **Checklist for Each Update Cycle**

- [ ] **Fetch TheChart.md** from brightflow-ML repository
- [ ] **Extract performance metrics** using regex patterns
- [ ] **Generate chart data** for last 30 days
- [ ] **Fetch issues** from brightflow repository
- [ ] **Extract trading signals** from issue content
- [ ] **Analyze issue comments** for detailed instructions
- [ ] **Validate all data** using validation rules
- [ ] **Generate output files** (performance.json, trading_signals.json, etc.)
- [ ] **Commit changes** with descriptive message
- [ ] **Push to main branch** to trigger GitHub Pages update
- [ ] **Verify website update** at https://albright-laboratories.github.io/brightflow-buy-sell-order/

---

## 🎯 **Expected Results**

After successful execution, the website should display:

1. **Real-time performance chart** showing BrightFlow vs benchmarks
2. **Live transaction ledger** with last 50 transactions
3. **Trading signals table** from brightflow issues
4. **Performance metrics** showing +28.47% return vs +13.40% SPY
5. **Outperformance indicator** of +15.07% above benchmarks

---

**Last Updated:** October 16, 2025  
**Version:** 1.0  
**Status:** ✅ Active - Ready for automated execution
