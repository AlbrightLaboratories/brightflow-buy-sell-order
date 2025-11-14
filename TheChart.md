# BrightFlow ML Trading Analysis - REAL IBKR Paper Trading

**Last Updated:** 2025-11-14 00:57:57 EST

## Performance Summary (IBKR Paper Account DUM665729)

- **Total Portfolio Value:** $2,150.00
- **Cash Balance:** $2,115.79
- **Position Value:** $34.21
- **Initial Balance:** $488.00
- **Total Return:** +340.57%
- **Total Trades:** 53
- **Buy Orders:** 18
- **Sell Orders:** 35
- **Average Trade Size:** $-40.46

## Trading Strategy - Issue-Based Intelligence

BrightFlow uses **intelligent trading** based on GitHub issue analysis:
- **Data Source:** Daily ML recommendations from GitHub issues
- **Entry Logic:** Buy when price is within 5% of GTC buy target
- **Profit Target:** 2% (automatic exit when position gains 2%)
- **Stop Loss:** 1% (automatic exit when position loses 1%)
- **Position Limits:** Maximum 5 concurrent positions
- **Share Size:** 0.1 - 0.5 fractional shares per position
- **Trading Frequency:** Every 5 minutes
- **PDT Protection:** Max 3 day trades per 5 business days

## Risk Management

All trades include:
- ✅ Automated profit taking at 2% gain
- ✅ Automated stop loss at 1% loss
- ✅ PDT protection (currently using IBKR paper trading account)
- ✅ Position size limits (5% of balance per trade)
- ✅ Maximum 5 concurrent positions

## Data Sources

- **Trading Execution:** IBKR Gateway API (live market data)
- **Trade Decisions:** GitHub issue analysis (ML recommendations)
- **Risk Management:** Automated profit/stop loss triggers

---

*This data is updated every 5 minutes. All trades are executed on real IBKR paper trading account.*
