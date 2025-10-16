#!/usr/bin/env python3
"""
BrightFlow Data Update API
Simple API for ML backend to update data files
"""

import json
import requests
import os
from datetime import datetime, timezone
import argparse

class BrightFlowDataUpdater:
    def __init__(self, github_token, repo_owner="AlbrightLaboratories", repo_name="brightflow-buy-sell-order"):
        self.github_token = github_token
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.base_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents"
        
    def update_performance_data(self, brightflow_values, spy_values, vfiax_values, spdr_values, 
                              current_value, daily_change):
        """
        Update performance data file
        
        Args:
            brightflow_values: List of {"date": "2024-10-14", "value": 1.47}
            spy_values: List of {"date": "2024-10-14", "value": 1.23}
            vfiax_values: List of {"date": "2024-10-14", "value": 1.20}
            spdr_values: List of {"date": "2024-10-14", "value": 1.19}
            current_value: Current value of $1 invested (float)
            daily_change: Daily change percentage as decimal (0.0234 = 2.34%)
        """
        
        data = {
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
            "startDate": "2024-09-25",
            "currentValue": current_value,
            "dailyChange": daily_change,
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
            transactions: List of transaction objects
            current_balance: Current account balance
            total_transactions: Total number of transactions
        """
        
        data = {
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
            "totalTransactions": total_transactions,
            "currentBalance": current_balance,
            "transactions": transactions
        }
        
        return self._update_file("data/transactions.json", data)
    
    def _update_file(self, file_path, content):
        """Update a file in the GitHub repository"""
        try:
            # Get current file info
            url = f"{self.base_url}/{file_path}"
            headers = {
                "Authorization": f"token {self.github_token}",
                "Accept": "application/vnd.github.v3+json"
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                file_data = response.json()
                sha = file_data["sha"]
            else:
                print(f"File not found, will create new file: {file_path}")
                sha = None
            
            # Prepare content
            content_json = json.dumps(content, indent=2)
            content_bytes = content_json.encode('utf-8')
            import base64
            content_b64 = base64.b64encode(content_bytes).decode('utf-8')
            
            # Update file
            update_data = {
                "message": f"Update {file_path} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                "content": content_b64,
                "sha": sha
            }
            
            response = requests.put(url, headers=headers, json=update_data)
            
            if response.status_code in [200, 201]:
                print(f"✅ Successfully updated {file_path}")
                return True
            else:
                print(f"❌ Failed to update {file_path}: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error updating {file_path}: {e}")
            return False

def main():
    parser = argparse.ArgumentParser(description='Update BrightFlow data files')
    parser.add_argument('--github-token', required=True, help='GitHub personal access token')
    parser.add_argument('--performance-file', help='Path to performance data JSON file')
    parser.add_argument('--transaction-file', help='Path to transaction data JSON file')
    parser.add_argument('--force-update', action='store_true', help='Force update even if data is recent')
    
    args = parser.parse_args()
    
    updater = BrightFlowDataUpdater(args.github_token)
    
    success = True
    
    # Update performance data if file provided
    if args.performance_file and os.path.exists(args.performance_file):
        print(f"📊 Updating performance data from {args.performance_file}")
        with open(args.performance_file, 'r') as f:
            perf_data = json.load(f)
        
        success &= updater.update_performance_data(
            perf_data.get('performance', {}).get('brightflow', []),
            perf_data.get('performance', {}).get('spy', []),
            perf_data.get('performance', {}).get('vfiax', []),
            perf_data.get('performance', {}).get('spdr', []),
            perf_data.get('currentValue', 1.0),
            perf_data.get('dailyChange', 0.0)
        )
    
    # Update transaction data if file provided
    if args.transaction_file and os.path.exists(args.transaction_file):
        print(f"📋 Updating transaction data from {args.transaction_file}")
        with open(args.transaction_file, 'r') as f:
            tx_data = json.load(f)
        
        success &= updater.update_transaction_data(
            tx_data.get('transactions', []),
            tx_data.get('currentBalance', 0.0),
            tx_data.get('totalTransactions', 0)
        )
    
    if success:
        print("🎉 All data updated successfully!")
    else:
        print("❌ Some updates failed")
        exit(1)

if __name__ == "__main__":
    main()
