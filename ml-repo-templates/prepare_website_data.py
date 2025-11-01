#!/usr/bin/env python3
"""
Prepare Website Data Files
Combines ML predictions with benchmark data into final website format
"""

import json
import os
from datetime import datetime, timezone

def prepare_website_data():
    """
    Combine all generated data into the format expected by the website
    """
    
    print("📋 Preparing website data files...")
    
    # Load performance data
    try:
        with open("output/performance_data.json", "r") as f:
            performance_data = json.load(f)
    except FileNotFoundError:
        print("❌ Performance data not found")
        return False
    
    # Load transaction data
    try:
        with open("output/recent_transactions.json", "r") as f:
            transaction_data = json.load(f)
    except FileNotFoundError:
        print("❌ Transaction data not found") 
        return False
    
    # Prepare final website data format
    website_performance = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "startDate": performance_data.get("startDate", "2024-09-25"),
        "currentValue": performance_data.get("currentValue", 1.0),
        "dailyChange": performance_data.get("dailyChange", 0.0),
        "performance": performance_data.get("performance", {})
    }
    
    website_transactions = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "totalTransactions": transaction_data.get("total_transactions", 0),
        "currentBalance": transaction_data.get("current_balance", 0.0),
        "transactions": transaction_data.get("transactions", [])[-50:]  # Last 50 only
    }
    
    # Prepare recommendations data (extract from performance or generate placeholder)
    website_recommendations = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "recommendations": [],  # Will be populated by ML pipeline
        "positions": []  # Will be populated by ML pipeline
    }
    
    # Save final website data files with correct names for update_brightflow_website.py
    with open("output/performance_data.json", "w") as f:
        json.dump(website_performance, f, indent=2)
    
    with open("output/transaction_data.json", "w") as f:
        json.dump(website_transactions, f, indent=2)
    
    with open("output/recommendations.json", "w") as f:
        json.dump(website_recommendations, f, indent=2)
    
    print("✅ Website data files prepared")
    print(f"📊 Performance data points: {len(website_performance['performance'].get('brightflow', []))}")
    print(f"💰 Transactions: {len(website_transactions['transactions'])}")
    
    return True

def main():
    """Main function"""
    print("🚀 Starting website data preparation...")
    
    try:
        success = prepare_website_data()
        
        if success:
            print("✅ Website data preparation completed!")
        else:
            print("❌ Failed to prepare website data")
            return False
            
    except Exception as e:
        print(f"❌ Data preparation failed: {str(e)}")
        raise
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1)