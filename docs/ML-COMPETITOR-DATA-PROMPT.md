# BrightFlow ML Competitor Data Integration Prompt

## 🎯 Mission: Provide Comprehensive Competitor Data for Performance Comparison

Your ML repository needs to provide historical performance data for 28+ competitor ETFs to enable users to compare BrightFlow's performance against various market segments and investment strategies.

## 📊 Required Competitor Data

### U.S. Market ETFs (16 competitors)
- **SPY** - SPDR S&P 500 ETF Trust
- **VOO** - Vanguard S&P 500 ETF  
- **IVV** - iShares Core S&P 500 ETF
- **VTI** - Vanguard Total Stock Market ETF
- **ITOT** - iShares Core S&P Total U.S. Stock Market ETF
- **SCHB** - Schwab U.S. Broad Market ETF
- **IWM** - iShares Russell 2000 ETF
- **IJH** - iShares Core S&P Mid-Cap ETF
- **VB** - Vanguard Small-Cap ETF
- **VBR** - Vanguard Small-Cap Value ETF
- **VTV** - Vanguard Value ETF
- **VUG** - Vanguard Growth ETF
- **IUSG** - iShares Core S&P U.S. Growth ETF
- **IUSV** - iShares Core S&P U.S. Value ETF
- **DIA** - SPDR Dow Jones Industrial Average ETF
- **QQQ** - Invesco QQQ Trust

### International Market ETFs (12 competitors)
- **VXUS** - Vanguard Total International Stock ETF
- **VEU** - Vanguard FTSE All-World ex-US ETF
- **VEA** - Vanguard FTSE Developed Markets ETF
- **VWO** - Vanguard FTSE Emerging Markets ETF
- **EFA** - iShares MSCI EAFE ETF
- **EEM** - iShares MSCI Emerging Markets ETF
- **IEFA** - iShares Core MSCI EAFE IMI Index ETF
- **IEMG** - iShares Core MSCI Emerging Markets IMI Index ETF
- **SCHF** - Schwab International Equity ETF
- **SCHE** - Schwab Emerging Markets Equity ETF
- **SPDW** - SPDR Portfolio World ex-US ETF
- **SPEM** - SPDR Portfolio Emerging Markets ETF

## 📋 Data Format Requirements

### Performance Data Structure
```json
{
    "lastUpdated": "2025-01-16T15:30:00Z",
    "currentValue": 1.0523,
    "dailyChange": 0.0234,
    "performance": {
        "brightflow": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.01}
        ],
        "spy": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "voo": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "ivv": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "vti": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "itot": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "schb": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "iwm": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "ijh": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "vb": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "vbr": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "vtv": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "vug": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "iusg": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "iusv": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "dia": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "qqq": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "vxus": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "veu": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "vea": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "vwo": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "efa": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "eem": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "iefa": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "iemg": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "schf": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "sche": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "spdw": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ],
        "spem": [
            {"date": "2024-09-25", "value": 1.0},
            {"date": "2024-09-26", "value": 1.02}
        ]
    }
}
```

## 🔧 Data Requirements

### Historical Data
- **Start Date**: September 25, 2024 (same as BrightFlow)
- **End Date**: Current date
- **Frequency**: Daily data points
- **Format**: YYYY-MM-DD for dates
- **Values**: Normalized to 1.0 on start date

### Data Sources
Use reliable financial data providers:
- **Yahoo Finance API** (free tier available)
- **Alpha Vantage** (free tier available)
- **IEX Cloud** (free tier available)
- **Financial Modeling Prep** (free tier available)
- **Quandl** (free tier available)

### Data Quality
- **Accuracy**: Use official ETF closing prices
- **Consistency**: All ETFs must have same date range
- **Completeness**: No missing data points
- **Validation**: Cross-check with multiple sources

## 🚀 Implementation Guide

### Python Example
```python
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import json

class CompetitorDataCollector:
    def __init__(self):
        self.etf_symbols = [
            'SPY', 'VOO', 'IVV', 'VTI', 'ITOT', 'SCHB', 'IWM', 'IJH', 
            'VB', 'VBR', 'VTV', 'VUG', 'IUSG', 'IUSV', 'DIA', 'QQQ',
            'VXUS', 'VEU', 'VEA', 'VWO', 'EFA', 'EEM', 'IEFA', 'IEMG',
            'SCHF', 'SCHE', 'SPDW', 'SPEM'
        ]
        self.start_date = '2024-09-25'
        self.end_date = datetime.now().strftime('%Y-%m-%d')
    
    def collect_etf_data(self, symbol):
        """Collect historical data for a single ETF"""
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(start=self.start_date, end=self.end_date)
            
            if data.empty:
                print(f"No data found for {symbol}")
                return None
            
            # Normalize to 1.0 on start date
            normalized_data = data['Close'] / data['Close'].iloc[0]
            
            # Convert to required format
            result = []
            for date, value in normalized_data.items():
                result.append({
                    "date": date.strftime('%Y-%m-%d'),
                    "value": round(value, 6)
                })
            
            return result
            
        except Exception as e:
            print(f"Error collecting data for {symbol}: {e}")
            return None
    
    def collect_all_data(self):
        """Collect data for all ETFs"""
        all_data = {}
        
        for symbol in self.etf_symbols:
            print(f"Collecting data for {symbol}...")
            data = self.collect_etf_data(symbol)
            if data:
                all_data[symbol.lower()] = data
            else:
                print(f"Failed to collect data for {symbol}")
        
        return all_data
    
    def create_performance_json(self, brightflow_data):
        """Create the complete performance JSON"""
        competitor_data = self.collect_all_data()
        
        performance_data = {
            "lastUpdated": datetime.now().isoformat(),
            "currentValue": brightflow_data.get('currentValue', 1.0),
            "dailyChange": brightflow_data.get('dailyChange', 0.0),
            "performance": {
                "brightflow": brightflow_data.get('performance', []),
                **competitor_data
            }
        }
        
        return performance_data

# Usage
collector = CompetitorDataCollector()
performance_data = collector.create_performance_json(your_brightflow_data)

# Save to file
with open('performance.json', 'w') as f:
    json.dump(performance_data, f, indent=2)
```

### Data Validation
```python
def validate_competitor_data(data):
    """Validate competitor data quality"""
    required_symbols = [
        'spy', 'voo', 'ivv', 'vti', 'itot', 'schb', 'iwm', 'ijh',
        'vb', 'vbr', 'vtv', 'vug', 'iusg', 'iusv', 'dia', 'qqq',
        'vxus', 'veu', 'vea', 'vwo', 'efa', 'eem', 'iefa', 'iemg',
        'schf', 'sche', 'spdw', 'spem'
    ]
    
    issues = []
    
    for symbol in required_symbols:
        if symbol not in data['performance']:
            issues.append(f"Missing data for {symbol}")
            continue
        
        symbol_data = data['performance'][symbol]
        if not symbol_data or len(symbol_data) == 0:
            issues.append(f"Empty data for {symbol}")
            continue
        
        # Check if data starts with 1.0
        if symbol_data[0]['value'] != 1.0:
            issues.append(f"{symbol} data not normalized (starts with {symbol_data[0]['value']})")
        
        # Check for missing dates
        expected_days = (datetime.now() - datetime(2024, 9, 25)).days
        if len(symbol_data) < expected_days * 0.8:  # Allow 20% missing data
            issues.append(f"{symbol} has insufficient data points ({len(symbol_data)} vs expected ~{expected_days})")
    
    return issues
```

## ⏰ Update Schedule

### Recommended Update Frequency
- **Daily**: During market hours (9:30 AM - 4:00 PM EST)
- **After Hours**: Once after market close
- **Weekends**: Once on Sunday evening

### Data Freshness
- **Maximum Age**: 24 hours
- **Preferred Age**: < 4 hours during market hours
- **Real-time**: During active trading hours

## 🎯 Success Criteria

### Data Quality Metrics
- **Completeness**: 100% of required ETFs have data
- **Accuracy**: Data matches official ETF prices within 0.1%
- **Consistency**: All ETFs have same date range
- **Freshness**: Data updated within 4 hours

### Performance Metrics
- **Load Time**: < 2 seconds to load all competitor data
- **Update Success Rate**: > 99%
- **Error Rate**: < 1%

## 🚨 Error Handling

### Common Issues
1. **API Rate Limits**: Implement exponential backoff
2. **Missing Data**: Use fallback data sources
3. **Data Format Changes**: Validate before processing
4. **Network Issues**: Retry with different endpoints

### Fallback Strategy
```python
def get_etf_data_with_fallback(symbol):
    """Try multiple data sources for reliability"""
    sources = [
        lambda: yf.Ticker(symbol).history(start=start_date, end=end_date),
        lambda: alpha_vantage.get_daily(symbol),
        lambda: iex_cloud.get_historical_prices(symbol)
    ]
    
    for source in sources:
        try:
            data = source()
            if not data.empty:
                return data
        except Exception as e:
            print(f"Source failed: {e}")
            continue
    
    raise Exception(f"All sources failed for {symbol}")
```

## 📈 Integration with BrightFlow

### Update Process
1. **Collect competitor data** using the methods above
2. **Validate data quality** using validation functions
3. **Merge with BrightFlow data** in the required format
4. **Update performance.json** via GitHub API
5. **Trigger website refresh** to show new data

### Testing
1. **Test with sample data** first
2. **Verify all ETFs load** in the competitor selection modal
3. **Check chart updates** when selecting different competitors
4. **Validate performance calculations** are accurate

## 🎉 Expected Results

Once implemented, users will be able to:
- **Select any combination** of 28+ competitor ETFs
- **Compare BrightFlow performance** against any market segment
- **View historical data** for all selected competitors
- **Switch between competitors** dynamically
- **See real-time updates** as data refreshes

This will provide comprehensive performance comparison capabilities and help users understand how BrightFlow performs against various investment strategies and market segments.

## 🔗 Next Steps

1. **Choose data source** (Yahoo Finance recommended for free tier)
2. **Implement data collection** using the Python example
3. **Set up automated updates** on your preferred schedule
4. **Test with sample data** to ensure format compatibility
5. **Deploy to production** and monitor data quality

The competitor selection feature is already built into the website - you just need to provide the data! 🚀
