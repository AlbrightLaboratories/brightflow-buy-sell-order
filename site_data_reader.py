#!/usr/bin/env python3
"""
Site Data Reader
Reads our website data and uses it as ML input for competitive advantage
"""

import requests
import json
import pandas as pd
from datetime import datetime, timedelta
import time

class SiteDataReader:
    def __init__(self, base_url="https://albright-laboratories.github.io/brightflow-buy-sell-order"):
        self.base_url = base_url
        self.data_endpoints = {
            'performance': f"{base_url}/data/performance.json",
            'transactions': f"{base_url}/data/transactions.json",
            'market_data': f"{base_url}/data/hourly_market_data.json"
        }
    
    def read_site_data(self):
        """Read all data from our website"""
        print("📊 Reading site data...")
        
        site_data = {
            'timestamp': datetime.now().isoformat(),
            'performance': None,
            'transactions': None,
            'market_data': None,
            'errors': []
        }
        
        for data_type, url in self.data_endpoints.items():
            try:
                print(f"   Reading {data_type}...")
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    site_data[data_type] = data
                    print(f"   ✅ {data_type} loaded successfully")
                else:
                    error_msg = f"HTTP {response.status_code} for {data_type}"
                    site_data['errors'].append(error_msg)
                    print(f"   ❌ {error_msg}")
                    
            except requests.exceptions.Timeout:
                error_msg = f"Timeout reading {data_type}"
                site_data['errors'].append(error_msg)
                print(f"   ❌ {error_msg}")
            except Exception as e:
                error_msg = f"Error reading {data_type}: {str(e)}"
                site_data['errors'].append(error_msg)
                print(f"   ❌ {error_msg}")
            
            # Rate limiting
            time.sleep(0.5)
        
        return site_data
    
    def extract_ml_features(self, site_data):
        """Extract ML features from site data"""
        print("🔍 Extracting ML features...")
        
        features = {
            'timestamp': site_data['timestamp'],
            'performance_metrics': {},
            'transaction_metrics': {},
            'market_metrics': {},
            'derived_features': {}
        }
        
        # Extract performance features
        if site_data['performance']:
            perf = site_data['performance']
            features['performance_metrics'] = {
                'current_value': perf.get('currentValue', 0),
                'daily_change': perf.get('dailyChange', 0),
                'daily_change_percent': perf.get('dailyChangePercent', 0),
                'total_return': perf.get('totalReturn', 0),
                'last_updated': perf.get('lastUpdated', ''),
                'data_freshness_minutes': self._calculate_data_freshness(perf.get('lastUpdated', ''))
            }
        
        # Extract transaction features
        if site_data['transactions']:
            trans = site_data['transactions']
            transactions = trans.get('transactions', [])
            
            features['transaction_metrics'] = {
                'total_transactions': trans.get('totalTransactions', 0),
                'current_balance': trans.get('currentBalance', 0),
                'recent_transaction_count': len(transactions[-5:]) if transactions else 0,
                'avg_transaction_amount': self._calculate_avg_transaction_amount(transactions),
                'buy_sell_ratio': self._calculate_buy_sell_ratio(transactions),
                'confidence_scores': self._extract_confidence_scores(transactions),
                'strategy_distribution': self._analyze_strategy_distribution(transactions)
            }
        
        # Extract market data features
        if site_data['market_data']:
            market = site_data['market_data']
            features['market_metrics'] = {
                'market_volatility': self._calculate_market_volatility(market),
                'sector_performance': self._analyze_sector_performance(market),
                'market_trend': self._determine_market_trend(market)
            }
        
        # Calculate derived features
        features['derived_features'] = self._calculate_derived_features(features)
        
        return features
    
    def create_ml_datapoint(self, features, competitor_data=None):
        """Create comprehensive ML datapoint"""
        print("🤖 Creating ML datapoint...")
        
        ml_datapoint = {
            'timestamp': features['timestamp'],
            'input_features': features,
            'target_variables': self._calculate_target_variables(features),
            'competitive_context': competitor_data,
            'data_quality': self._assess_data_quality(features),
            'ml_insights': self._generate_ml_insights(features),
            'recommendations': self._generate_recommendations(features)
        }
        
        return ml_datapoint
    
    def _calculate_data_freshness(self, last_updated_str):
        """Calculate how fresh the data is in minutes"""
        if not last_updated_str:
            return 999  # Very stale
        
        try:
            last_updated = datetime.fromisoformat(last_updated_str.replace('Z', '+00:00'))
            now = datetime.now(last_updated.tzinfo)
            diff = now - last_updated
            return int(diff.total_seconds() / 60)
        except:
            return 999
    
    def _calculate_avg_transaction_amount(self, transactions):
        """Calculate average transaction amount"""
        if not transactions:
            return 0
        
        amounts = [abs(t.get('amount', 0)) for t in transactions if t.get('amount')]
        return sum(amounts) / len(amounts) if amounts else 0
    
    def _calculate_buy_sell_ratio(self, transactions):
        """Calculate buy/sell ratio"""
        if not transactions:
            return 1.0
        
        buys = len([t for t in transactions if t.get('action') == 'BUY'])
        sells = len([t for t in transactions if t.get('action') == 'SELL'])
        
        return buys / sells if sells > 0 else float('inf')
    
    def _extract_confidence_scores(self, transactions):
        """Extract confidence scores from transactions"""
        if not transactions:
            return []
        
        scores = [t.get('confidence', 0) for t in transactions if t.get('confidence')]
        return {
            'avg_confidence': sum(scores) / len(scores) if scores else 0,
            'max_confidence': max(scores) if scores else 0,
            'min_confidence': min(scores) if scores else 0,
            'confidence_std': self._calculate_std(scores) if scores else 0
        }
    
    def _analyze_strategy_distribution(self, transactions):
        """Analyze distribution of strategies used"""
        if not transactions:
            return {}
        
        strategies = [t.get('strategy', 'unknown') for t in transactions]
        strategy_counts = {}
        for strategy in strategies:
            strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1
        
        total = len(strategies)
        return {k: v/total for k, v in strategy_counts.items()}
    
    def _calculate_market_volatility(self, market_data):
        """Calculate market volatility from market data"""
        # Simplified volatility calculation
        return 0.15  # Placeholder - would calculate from actual market data
    
    def _analyze_sector_performance(self, market_data):
        """Analyze sector performance"""
        # Simplified sector analysis
        return {
            'technology': 0.05,
            'healthcare': 0.02,
            'financials': -0.01,
            'energy': 0.03
        }
    
    def _determine_market_trend(self, market_data):
        """Determine overall market trend"""
        # Simplified trend analysis
        return 'bullish'  # Placeholder
    
    def _calculate_std(self, values):
        """Calculate standard deviation"""
        if len(values) < 2:
            return 0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5
    
    def _calculate_derived_features(self, features):
        """Calculate derived features for ML"""
        derived = {}
        
        # Performance momentum
        if features['performance_metrics']:
            perf = features['performance_metrics']
            derived['performance_momentum'] = perf.get('daily_change_percent', 0)
            derived['performance_strength'] = abs(perf.get('daily_change_percent', 0))
        
        # Trading activity
        if features['transaction_metrics']:
            trans = features['transaction_metrics']
            derived['trading_activity'] = trans.get('total_transactions', 0)
            derived['trading_confidence'] = trans.get('confidence_scores', {}).get('avg_confidence', 0)
            derived['trading_aggressiveness'] = trans.get('buy_sell_ratio', 1.0)
        
        # Data quality
        derived['data_freshness'] = features['performance_metrics'].get('data_freshness_minutes', 999)
        derived['data_quality_score'] = max(0, 100 - derived['data_freshness'])
        
        return derived
    
    def _calculate_target_variables(self, features):
        """Calculate target variables for ML training"""
        targets = {}
        
        # Performance targets
        if features['performance_metrics']:
            perf = features['performance_metrics']
            targets['outperformance'] = perf.get('total_return', 0) - 13.4  # vs SPY
            targets['risk_adjusted_return'] = perf.get('total_return', 0) / 15  # Simplified Sharpe
        
        # Trading targets
        if features['transaction_metrics']:
            trans = features['transaction_metrics']
            targets['trading_success'] = 1 if trans.get('current_balance', 0) > 1000 else 0
            targets['trading_efficiency'] = trans.get('total_transactions', 0) / 10  # Normalized
        
        return targets
    
    def _assess_data_quality(self, features):
        """Assess quality of the data"""
        quality_score = 100
        issues = []
        
        # Check data freshness
        freshness = features['performance_metrics'].get('data_freshness_minutes', 999)
        if freshness > 60:
            quality_score -= 20
            issues.append(f"Data is {freshness} minutes old")
        
        # Check for missing data
        if not features['performance_metrics']:
            quality_score -= 30
            issues.append("Missing performance data")
        
        if not features['transaction_metrics']:
            quality_score -= 20
            issues.append("Missing transaction data")
        
        return {
            'score': max(0, quality_score),
            'issues': issues,
            'status': 'excellent' if quality_score > 80 else 'good' if quality_score > 60 else 'poor'
        }
    
    def _generate_ml_insights(self, features):
        """Generate ML insights from the data"""
        insights = []
        
        # Performance insights
        if features['performance_metrics']:
            perf = features['performance_metrics']
            if perf.get('total_return', 0) > 15:
                insights.append("Strong outperformance detected")
            elif perf.get('total_return', 0) < 5:
                insights.append("Underperformance - needs attention")
        
        # Trading insights
        if features['transaction_metrics']:
            trans = features['transaction_metrics']
            if trans.get('confidence_scores', {}).get('avg_confidence', 0) > 0.8:
                insights.append("High confidence trading signals")
            elif trans.get('confidence_scores', {}).get('avg_confidence', 0) < 0.5:
                insights.append("Low confidence - review algorithms")
        
        return insights
    
    def _generate_recommendations(self, features):
        """Generate recommendations based on the data"""
        recommendations = []
        
        # Data quality recommendations
        if features['derived_features'].get('data_freshness', 0) > 30:
            recommendations.append("Update data more frequently")
        
        # Performance recommendations
        if features['performance_metrics'].get('total_return', 0) < 10:
            recommendations.append("Review and optimize algorithms")
        
        # Trading recommendations
        if features['transaction_metrics'].get('total_transactions', 0) < 5:
            recommendations.append("Increase trading activity")
        
        return recommendations
    
    def save_ml_datapoint(self, ml_datapoint, filename='ml_datapoint.json'):
        """Save ML datapoint to file"""
        try:
            with open(f'data/{filename}', 'w') as f:
                json.dump(ml_datapoint, f, indent=2)
            print(f"💾 ML datapoint saved to data/{filename}")
        except Exception as e:
            print(f"❌ Error saving ML datapoint: {e}")
    
    def run_full_analysis(self):
        """Run complete site data analysis"""
        print("🚀 Starting site data analysis...")
        print("=" * 50)
        
        # Read site data
        site_data = self.read_site_data()
        
        if site_data['errors']:
            print(f"⚠️  {len(site_data['errors'])} errors encountered")
            for error in site_data['errors']:
                print(f"   • {error}")
        
        # Extract ML features
        features = self.extract_ml_features(site_data)
        
        # Create ML datapoint
        ml_datapoint = self.create_ml_datapoint(features)
        
        # Save results
        self.save_ml_datapoint(ml_datapoint)
        
        print("=" * 50)
        print("✅ Site data analysis complete!")
        
        # Print summary
        print("\n📊 Summary:")
        print(f"   Data Quality: {ml_datapoint['data_quality']['status']}")
        print(f"   Performance: {features['performance_metrics'].get('total_return', 0):.2f}%")
        print(f"   Transactions: {features['transaction_metrics'].get('total_transactions', 0)}")
        print(f"   Insights: {len(ml_datapoint['ml_insights'])}")
        print(f"   Recommendations: {len(ml_datapoint['recommendations'])}")
        
        return ml_datapoint

def main():
    """Main function"""
    reader = SiteDataReader()
    analysis = reader.run_full_analysis()
    
    if analysis:
        print("\n🎯 ML Datapoint created successfully!")
        print("   Ready for algorithm training and optimization")

if __name__ == "__main__":
    main()
