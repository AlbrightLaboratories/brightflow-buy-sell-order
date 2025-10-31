#!/usr/bin/env python3
"""
ML Backend Safe Data Update Script
Prevents data collision with website by using lock files
"""

import os
import json
import time
import shutil
from datetime import datetime
from pathlib import Path

class SafeDataUpdater:
    def __init__(self, data_dir="data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.max_wait = 30  # seconds
        
    def safe_update_data(self, data_type, new_data):
        """Safely update data files with collision prevention"""
        
        lock_file = self.data_dir / f".{data_type}_lock"
        data_file = self.data_dir / f"{data_type}.json"
        backup_file = self.data_dir / f"{data_type}_backup.json"
        
        print(f"🔄 Updating {data_type}.json...")
        
        # Wait for lock to be released
        wait_time = 0
        while lock_file.exists() and wait_time < self.max_wait:
            print(f"⏳ Waiting for lock to be released... ({wait_time}s)")
            time.sleep(1)
            wait_time += 1
        
        if lock_file.exists():
            raise Exception(f"Could not acquire lock for {data_type} after {self.max_wait} seconds")
        
        try:
            # Create lock file
            with open(lock_file, 'w') as f:
                f.write(f"Locked by ML backend at {datetime.now()}")
            
            print(f"🔒 Lock acquired for {data_type}")
            
            # Create backup of current data
            if data_file.exists():
                shutil.copy2(data_file, backup_file)
                print(f"💾 Backup created: {backup_file}")
            
            # Write new data
            with open(data_file, 'w') as f:
                json.dump(new_data, f, indent=2)
            
            print(f"✅ Successfully updated {data_file}")
            
            # Update timestamp
            timestamp_file = self.data_dir / "last_update.txt"
            with open(timestamp_file, 'w') as f:
                f.write(f"Last update: {datetime.now()}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error updating {data_type}: {e}")
            
            # Restore backup if update failed
            if backup_file.exists() and not data_file.exists():
                shutil.copy2(backup_file, data_file)
                print(f"🔄 Restored backup for {data_type}")
            
            raise e
        
        finally:
            # Remove lock file
            if lock_file.exists():
                lock_file.unlink()
                print(f"🔓 Lock released for {data_type}")
    
    def update_performance_data(self, performance_data):
        """Update performance data safely"""
        return self.safe_update_data("performance", performance_data)
    
    def update_transaction_data(self, transaction_data):
        """Update transaction data safely"""
        return self.safe_update_data("transactions", transaction_data)
    
    def update_recommendations_data(self, recommendations_data):
        """Update recommendations data safely"""
        return self.safe_update_data("recommendations", recommendations_data)
    
    def update_both(self, performance_data, transaction_data):
        """Update both performance and transaction data safely"""
        try:
            self.update_performance_data(performance_data)
            self.update_transaction_data(transaction_data)
            print("🎉 Both data files updated successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to update data: {e}")
            return False

def main():
    """Example usage"""
    updater = SafeDataUpdater()
    
    # Example performance data
    performance_data = {
        "lastUpdated": datetime.now().isoformat(),
        "currentValue": 10214.43,
        "brightflow": [
            {"date": "2024-01-01", "value": 1000.00},
            {"date": "2024-01-02", "value": 1010.50}
        ],
        "spy": [
            {"date": "2024-01-01", "value": 100.00},
            {"date": "2024-01-02", "value": 101.00}
        ]
    }
    
    # Example transaction data
    transaction_data = {
        "lastUpdated": datetime.now().isoformat(),
        "totalTransactions": 5,
        "currentBalance": 10214.43,
        "transactions": [
            {
                "timestamp": "2024-01-01T09:30:00Z",
                "symbol": "AAPL",
                "action": "BUY",
                "amount": 1000.00
            }
        ]
    }
    
    # Update data
    success = updater.update_both(performance_data, transaction_data)
    
    if success:
        print("✅ Data update completed successfully!")
    else:
        print("❌ Data update failed!")

if __name__ == "__main__":
    main()
