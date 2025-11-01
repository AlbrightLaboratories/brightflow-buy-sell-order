#!/usr/bin/env python3
"""
BrightFlow Data Updater Script
Can be run from the ML repository to update webpage data files
"""

import json
import requests
import os
from datetime import datetime, timezone
import base64

class BrightFlowUpdater:
    def __init__(self, github_token, repo_owner="AlbrightLaboratories", repo_name="brightflow-buy-sell-order"):
        self.github_token = github_token
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.base_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents"
        
    def update_performance_data(self, brightflow_values, spy_values, vfiax_values, spdr_values, 
                              current_value, daily_change, market_focus="all"):
        """
        Update performance data file - 24/7 money making mode
        
        Args:
            brightflow_values: List of {"date": "2024-10-14", "value": 1.47}
            spy_values: List of {"date": "2024-10-14", "value": 1.23}
            vfiax_values: List of {"date": "2024-10-14", "value": 1.20}
            spdr_values: List of {"date": "2024-10-14", "value": 1.19}
            current_value: Current value of $1 invested (float)
            daily_change: Daily change percentage as decimal (0.0234 = 2.34%)
            market_focus: Which market is active ("us", "asian", "european", "crypto", "forex", "all")
        """
        
        data = {
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
            "startDate": "2024-09-25",
            "currentValue": current_value,
            "dailyChange": daily_change,
            "marketFocus": market_focus,
            "updateMode": "24-7-aggressive",
            "performance": {
                "brightflow": brightflow_values,
                "spy": spy_values,
                "vfiax": vfiax_values,
                "spdr": spdr_values
            }
        }
        
        return self._update_file("data/performance.json", data)
    
    def update_transaction_data(self, transactions, current_balance, total_transactions):
        """
        Update transaction data file
        
        Args:
            transactions: List of transaction objects with keys:
                         id, timestamp, action, symbol, quantity, price, amount, 
                         runningBalance, confidence (optional), strategy (optional)
            current_balance: Current account balance (float)
            total_transactions: Total number of transactions (int)
        """
        
        data = {
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
            "totalTransactions": total_transactions,
            "currentBalance": current_balance,
            "transactions": transactions[-50:]  # Keep only last 50 transactions
        }
        
        return self._update_file("data/transactions.json", data)
    
    def _update_file(self, file_path, content):
        """Update a file in the GitHub repository"""
        
        url = f"{self.base_url}/{file_path}"
        headers = {
            "Authorization": f"Bearer {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        try:
            # Get current file SHA (if exists)
            response = requests.get(url, headers=headers)
            sha = response.json().get("sha") if response.status_code == 200 else None
            
            # Prepare file content
            content_str = json.dumps(content, indent=2)
            encoded_content = base64.b64encode(content_str.encode()).decode()
            
            # Update file
            payload = {
                "message": f"Update {file_path} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                "content": encoded_content
            }
            
            if sha:
                payload["sha"] = sha
            
            response = requests.put(url, json=payload, headers=headers)
            
            if response.status_code in [200, 201]:
                print(f"✓ Successfully updated {file_path}")
                return True
            else:
                print(f"✗ Failed to update {file_path}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"✗ Error updating {file_path}: {str(e)}")
            return False

# Example usage
if __name__ == "__main__":
    # Get GitHub token from environment variable
    github_token = os.environ.get("BRIGHTFLOW_WEBSITE_TOKEN")
    
    if not github_token:
        print("Error: Please set BRIGHTFLOW_WEBSITE_TOKEN environment variable")
        exit(1)
    
    updater = BrightFlowUpdater(github_token)
    
    # Example data - replace with your actual ML predictions
    brightflow_data = [
        {"date": "2024-09-25", "value": 1.0},
        {"date": "2024-09-26", "value": 1.023},
        {"date": "2024-10-14", "value": 1.47}
    ]
    
    spy_data = [
        {"date": "2024-09-25", "value": 1.0},
        {"date": "2024-09-26", "value": 1.008},
        {"date": "2024-10-14", "value": 1.23}
    ]
    
    vfiax_data = [
        {"date": "2024-09-25", "value": 1.0},
        {"date": "2024-09-26", "value": 1.007},
        {"date": "2024-10-14", "value": 1.20}
    ]
    
    spdr_data = [
        {"date": "2024-09-25", "value": 1.0},
        {"date": "2024-09-26", "value": 1.006},
        {"date": "2024-10-14", "value": 1.19}
    ]
    
    # Update performance data
    updater.update_performance_data(
        brightflow_values=brightflow_data,
        spy_values=spy_data,
        vfiax_values=vfiax_data,
        spdr_values=spdr_data,
        current_value=1.47,
        daily_change=0.0234
    )
    
    # Example transaction data
    transactions = [
        {
            "id": "tx_847",
            "timestamp": "2024-10-14T09:45:23Z",
            "action": "BUY",
            "symbol": "AAPL",
            "quantity": 25,
            "price": 178.45,
            "amount": -4461.25,
            "runningBalance": 12534.67,
            "confidence": 0.87,
            "strategy": "momentum"
        }
    ]
    
    # Update transaction data
    updater.update_transaction_data(
        transactions=transactions,
        current_balance=12534.67,
        total_transactions=847
    )