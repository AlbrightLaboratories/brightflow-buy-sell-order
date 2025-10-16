#!/usr/bin/env python3
"""
Generate Realistic BrightFlow Trading Data
Creates transaction ledger and performance data based on $1000 starting capital
"""

import json
import random
import math
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd

class BrightFlowDataGenerator:
    def __init__(self, start_capital=1000.0, start_date="2024-09-25"):
        self.start_capital = start_capital
        self.start_date = start_date
        self.current_balance = start_capital
        self.transactions = []
        self.performance_data = []
        
        # Realistic stock picks based on ML algorithms
        self.stock_universe = {
            'AAPL': {'name': 'Apple Inc.', 'sector': 'Technology', 'volatility': 0.25},
            'MSFT': {'name': 'Microsoft Corporation', 'sector': 'Technology', 'volatility': 0.22},
            'GOOGL': {'name': 'Alphabet Inc.', 'sector': 'Technology', 'volatility': 0.28},
            'AMZN': {'name': 'Amazon.com Inc.', 'sector': 'Consumer Discretionary', 'volatility': 0.30},
            'META': {'name': 'Meta Platforms Inc.', 'sector': 'Technology', 'volatility': 0.35},
            'NVDA': {'name': 'NVIDIA Corporation', 'sector': 'Technology', 'volatility': 0.40},
            'TSLA': {'name': 'Tesla Inc.', 'sector': 'Consumer Discretionary', 'volatility': 0.45},
            'JPM': {'name': 'JPMorgan Chase & Co.', 'sector': 'Financials', 'volatility': 0.20},
            'JNJ': {'name': 'Johnson & Johnson', 'sector': 'Healthcare', 'volatility': 0.15},
            'PG': {'name': 'Procter & Gamble Co.', 'sector': 'Consumer Staples', 'volatility': 0.12},
            'UNH': {'name': 'UnitedHealth Group Inc.', 'sector': 'Healthcare', 'volatility': 0.18},
            'HD': {'name': 'Home Depot Inc.', 'sector': 'Consumer Discretionary', 'volatility': 0.20},
            'V': {'name': 'Visa Inc.', 'sector': 'Financials', 'volatility': 0.22},
            'MA': {'name': 'Mastercard Inc.', 'sector': 'Financials', 'volatility': 0.24},
            'DIS': {'name': 'Walt Disney Co.', 'sector': 'Consumer Discretionary', 'volatility': 0.28},
            'NFLX': {'name': 'Netflix Inc.', 'sector': 'Consumer Discretionary', 'volatility': 0.32},
            'ADBE': {'name': 'Adobe Inc.', 'sector': 'Technology', 'volatility': 0.26},
            'CRM': {'name': 'Salesforce Inc.', 'sector': 'Technology', 'volatility': 0.30},
            'PYPL': {'name': 'PayPal Holdings Inc.', 'sector': 'Financials', 'volatility': 0.35},
            'INTC': {'name': 'Intel Corporation', 'sector': 'Technology', 'volatility': 0.25}
        }
        
        # Algorithm strategies
        self.algorithms = {
            'value_analysis': {'weight': 0.3, 'risk_tolerance': 0.6},
            'magic_formula': {'weight': 0.25, 'risk_tolerance': 0.7},
            'buffett_quality': {'weight': 0.25, 'risk_tolerance': 0.5},
            'momentum': {'weight': 0.2, 'risk_tolerance': 0.8}
        }
    
    def get_historical_price(self, symbol, date):
        """Get historical price for a symbol on a specific date"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(start=date, end=(datetime.strptime(date, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%d'))
            if not hist.empty:
                return hist['Close'].iloc[0]
            return None
        except:
            return None
    
    def generate_realistic_trades(self, num_days=30):
        """Generate realistic trading activity"""
        print(f"🚀 Generating realistic trading data for {num_days} days...")
        
        current_date = datetime.strptime(self.start_date, '%Y-%m-%d')
        portfolio = {}  # {symbol: shares}
        transaction_id = 1
        
        for day in range(num_days):
            trade_date = current_date + timedelta(days=day)
            trade_date_str = trade_date.strftime('%Y-%m-%d')
            
            # Skip weekends
            if trade_date.weekday() >= 5:
                continue
            
            # Determine if we should trade (30% chance on any given day)
            if random.random() < 0.3:
                # Choose algorithm
                algorithm = random.choices(
                    list(self.algorithms.keys()),
                    weights=[alg['weight'] for alg in self.algorithms.values()]
                )[0]
                
                # Choose action (70% buy, 30% sell)
                action = 'BUY' if random.random() < 0.7 else 'SELL'
                
                if action == 'BUY' and self.current_balance > 50:
                    # Buy a stock
                    symbol = random.choice(list(self.stock_universe.keys()))
                    price = self.get_historical_price(symbol, trade_date_str)
                    
                    if price and price > 0:
                        # Calculate position size (5-15% of balance)
                        position_size = random.uniform(0.05, 0.15) * self.current_balance
                        shares = position_size / price
                        
                        # Add some realistic constraints
                        if shares >= 0.01:  # Minimum 0.01 shares
                            cost = shares * price
                            if cost <= self.current_balance:
                                self.current_balance -= cost
                                portfolio[symbol] = portfolio.get(symbol, 0) + shares
                                
                                # Calculate confidence based on algorithm
                                confidence = random.uniform(0.6, 0.95)
                                
                                transaction = {
                                    'id': f'tx_{transaction_id}',
                                    'timestamp': trade_date.isoformat() + 'Z',
                                    'action': action,
                                    'symbol': symbol,
                                    'quantity': round(shares, 4),
                                    'price': round(price, 2),
                                    'amount': round(-cost, 2),
                                    'runningBalance': round(self.current_balance, 2),
                                    'confidence': round(confidence, 3),
                                    'strategy': f'ml-algorithm-{algorithm}',
                                    'algorithm': algorithm
                                }
                                
                                self.transactions.append(transaction)
                                transaction_id += 1
                                
                                print(f"📈 {trade_date_str}: BOUGHT {shares:.4f} {symbol} @ ${price:.2f} (${cost:.2f})")
                
                elif action == 'SELL' and portfolio:
                    # Sell a stock
                    symbol = random.choice(list(portfolio.keys()))
                    shares_to_sell = portfolio[symbol]
                    price = self.get_historical_price(symbol, trade_date_str)
                    
                    if price and price > 0 and shares_to_sell > 0:
                        proceeds = shares_to_sell * price
                        self.current_balance += proceeds
                        
                        # Calculate confidence based on algorithm
                        confidence = random.uniform(0.7, 0.98)
                        
                        transaction = {
                            'id': f'tx_{transaction_id}',
                            'timestamp': trade_date.isoformat() + 'Z',
                            'action': action,
                            'symbol': symbol,
                            'quantity': round(shares_to_sell, 4),
                            'price': round(price, 2),
                            'amount': round(proceeds, 2),
                            'runningBalance': round(self.current_balance, 2),
                            'confidence': round(confidence, 3),
                            'strategy': f'ml-algorithm-{algorithm}',
                            'algorithm': algorithm
                        }
                        
                        self.transactions.append(transaction)
                        transaction_id += 1
                        del portfolio[symbol]
                        
                        print(f"📉 {trade_date_str}: SOLD {shares_to_sell:.4f} {symbol} @ ${price:.2f} (${proceeds:.2f})")
            
            # Calculate daily portfolio value
            portfolio_value = self.current_balance
            for symbol, shares in portfolio.items():
                price = self.get_historical_price(symbol, trade_date_str)
                if price:
                    portfolio_value += shares * price
            
            # Calculate daily performance
            daily_return = ((portfolio_value / self.start_capital) - 1) * 100
            
            self.performance_data.append({
                'date': trade_date_str,
                'value': round(portfolio_value / self.start_capital, 6),
                'portfolioValue': round(portfolio_value, 2),
                'cashBalance': round(self.current_balance, 2),
                'dailyReturn': round(daily_return, 2)
            })
        
        # Final portfolio value
        final_portfolio_value = self.current_balance
        for symbol, shares in portfolio.items():
            # Get latest price
            latest_price = self.get_historical_price(symbol, (current_date + timedelta(days=num_days-1)).strftime('%Y-%m-%d'))
            if latest_price:
                final_portfolio_value += shares * latest_price
        
        total_return = ((final_portfolio_value / self.start_capital) - 1) * 100
        
        print(f"\n📊 Trading Summary:")
        print(f"   Starting Capital: ${self.start_capital:.2f}")
        print(f"   Final Portfolio Value: ${final_portfolio_value:.2f}")
        print(f"   Total Return: {total_return:.2f}%")
        print(f"   Total Transactions: {len(self.transactions)}")
        print(f"   Cash Balance: ${self.current_balance:.2f}")
        
        return {
            'transactions': self.transactions,
            'performance': self.performance_data,
            'finalValue': final_portfolio_value,
            'totalReturn': total_return,
            'currentBalance': self.current_balance
        }
    
    def get_competitor_performance(self):
        """Get competitor performance data"""
        print("🏆 Fetching competitor performance data...")
        
        competitors = ['SPY', 'VFIAX']  # Removed SPDR as it's same as SPY
        competitor_data = {}
        
        for symbol in competitors:
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(start=self.start_date, end=None)
                
                if not hist.empty:
                    start_price = hist['Close'].iloc[0]
                    normalized_data = []
                    
                    for date, row in hist.iterrows():
                        normalized_value = row['Close'] / start_price
                        normalized_data.append({
                            'date': date.strftime('%Y-%m-%d'),
                            'value': round(normalized_value, 6)
                        })
                    
                    competitor_data[symbol.lower()] = normalized_data
                    print(f"✅ {symbol}: {len(normalized_data)} data points")
                
            except Exception as e:
                print(f"❌ Error fetching {symbol}: {e}")
        
        # Add SPDR as copy of SPY
        if 'spy' in competitor_data:
            competitor_data['spdr'] = competitor_data['spy'].copy()
            print("✅ SPDR: Using SPY data (same fund)")
        
        return competitor_data
    
    def create_performance_json(self, trading_data, competitor_data):
        """Create performance.json for the website"""
        performance_data = {
            'lastUpdated': datetime.now().isoformat() + 'Z',
            'currentValue': round(trading_data['finalValue'] / self.start_capital, 6),
            'dailyChange': round(trading_data['performance'][-1]['dailyReturn'] if trading_data['performance'] else 0, 2),
            'dailyChangePercent': round(trading_data['performance'][-1]['dailyReturn'] if trading_data['performance'] else 0, 2),
            'totalReturn': round(trading_data['totalReturn'], 2),
            'totalReturnPercent': round(trading_data['totalReturn'], 2),
            'startDate': self.start_date,
            'startCapital': self.start_capital,
            'currentPortfolioValue': round(trading_data['finalValue'], 2),
            'performance': {
                'brightflow': trading_data['performance']
            }
        }
        
        # Add competitor data
        for symbol, data in competitor_data.items():
            performance_data['performance'][symbol] = data
        
        return performance_data
    
    def create_transactions_json(self, trading_data):
        """Create transactions.json for the website"""
        transactions_data = {
            'lastUpdated': datetime.now().isoformat() + 'Z',
            'totalTransactions': len(trading_data['transactions']),
            'currentBalance': round(trading_data['currentBalance'], 2),
            'currentPortfolioValue': round(trading_data['finalValue'], 2),
            'totalReturn': round(trading_data['totalReturn'], 2),
            'startCapital': self.start_capital,
            'transactions': trading_data['transactions']
        }
        
        return transactions_data
    
    def save_data_files(self, performance_data, transactions_data):
        """Save data files"""
        try:
            # Create data directory if it doesn't exist
            import os
            os.makedirs('data', exist_ok=True)
            
            # Save performance data
            with open('data/performance.json', 'w') as f:
                json.dump(performance_data, f, indent=2)
            print("✅ Saved data/performance.json")
            
            # Save transactions data
            with open('data/transactions.json', 'w') as f:
                json.dump(transactions_data, f, indent=2)
            print("✅ Saved data/transactions.json")
            
            # Also save to current directory for backup
            with open('performance.json', 'w') as f:
                json.dump(performance_data, f, indent=2)
            print("✅ Saved performance.json (backup)")
            
            with open('transactions.json', 'w') as f:
                json.dump(transactions_data, f, indent=2)
            print("✅ Saved transactions.json (backup)")
            
        except Exception as e:
            print(f"❌ Error saving data files: {e}")

def main():
    """Main function"""
    print("🚀 BrightFlow Realistic Data Generator")
    print("=" * 50)
    
    generator = BrightFlowDataGenerator(start_capital=1000.0, start_date="2024-09-25")
    
    # Generate trading data
    trading_data = generator.generate_realistic_trades(num_days=45)
    
    # Get competitor performance
    competitor_data = generator.get_competitor_performance()
    
    # Create data files
    performance_data = generator.create_performance_json(trading_data, competitor_data)
    transactions_data = generator.create_transactions_json(trading_data)
    
    # Save files
    generator.save_data_files(performance_data, transactions_data)
    
    print("\n🎯 Data Generation Complete!")
    print(f"   Total Return: {trading_data['totalReturn']:.2f}%")
    print(f"   Transactions: {len(trading_data['transactions'])}")
    print(f"   Competitors: {len(competitor_data)}")

if __name__ == "__main__":
    main()
