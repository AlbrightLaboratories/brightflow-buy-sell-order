#!/usr/bin/env python3
"""
Competitor Monitoring System
Tracks SPY, VFIAX, SPDR performance to ensure we beat them
"""

import yfinance as yf
import requests
import json
import pandas as pd
from datetime import datetime, timedelta
import time

class CompetitorMonitor:
    def __init__(self):
        self.competitors = {
            'SPY': {'name': 'SPDR S&P 500 ETF', 'ticker': 'SPY'},
            'VFIAX': {'name': 'Vanguard 500 Index Fund', 'ticker': 'VFIAX'},
            'SPDR': {'name': 'SPDR S&P 500 ETF Trust', 'ticker': 'SPY'}  # Same as SPY
        }
        
    def get_competitor_data(self):
        """Fetch real-time competitor performance data"""
        print("🏆 Fetching competitor data...")
        
        competitor_data = {}
        
        for symbol, info in self.competitors.items():
            try:
                ticker = yf.Ticker(info['ticker'])
                
                # Get current info
                current_info = ticker.info
                
                # Get historical data for calculations
                hist = ticker.history(period='5d')
                
                if not hist.empty:
                    # Calculate daily change
                    current_price = hist['Close'].iloc[-1]
                    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                    daily_change = current_price - prev_close
                    daily_change_percent = (daily_change / prev_close) * 100
                    
                    # Calculate YTD return
                    ytd_return = current_info.get('ytdReturn', 0) * 100
                    
                    competitor_data[symbol.lower()] = {
                        'symbol': symbol,
                        'name': info['name'],
                        'currentPrice': round(current_price, 2),
                        'dailyChange': round(daily_change, 2),
                        'dailyChangePercent': round(daily_change_percent, 2),
                        'ytdReturn': round(ytd_return, 2),
                        'lastUpdated': datetime.now().isoformat(),
                        'volume': current_info.get('volume', 0),
                        'marketCap': current_info.get('marketCap', 0)
                    }
                    
                    print(f"✅ {symbol}: ${current_price:.2f} ({daily_change_percent:+.2f}%)")
                else:
                    print(f"❌ No data for {symbol}")
                    
            except Exception as e:
                print(f"❌ Error fetching {symbol}: {e}")
                competitor_data[symbol.lower()] = {
                    'symbol': symbol,
                    'name': info['name'],
                    'error': str(e),
                    'lastUpdated': datetime.now().isoformat()
                }
            
            # Rate limiting
            time.sleep(1)
        
        return competitor_data
    
    def get_our_performance(self):
        """Get our current performance from local data files"""
        try:
            print("📊 Fetching our performance data...")
            
            # Try to read from local data files first
            import os
            performance_file = 'data/performance.json'
            transaction_file = 'data/transactions.json'
            
            if os.path.exists(performance_file) and os.path.exists(transaction_file):
                with open(performance_file, 'r') as f:
                    performance_data = json.load(f)
                
                with open(transaction_file, 'r') as f:
                    transaction_data = json.load(f)
                
                our_performance = {
                    'currentValue': performance_data.get('currentValue', 1.0),
                    'dailyChange': performance_data.get('dailyChange', 0.0),
                    'dailyChangePercent': performance_data.get('dailyChangePercent', 0.0),
                    'totalReturn': performance_data.get('totalReturn', 0.0),
                    'totalTransactions': transaction_data.get('totalTransactions', 0),
                    'currentBalance': transaction_data.get('currentBalance', 1000.0),
                    'lastUpdated': performance_data.get('lastUpdated', datetime.now().isoformat())
                }
                
                print(f"✅ Our Performance: ${our_performance['currentValue']:.4f} ({our_performance['totalReturn']:.2f}%)")
                return our_performance
            
            # Fallback to GitHub Pages site
            print("📡 Falling back to GitHub Pages site...")
            response = requests.get('https://albright-laboratories.github.io/brightflow-buy-sell-order/data/performance.json')
            if response.status_code == 200:
                performance_data = response.json()
                
                # Read transaction data
                response = requests.get('https://albright-laboratories.github.io/brightflow-buy-sell-order/data/transactions.json')
                if response.status_code == 200:
                    transaction_data = response.json()
                    
                    our_performance = {
                        'currentValue': performance_data.get('currentValue', 1.0),
                        'dailyChange': performance_data.get('dailyChange', 0.0),
                        'dailyChangePercent': performance_data.get('dailyChangePercent', 0.0),
                        'totalReturn': performance_data.get('totalReturn', 0.0),
                        'totalTransactions': transaction_data.get('totalTransactions', 0),
                        'currentBalance': transaction_data.get('currentBalance', 1000.0),
                        'lastUpdated': performance_data.get('lastUpdated', datetime.now().isoformat())
                    }
                    
                    print(f"✅ Our Performance: ${our_performance['currentValue']:.4f} ({our_performance['totalReturn']:.2f}%)")
                    return our_performance
                else:
                    print("❌ Could not fetch transaction data")
            else:
                print("❌ Could not fetch performance data")
                
        except Exception as e:
            print(f"❌ Error fetching our performance: {e}")
        
        return None
    
    def analyze_competitive_advantage(self, our_performance, competitor_data):
        """Analyze our performance vs competitors"""
        if not our_performance or not competitor_data:
            return None
            
        print("🔍 Analyzing competitive advantage...")
        
        # Get SPY as benchmark
        spy_data = competitor_data.get('spy', {})
        if not spy_data or 'error' in spy_data:
            print("❌ No SPY data for comparison")
            return None
        
        spy_ytd = spy_data.get('ytdReturn', 0)
        our_ytd = our_performance.get('totalReturn', 0)
        
        spy_daily = spy_data.get('dailyChangePercent', 0)
        our_daily = our_performance.get('dailyChangePercent', 0)
        
        advantage = {
            'dailyAdvantage': round(our_daily - spy_daily, 2),
            'ytdAdvantage': round(our_ytd - spy_ytd, 2),
            'outperformance': round(((our_ytd / spy_ytd) - 1) * 100, 2) if spy_ytd > 0 else 0,
            'riskAdjustedReturn': 1.5,  # Placeholder - would calculate Sharpe ratio
            'competitivePosition': 'WINNING' if our_ytd > spy_ytd else 'LOSING',
            'lastUpdated': datetime.now().isoformat()
        }
        
        print(f"🎯 Daily Advantage: {advantage['dailyAdvantage']:+.2f}%")
        print(f"🎯 YTD Advantage: {advantage['ytdAdvantage']:+.2f}%")
        print(f"🎯 Outperformance: {advantage['outperformance']:+.2f}%")
        print(f"🏆 Status: {advantage['competitivePosition']}")
        
        return advantage
    
    def detect_market_opportunities(self):
        """Detect market opportunities to exploit"""
        print("🔍 Detecting market opportunities...")
        
        opportunities = []
        
        try:
            # Check VIX for volatility
            vix = yf.Ticker('^VIX')
            vix_data = vix.history(period='1d')
            if not vix_data.empty:
                vix_value = vix_data['Close'].iloc[-1]
                if vix_value > 20:
                    opportunities.append(f"High volatility (VIX: {vix_value:.1f}) - active management advantage")
                elif vix_value < 15:
                    opportunities.append(f"Low volatility (VIX: {vix_value:.1f}) - stable market conditions")
            
            # Check sector performance
            sectors = {
                'XLK': 'Technology',
                'XLE': 'Energy', 
                'XLV': 'Healthcare',
                'XLF': 'Financials',
                'XLI': 'Industrials'
            }
            
            sector_performance = {}
            for sector, name in sectors.items():
                try:
                    ticker = yf.Ticker(sector)
                    hist = ticker.history(period='5d')
                    if not hist.empty:
                        current = hist['Close'].iloc[-1]
                        prev = hist['Close'].iloc[-2] if len(hist) > 1 else current
                        change = ((current / prev) - 1) * 100
                        sector_performance[sector] = change
                except:
                    continue
            
            if sector_performance:
                avg_sector_return = sum(sector_performance.values()) / len(sector_performance)
                
                for sector, change in sector_performance.items():
                    if change < avg_sector_return * 0.8:
                        opportunities.append(f"{sectors[sector]} ({sector}) undervalued - potential opportunity")
                    elif change > avg_sector_return * 1.2:
                        opportunities.append(f"{sectors[sector]} ({sector}) overvalued - potential short opportunity")
            
        except Exception as e:
            print(f"❌ Error detecting opportunities: {e}")
        
        if opportunities:
            print("💡 Market Opportunities:")
            for opp in opportunities:
                print(f"   • {opp}")
        else:
            print("ℹ️  No significant market opportunities detected")
        
        return opportunities
    
    def create_ml_datapoint(self, our_performance, competitor_data, advantage, opportunities):
        """Create ML datapoint from all collected data"""
        ml_datapoint = {
            'timestamp': datetime.now().isoformat(),
            'our_performance': our_performance,
            'competitor_data': competitor_data,
            'competitive_advantage': advantage,
            'market_opportunities': opportunities,
            'data_source': 'competitor_monitor.py',
            'version': '1.0'
        }
        
        return ml_datapoint
    
    def save_data(self, data, filename='competitor_analysis.json'):
        """Save analysis data to file"""
        try:
            with open(f'data/{filename}', 'w') as f:
                json.dump(data, f, indent=2)
            print(f"💾 Data saved to data/{filename}")
        except Exception as e:
            print(f"❌ Error saving data: {e}")
    
    def run_full_analysis(self):
        """Run complete competitive analysis"""
        print("🚀 Starting competitive analysis...")
        print("=" * 50)
        
        # Collect all data
        competitor_data = self.get_competitor_data()
        our_performance = self.get_our_performance()
        
        if not our_performance:
            print("❌ Cannot proceed without our performance data")
            return None
        
        # Analyze competitive advantage
        advantage = self.analyze_competitive_advantage(our_performance, competitor_data)
        
        # Detect opportunities
        opportunities = self.detect_market_opportunities()
        
        # Create ML datapoint
        ml_datapoint = self.create_ml_datapoint(
            our_performance, 
            competitor_data, 
            advantage, 
            opportunities
        )
        
        # Save data
        self.save_data(ml_datapoint)
        
        print("=" * 50)
        print("✅ Competitive analysis complete!")
        
        return ml_datapoint

def main():
    """Main function"""
    monitor = CompetitorMonitor()
    analysis = monitor.run_full_analysis()
    
    if analysis:
        print("\n📊 Summary:")
        print(f"   Our YTD Return: {analysis['our_performance']['totalReturn']:.2f}%")
        if analysis['competitive_advantage']:
            print(f"   vs SPY Advantage: {analysis['competitive_advantage']['ytdAdvantage']:+.2f}%")
            print(f"   Status: {analysis['competitive_advantage']['competitivePosition']}")
        print(f"   Opportunities: {len(analysis['market_opportunities'])}")

if __name__ == "__main__":
    main()
