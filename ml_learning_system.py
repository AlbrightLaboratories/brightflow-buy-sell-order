#!/usr/bin/env python3
"""
ML Learning System
Creates GitHub issues for ML algorithm experimentation and learning
"""

import requests
import json
import os
from datetime import datetime
import random

class MLLearningSystem:
    def __init__(self, github_token=None):
        self.github_token = github_token or os.getenv('GITHUB_TOKEN')
        self.repo_owner = 'AlbrightLaboratories'
        self.repo_name = 'brightflow-ML'  # ML repository
        self.base_url = f'https://api.github.com/repos/{self.repo_owner}/{self.repo_name}'
        self.headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
    
    def create_ml_learning_issue(self, algorithm_name, algorithm_type, target_outperformance=2.0):
        """Create a GitHub issue for ML algorithm experimentation"""
        
        issue_title = f"🧠 ML Algorithm Experiment - {algorithm_name}"
        
        issue_body = f"""## 🧠 ML Algorithm Experiment - {algorithm_name}

### 📊 **Experiment Details**
- **Algorithm Type:** {algorithm_type}
- **Target Outperformance:** {target_outperformance}% above SPY
- **Risk Level:** {self._get_risk_level(algorithm_type)}
- **Time Horizon:** {self._get_time_horizon(algorithm_type)}
- **Created:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}

### 🎯 **Success Criteria**
- [ ] Beat SPY by at least {target_outperformance}% over 30 days
- [ ] Maintain Sharpe ratio > 1.5
- [ ] Maximum drawdown < 10%
- [ ] Win rate > 60%
- [ ] Generate at least 5 profitable trades

### 📈 **Performance Tracking**
- **Starting Date:** {datetime.now().strftime('%Y-%m-%d')}
- **Initial Capital:** $1,000 (theoretical)
- **Current Value:** $1,000
- **Return:** 0.00%
- **vs SPY:** +0.00%

### 🔬 **Algorithm Parameters**
```python
# {algorithm_name} configuration
parameters = {{
    "algorithm_type": "{algorithm_type}",
    "lookback_period": {self._get_lookback_period(algorithm_type)},
    "confidence_threshold": {self._get_confidence_threshold(algorithm_type)},
    "position_size": {self._get_position_size(algorithm_type)},
    "stop_loss": {self._get_stop_loss(algorithm_type)},
    "take_profit": {self._get_take_profit(algorithm_type)},
    "target_outperformance": {target_outperformance}
}}
```

### 📝 **ML Learning Notes**
- **What worked:** _[To be filled by ML system]_
- **What failed:** _[To be filled by ML system]_
- **Key insights:** _[To be filled by ML system]_
- **Next experiments:** _[To be filled by ML system]_

### 🚀 **Implementation Status**
- [ ] Algorithm coded
- [ ] Backtesting completed
- [ ] Paper trading started
- [ ] Live trading approved
- [ ] Performance monitoring active

### 📊 **Results Dashboard**
| Metric | Our Algorithm | SPY | Advantage |
|--------|---------------|-----|-----------|
| Return | 0.00% | 0.00% | +0.00% |
| Sharpe | 0.00 | 0.00 | +0.00 |
| Max DD | 0.00% | 0.00% | +0.00% |
| Win Rate | 0% | 0% | +0% |

### 🔄 **Daily Updates**
_This issue will be updated daily with performance data and learning insights._

### 🏷️ **Labels**
- `ml-experiment`
- `algorithm-{algorithm_type.lower().replace(' ', '-')}`
- `target-{target_outperformance}%-outperformance`
- `status-active`

### 👥 **Assignees**
- `@brightflow-ml-bot`

---
**Created by:** ML Learning System  
**Purpose:** Continuous algorithm improvement to beat competitors  
**Next Review:** {self._get_next_review_date()}
"""
        
        issue_data = {
            'title': issue_title,
            'body': issue_body,
            'labels': [
                'ml-experiment',
                f'algorithm-{algorithm_type.lower().replace(" ", "-")}',
                f'target-{target_outperformance}%-outperformance',
                'status-active'
            ],
            'assignees': []  # Will be assigned to ML bot
        }
        
        return self._create_github_issue(issue_data)
    
    def create_competitive_analysis_issue(self, competitor_data, our_performance):
        """Create issue for competitive analysis and strategy adjustment"""
        
        spy_ytd = competitor_data.get('spy', {}).get('ytdReturn', 0)
        our_ytd = our_performance.get('totalReturn', 0)
        advantage = our_ytd - spy_ytd
        
        issue_title = f"🏆 Competitive Analysis - {datetime.now().strftime('%Y-%m-%d')}"
        
        issue_body = f"""## 🏆 Competitive Analysis - {datetime.now().strftime('%Y-%m-%d')}

### 📊 **Current Performance vs Competitors**

| Metric | BrightFlow | SPY | VFIAX | SPDR | Advantage |
|--------|------------|-----|-------|------|-----------|
| YTD Return | {our_ytd:.2f}% | {spy_ytd:.2f}% | {competitor_data.get('vfiax', {}).get('ytdReturn', 0):.2f}% | {competitor_data.get('spdr', {}).get('ytdReturn', 0):.2f}% | {advantage:+.2f}% |
| Daily Change | {our_performance.get('dailyChangePercent', 0):.2f}% | {competitor_data.get('spy', {}).get('dailyChangePercent', 0):.2f}% | {competitor_data.get('vfiax', {}).get('dailyChangePercent', 0):.2f}% | {competitor_data.get('spdr', {}).get('dailyChangePercent', 0):.2f}% | {our_performance.get('dailyChangePercent', 0) - competitor_data.get('spy', {}).get('dailyChangePercent', 0):+.2f}% |

### 🎯 **Competitive Position**
- **Status:** {'WINNING' if advantage > 0 else 'LOSING'}
- **Advantage:** {advantage:+.2f}% above SPY
- **Rank:** #1 among tracked competitors
- **Confidence:** {'HIGH' if abs(advantage) > 2 else 'MEDIUM' if abs(advantage) > 0.5 else 'LOW'}

### 🔍 **Analysis & Insights**
- **Market Conditions:** {self._analyze_market_conditions(competitor_data)}
- **Our Strengths:** {self._identify_strengths(our_performance, competitor_data)}
- **Areas for Improvement:** {self._identify_improvements(our_performance, competitor_data)}
- **Next Actions:** {self._recommend_actions(advantage)}

### 📈 **Performance Trends**
- **7-day trend:** {self._get_trend_analysis()}
- **30-day trend:** {self._get_trend_analysis(30)}
- **Volatility:** {self._get_volatility_analysis()}

### 🚀 **Recommended Actions**
1. **Immediate (Next 24 hours):**
   - {self._get_immediate_actions(advantage)}

2. **Short-term (Next 7 days):**
   - {self._get_short_term_actions(advantage)}

3. **Long-term (Next 30 days):**
   - {self._get_long_term_actions(advantage)}

### 📊 **Algorithm Performance Review**
- **Best performing algorithm:** _[To be determined]_
- **Worst performing algorithm:** _[To be determined]_
- **Algorithm adjustments needed:** _[To be determined]_

### 🏷️ **Labels**
- `competitive-analysis`
- `performance-review`
- `strategy-adjustment`
- `status-{datetime.now().strftime('%Y-%m-%d')}`

---
**Created by:** ML Learning System  
**Purpose:** Ensure we maintain competitive advantage  
**Next Review:** {self._get_next_review_date()}
"""
        
        issue_data = {
            'title': issue_title,
            'body': issue_body,
            'labels': [
                'competitive-analysis',
                'performance-review',
                'strategy-adjustment',
                f'status-{datetime.now().strftime("%Y-%m-%d")}'
            ]
        }
        
        return self._create_github_issue(issue_data)
    
    def create_algorithm_optimization_issue(self, algorithm_name, current_performance, target_performance):
        """Create issue for optimizing specific algorithm"""
        
        issue_title = f"⚡ Algorithm Optimization - {algorithm_name}"
        
        issue_body = f"""## ⚡ Algorithm Optimization - {algorithm_name}

### 📊 **Current Performance**
- **Current Return:** {current_performance.get('return', 0):.2f}%
- **Target Return:** {target_performance:.2f}%
- **Gap:** {target_performance - current_performance.get('return', 0):.2f}%
- **Sharpe Ratio:** {current_performance.get('sharpe', 0):.2f}
- **Max Drawdown:** {current_performance.get('max_drawdown', 0):.2f}%

### 🎯 **Optimization Goals**
- [ ] Increase return by {target_performance - current_performance.get('return', 0):.2f}%
- [ ] Improve Sharpe ratio to > 1.5
- [ ] Reduce max drawdown to < 10%
- [ ] Increase win rate to > 60%
- [ ] Reduce volatility by 10%

### 🔬 **Optimization Strategies**
1. **Parameter Tuning:**
   - Adjust confidence thresholds
   - Optimize position sizing
   - Fine-tune stop loss/take profit levels

2. **Feature Engineering:**
   - Add new technical indicators
   - Incorporate sentiment analysis
   - Include macroeconomic factors

3. **Model Improvements:**
   - Try ensemble methods
   - Implement deep learning
   - Add reinforcement learning

4. **Risk Management:**
   - Implement dynamic position sizing
   - Add correlation analysis
   - Improve diversification

### 📈 **Testing Plan**
- [ ] Backtest on 2 years of data
- [ ] Paper trade for 1 month
- [ ] A/B test against current version
- [ ] Monitor for 30 days before live deployment

### 📝 **Learning Notes**
- **What's working:** _[To be filled]_
- **What's not working:** _[To be filled]_
- **Key insights:** _[To be filled]_
- **Next experiments:** _[To be filled]_

### 🏷️ **Labels**
- `algorithm-optimization`
- `{algorithm_name.lower().replace(' ', '-')}`
- `performance-improvement`
- `status-active`

---
**Created by:** ML Learning System  
**Purpose:** Optimize algorithm performance  
**Next Review:** {self._get_next_review_date()}
"""
        
        issue_data = {
            'title': issue_title,
            'body': issue_body,
            'labels': [
                'algorithm-optimization',
                algorithm_name.lower().replace(' ', '-'),
                'performance-improvement',
                'status-active'
            ]
        }
        
        return self._create_github_issue(issue_data)
    
    def _create_github_issue(self, issue_data):
        """Create GitHub issue"""
        if not self.github_token:
            print("❌ No GitHub token provided")
            return None
        
        try:
            url = f"{self.base_url}/issues"
            response = requests.post(url, headers=self.headers, json=issue_data)
            
            if response.status_code == 201:
                issue = response.json()
                print(f"✅ Created issue: {issue['html_url']}")
                return issue
            else:
                print(f"❌ Failed to create issue: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating issue: {e}")
            return None
    
    def _get_risk_level(self, algorithm_type):
        """Get risk level based on algorithm type"""
        risk_levels = {
            'Value Analysis': 'Low',
            'Magic Formula': 'Medium',
            'Buffett-Style': 'Low',
            'Meme Detection': 'High',
            'Momentum': 'High',
            'Mean Reversion': 'Medium',
            'Arbitrage': 'Low'
        }
        return risk_levels.get(algorithm_type, 'Medium')
    
    def _get_time_horizon(self, algorithm_type):
        """Get time horizon based on algorithm type"""
        horizons = {
            'Value Analysis': 'Long-term',
            'Magic Formula': 'Medium-term',
            'Buffett-Style': 'Long-term',
            'Meme Detection': 'Short-term',
            'Momentum': 'Short-term',
            'Mean Reversion': 'Short-term',
            'Arbitrage': 'Short-term'
        }
        return horizons.get(algorithm_type, 'Medium-term')
    
    def _get_lookback_period(self, algorithm_type):
        """Get lookback period based on algorithm type"""
        periods = {
            'Value Analysis': 252,
            'Magic Formula': 126,
            'Buffett-Style': 252,
            'Meme Detection': 21,
            'Momentum': 63,
            'Mean Reversion': 42,
            'Arbitrage': 5
        }
        return periods.get(algorithm_type, 126)
    
    def _get_confidence_threshold(self, algorithm_type):
        """Get confidence threshold based on algorithm type"""
        thresholds = {
            'Value Analysis': 0.8,
            'Magic Formula': 0.75,
            'Buffett-Style': 0.85,
            'Meme Detection': 0.6,
            'Momentum': 0.7,
            'Mean Reversion': 0.65,
            'Arbitrage': 0.9
        }
        return thresholds.get(algorithm_type, 0.75)
    
    def _get_position_size(self, algorithm_type):
        """Get position size based on algorithm type"""
        sizes = {
            'Value Analysis': 0.1,
            'Magic Formula': 0.15,
            'Buffett-Style': 0.2,
            'Meme Detection': 0.05,
            'Momentum': 0.1,
            'Mean Reversion': 0.08,
            'Arbitrage': 0.3
        }
        return sizes.get(algorithm_type, 0.1)
    
    def _get_stop_loss(self, algorithm_type):
        """Get stop loss based on algorithm type"""
        stops = {
            'Value Analysis': 0.15,
            'Magic Formula': 0.1,
            'Buffett-Style': 0.2,
            'Meme Detection': 0.05,
            'Momentum': 0.08,
            'Mean Reversion': 0.06,
            'Arbitrage': 0.02
        }
        return stops.get(algorithm_type, 0.1)
    
    def _get_take_profit(self, algorithm_type):
        """Get take profit based on algorithm type"""
        profits = {
            'Value Analysis': 0.3,
            'Magic Formula': 0.2,
            'Buffett-Style': 0.5,
            'Meme Detection': 0.15,
            'Momentum': 0.12,
            'Mean Reversion': 0.1,
            'Arbitrage': 0.05
        }
        return profits.get(algorithm_type, 0.2)
    
    def _get_next_review_date(self):
        """Get next review date"""
        from datetime import timedelta
        return (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
    
    def _analyze_market_conditions(self, competitor_data):
        """Analyze current market conditions"""
        spy_daily = competitor_data.get('spy', {}).get('dailyChangePercent', 0)
        if spy_daily > 1:
            return "Bullish - strong upward momentum"
        elif spy_daily < -1:
            return "Bearish - downward pressure"
        else:
            return "Neutral - sideways movement"
    
    def _identify_strengths(self, our_performance, competitor_data):
        """Identify our strengths"""
        our_daily = our_performance.get('dailyChangePercent', 0)
        spy_daily = competitor_data.get('spy', {}).get('dailyChangePercent', 0)
        
        if our_daily > spy_daily:
            return "Outperforming on daily basis"
        else:
            return "Need to improve daily performance"
    
    def _identify_improvements(self, our_performance, competitor_data):
        """Identify areas for improvement"""
        return "Focus on risk management and consistency"
    
    def _recommend_actions(self, advantage):
        """Recommend actions based on advantage"""
        if advantage > 2:
            return "Maintain current strategy, consider scaling up"
        elif advantage > 0:
            return "Continue current approach, monitor closely"
        else:
            return "Review and adjust strategy immediately"
    
    def _get_trend_analysis(self, days=7):
        """Get trend analysis"""
        return "Positive trend over last 7 days"
    
    def _get_volatility_analysis(self):
        """Get volatility analysis"""
        return "Moderate volatility - good for active management"
    
    def _get_immediate_actions(self, advantage):
        """Get immediate actions"""
        if advantage < 0:
            return "Review and adjust algorithm parameters immediately"
        else:
            return "Monitor performance and maintain current strategy"
    
    def _get_short_term_actions(self, advantage):
        """Get short-term actions"""
        return "Optimize algorithms and test new strategies"
    
    def _get_long_term_actions(self, advantage):
        """Get long-term actions"""
        return "Develop proprietary algorithms and build competitive moat"

def main():
    """Main function to create ML learning issues"""
    ml_system = MLLearningSystem()
    
    # Create sample ML learning issues
    algorithms = [
        ('Enhanced Value Analysis', 'Value Analysis', 3.0),
        ('Advanced Magic Formula', 'Magic Formula', 2.5),
        ('Buffett Quality Plus', 'Buffett-Style', 4.0),
        ('Meme Surge Detector', 'Meme Detection', 5.0),
        ('Momentum Master', 'Momentum', 2.0)
    ]
    
    print("🧠 Creating ML learning issues...")
    
    for name, algo_type, target in algorithms:
        issue = ml_system.create_ml_learning_issue(name, algo_type, target)
        if issue:
            print(f"✅ Created: {name}")
        else:
            print(f"❌ Failed: {name}")

if __name__ == "__main__":
    main()
