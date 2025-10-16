#!/usr/bin/env python3
"""
Comprehensive Competitor Data Collector
Collects historical performance data for 28+ competitor ETFs
"""

import yfinance as yf
import requests
import json
import pandas as pd
from datetime import datetime, timedelta
import time
import os
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CompetitorDataCollector:
    def __init__(self, start_date: str = "2024-09-25"):
        self.start_date = start_date
        self.competitors = {
            # U.S. Market ETFs (16)
            'spy': {'name': 'SPDR S&P 500 ETF', 'ticker': 'SPY', 'category': 'us_large_cap'},
            'voo': {'name': 'Vanguard S&P 500 ETF', 'ticker': 'VOO', 'category': 'us_large_cap'},
            'ivv': {'name': 'iShares Core S&P 500 ETF', 'ticker': 'IVV', 'category': 'us_large_cap'},
            'vti': {'name': 'Vanguard Total Stock Market ETF', 'ticker': 'VTI', 'category': 'us_total_market'},
            'itot': {'name': 'iShares Core S&P Total U.S. Stock Market ETF', 'ticker': 'ITOT', 'category': 'us_total_market'},
            'schb': {'name': 'Schwab U.S. Broad Market ETF', 'ticker': 'SCHB', 'category': 'us_total_market'},
            'iwm': {'name': 'iShares Russell 2000 ETF', 'ticker': 'IWM', 'category': 'us_small_cap'},
            'ijh': {'name': 'iShares Core S&P Mid-Cap ETF', 'ticker': 'IJH', 'category': 'us_mid_cap'},
            'vb': {'name': 'Vanguard Small-Cap ETF', 'ticker': 'VB', 'category': 'us_small_cap'},
            'vbr': {'name': 'Vanguard Small-Cap Value ETF', 'ticker': 'VBR', 'category': 'us_small_cap_value'},
            'vtv': {'name': 'Vanguard Value ETF', 'ticker': 'VTV', 'category': 'us_large_cap_value'},
            'vug': {'name': 'Vanguard Growth ETF', 'ticker': 'VUG', 'category': 'us_large_cap_growth'},
            'iusg': {'name': 'iShares Core S&P U.S. Growth ETF', 'ticker': 'IUSG', 'category': 'us_large_cap_growth'},
            'iusv': {'name': 'iShares Core S&P U.S. Value ETF', 'ticker': 'IUSV', 'category': 'us_large_cap_value'},
            'dia': {'name': 'SPDR Dow Jones Industrial Average ETF', 'ticker': 'DIA', 'category': 'us_large_cap'},
            'qqq': {'name': 'Invesco QQQ Trust', 'ticker': 'QQQ', 'category': 'us_tech_growth'},
            
            # International ETFs (12)
            'vxus': {'name': 'Vanguard Total International Stock ETF', 'ticker': 'VXUS', 'category': 'international_total'},
            'veu': {'name': 'Vanguard FTSE All-World ex-US ETF', 'ticker': 'VEU', 'category': 'international_total'},
            'vea': {'name': 'Vanguard FTSE Developed Markets ETF', 'ticker': 'VEA', 'category': 'international_developed'},
            'vwo': {'name': 'Vanguard FTSE Emerging Markets ETF', 'ticker': 'VWO', 'category': 'international_emerging'},
            'efa': {'name': 'iShares MSCI EAFE ETF', 'ticker': 'EFA', 'category': 'international_developed'},
            'eem': {'name': 'iShares MSCI Emerging Markets ETF', 'ticker': 'EEM', 'category': 'international_emerging'},
            'iefa': {'name': 'iShares Core MSCI EAFE ETF', 'ticker': 'IEFA', 'category': 'international_developed'},
            'iemg': {'name': 'iShares Core MSCI Emerging Markets ETF', 'ticker': 'IEMG', 'category': 'international_emerging'},
            'schf': {'name': 'Schwab International Equity ETF', 'ticker': 'SCHF', 'category': 'international_developed'},
            'sche': {'name': 'Schwab Emerging Markets Equity ETF', 'ticker': 'SCHE', 'category': 'international_emerging'},
            'spdw': {'name': 'SPDR Portfolio World ex-US ETF', 'ticker': 'SPDW', 'category': 'international_developed'},
            'spem': {'name': 'SPDR Portfolio Emerging Markets ETF', 'ticker': 'SPEM', 'category': 'international_emerging'}
        }
        
        self.data_file = '/data/competitor_performance.json'
        self.rate_limit_delay = 1  # seconds between requests
        
    def fetch_etf_data(self, symbol: str, ticker: str) -> Optional[Dict]:
        """Fetch historical data for a single ETF"""
        try:
            logger.info(f"Fetching data for {symbol} ({ticker})")
            
            # Create yfinance ticker object
            yf_ticker = yf.Ticker(ticker)
            
            # Get historical data from start date to now
            hist = yf_ticker.history(start=self.start_date, end=None)
            
            if hist.empty:
                logger.warning(f"No data found for {symbol} ({ticker})")
                return None
            
            # Get current info
            info = yf_ticker.info
            
            # Calculate normalized performance (starting at 1.0)
            start_price = hist['Close'].iloc[0]
            normalized_data = []
            
            for date, row in hist.iterrows():
                normalized_value = row['Close'] / start_price
                normalized_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': round(normalized_value, 6),
                    'price': round(row['Close'], 2),
                    'volume': int(row['Volume']) if not pd.isna(row['Volume']) else 0
                })
            
            # Calculate performance metrics
            current_price = hist['Close'].iloc[-1]
            total_return = ((current_price / start_price) - 1) * 100
            
            # Calculate daily returns
            daily_returns = hist['Close'].pct_change().dropna()
            volatility = daily_returns.std() * (252 ** 0.5) * 100  # Annualized volatility
            
            # Calculate Sharpe ratio (assuming 2% risk-free rate)
            risk_free_rate = 0.02
            excess_returns = daily_returns - (risk_free_rate / 252)
            sharpe_ratio = (excess_returns.mean() * 252) / (daily_returns.std() * (252 ** 0.5)) if daily_returns.std() > 0 else 0
            
            return {
                'symbol': symbol,
                'ticker': ticker,
                'name': info.get('longName', ''),
                'category': self.competitors[symbol]['category'],
                'currentPrice': round(current_price, 2),
                'totalReturn': round(total_return, 2),
                'volatility': round(volatility, 2),
                'sharpeRatio': round(sharpe_ratio, 3),
                'marketCap': info.get('marketCap', 0),
                'expenseRatio': info.get('expenseRatio', 0),
                'lastUpdated': datetime.now().isoformat(),
                'dataPoints': len(normalized_data),
                'performance': normalized_data
            }
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol} ({ticker}): {str(e)}")
            return None
    
    def collect_all_competitor_data(self) -> Dict:
        """Collect data for all competitor ETFs"""
        logger.info("Starting comprehensive competitor data collection...")
        
        all_data = {
            'metadata': {
                'startDate': self.start_date,
                'lastUpdated': datetime.now().isoformat(),
                'totalETFs': len(self.competitors),
                'dataSource': 'Yahoo Finance',
                'version': '1.0'
            },
            'performance': {},
            'summary': {
                'successful': 0,
                'failed': 0,
                'errors': []
            }
        }
        
        # Collect data for each competitor
        for symbol, info in self.competitors.items():
            try:
                data = self.fetch_etf_data(symbol, info['ticker'])
                
                if data:
                    all_data['performance'][symbol] = data
                    all_data['summary']['successful'] += 1
                    logger.info(f"✅ Successfully collected data for {symbol}")
                else:
                    all_data['summary']['failed'] += 1
                    all_data['summary']['errors'].append(f"Failed to fetch data for {symbol}")
                    logger.warning(f"❌ Failed to collect data for {symbol}")
                
                # Rate limiting
                time.sleep(self.rate_limit_delay)
                
            except Exception as e:
                all_data['summary']['failed'] += 1
                all_data['summary']['errors'].append(f"Error collecting {symbol}: {str(e)}")
                logger.error(f"❌ Error collecting {symbol}: {str(e)}")
        
        # Calculate summary statistics
        if all_data['performance']:
            returns = [data['totalReturn'] for data in all_data['performance'].values()]
            all_data['summary']['averageReturn'] = round(sum(returns) / len(returns), 2)
            all_data['summary']['bestPerformer'] = max(all_data['performance'].items(), key=lambda x: x[1]['totalReturn'])
            all_data['summary']['worstPerformer'] = min(all_data['performance'].items(), key=lambda x: x[1]['totalReturn'])
        
        logger.info(f"Data collection complete: {all_data['summary']['successful']} successful, {all_data['summary']['failed']} failed")
        
        return all_data
    
    def save_data(self, data: Dict) -> bool:
        """Save competitor data to file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f"Data saved to {self.data_file}")
            return True
        except Exception as e:
            logger.error(f"Error saving data: {str(e)}")
            return False
    
    def load_existing_data(self) -> Optional[Dict]:
        """Load existing competitor data"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                logger.info(f"Loaded existing data from {self.data_file}")
                return data
        except Exception as e:
            logger.error(f"Error loading existing data: {str(e)}")
        return None
    
    def update_existing_data(self, new_data: Dict) -> Dict:
        """Update existing data with new information"""
        existing_data = self.load_existing_data()
        
        if not existing_data:
            return new_data
        
        # Merge new data with existing data
        for symbol, data in new_data['performance'].items():
            if symbol in existing_data['performance']:
                # Update existing data
                existing_data['performance'][symbol].update(data)
            else:
                # Add new data
                existing_data['performance'][symbol] = data
        
        # Update metadata
        existing_data['metadata']['lastUpdated'] = new_data['metadata']['lastUpdated']
        existing_data['metadata']['totalETFs'] = len(existing_data['performance'])
        
        # Update summary
        existing_data['summary'] = new_data['summary']
        
        return existing_data
    
    def generate_performance_comparison(self, data: Dict) -> Dict:
        """Generate performance comparison data for website integration"""
        if not data['performance']:
            return {}
        
        # Create normalized performance data for website
        comparison_data = {
            'lastUpdated': data['metadata']['lastUpdated'],
            'startDate': data['metadata']['startDate'],
            'totalETFs': len(data['performance']),
            'performance': {}
        }
        
        # Extract performance arrays for each ETF
        for symbol, etf_data in data['performance'].items():
            comparison_data['performance'][symbol] = etf_data['performance']
        
        return comparison_data
    
    def run_full_collection(self) -> Dict:
        """Run complete competitor data collection"""
        logger.info("🚀 Starting comprehensive competitor data collection...")
        logger.info(f"📅 Start date: {self.start_date}")
        logger.info(f"📊 Total ETFs: {len(self.competitors)}")
        
        # Collect all data
        new_data = self.collect_all_competitor_data()
        
        # Update with existing data
        updated_data = self.update_existing_data(new_data)
        
        # Save data
        if self.save_data(updated_data):
            logger.info("✅ Data collection and saving completed successfully")
        else:
            logger.error("❌ Failed to save data")
        
        # Generate performance comparison
        comparison_data = self.generate_performance_comparison(updated_data)
        
        # Save comparison data for website
        comparison_file = '/data/competitor_performance_comparison.json'
        try:
            with open(comparison_file, 'w') as f:
                json.dump(comparison_data, f, indent=2)
            logger.info(f"✅ Performance comparison data saved to {comparison_file}")
        except Exception as e:
            logger.error(f"❌ Failed to save comparison data: {str(e)}")
        
        return updated_data

def main():
    """Main function"""
    collector = CompetitorDataCollector()
    data = collector.run_full_collection()
    
    if data:
        print("\n📊 Collection Summary:")
        print(f"   Total ETFs: {data['metadata']['totalETFs']}")
        print(f"   Successful: {data['summary']['successful']}")
        print(f"   Failed: {data['summary']['failed']}")
        if data['summary'].get('averageReturn'):
            print(f"   Average Return: {data['summary']['averageReturn']}%")
        if data['summary'].get('bestPerformer'):
            best = data['summary']['bestPerformer']
            print(f"   Best Performer: {best[0]} ({best[1]['totalReturn']}%)")
        if data['summary'].get('worstPerformer'):
            worst = data['summary']['worstPerformer']
            print(f"   Worst Performer: {worst[0]} ({worst[1]['totalReturn']}%)")
        
        print("\n🎯 Data ready for BrightFlow website integration!")

if __name__ == "__main__":
    main()
