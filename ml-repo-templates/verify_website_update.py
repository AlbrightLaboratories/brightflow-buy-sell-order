#!/usr/bin/env python3
"""
Verify Website Update Success
Checks that the website data was updated correctly
"""

import requests
import json
import time
from datetime import datetime, timezone

def verify_website_update():
    """
    Verify that the website was updated successfully
    """
    
    print("🔍 Verifying website update...")
    
    base_url = "https://raw.githubusercontent.com/AlbrightLaboratories/brightflow-buy-sell-order/main/data"
    
    success = True
    
    # Check performance data
    try:
        response = requests.get(f"{base_url}/performance.json", timeout=30)
        if response.status_code == 200:
            data = response.json()
            last_updated = data.get("lastUpdated")
            current_value = data.get("currentValue")
            
            print(f"✅ Performance data updated: {last_updated}")
            print(f"📊 Current BrightFlow value: ${current_value:.4f}")
            
            # Check if update is recent (within last hour)
            if last_updated:
                update_time = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
                time_diff = datetime.now(timezone.utc) - update_time
                
                if time_diff.total_seconds() > 3600:  # More than 1 hour old
                    print(f"⚠️  Performance data is {time_diff} old")
                else:
                    print("✅ Performance data is recent")
        else:
            print(f"❌ Failed to fetch performance data: {response.status_code}")
            success = False
            
    except Exception as e:
        print(f"❌ Error checking performance data: {str(e)}")
        success = False
    
    # Give a moment for GitHub to update
    time.sleep(2)
    
    # Check transaction data
    try:
        response = requests.get(f"{base_url}/transactions.json", timeout=30)
        if response.status_code == 200:
            data = response.json()
            last_updated = data.get("lastUpdated")
            total_transactions = data.get("totalTransactions", 0)
            current_balance = data.get("currentBalance", 0)
            
            print(f"✅ Transaction data updated: {last_updated}")
            print(f"💰 Current balance: ${current_balance:.2f}")
            print(f"📝 Total transactions: {total_transactions}")
            
            # Check if update is recent
            if last_updated:
                update_time = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
                time_diff = datetime.now(timezone.utc) - update_time
                
                if time_diff.total_seconds() > 3600:  # More than 1 hour old
                    print(f"⚠️  Transaction data is {time_diff} old")
                else:
                    print("✅ Transaction data is recent")
        else:
            print(f"❌ Failed to fetch transaction data: {response.status_code}")
            success = False
            
    except Exception as e:
        print(f"❌ Error checking transaction data: {str(e)}")
        success = False
    
    # Check website availability
    try:
        website_url = "https://albright-laboratories.github.io/brightflow-buy-sell-order/"
        response = requests.get(website_url, timeout=30)
        
        if response.status_code == 200:
            print("✅ Website is accessible")
        else:
            print(f"⚠️  Website returned status: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Could not verify website accessibility: {str(e)}")
        # Don't fail on this - website might take time to deploy
    
    if success:
        print("✅ Website update verification completed successfully!")
        print("🌐 Users should see updated data within 5 minutes")
    else:
        print("❌ Website update verification failed!")
        print("🔧 Check GitHub repository and data files manually")
    
    return success

def main():
    """Main function"""
    print("🚀 Starting website update verification...")
    
    try:
        success = verify_website_update()
        
        if not success:
            exit(1)
            
    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()