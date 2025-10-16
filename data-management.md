# BrightFlow Data Directory Management

## 🚨 Problem: Data Directory Collision

The ML backend and website both need to access the `/data` directory, which can cause:
- File corruption during concurrent writes
- Data loss when files are being read while being written
- Race conditions between ML updates and website reads
- Inconsistent data states

## ✅ Solution: Data Management Strategy

### 1. **Read-Only Website Access**
- Website should NEVER write to `/data` directory
- Website only reads from `/data` directory
- All data updates come from ML backend only

### 2. **ML Backend Data Updates**
- ML backend writes to `/data` directory
- ML backend handles all data file updates
- ML backend ensures data consistency

### 3. **Data Directory Structure**
```
/data/
├── performance.json          # Main performance data (ML writes, website reads)
├── transactions.json         # Transaction data (ML writes, website reads)
├── performance_backup.json   # Backup of performance data
├── transactions_backup.json  # Backup of transaction data
├── .lock                     # Lock file to prevent concurrent access
└── last_update.txt          # Timestamp of last update
```

### 4. **Lock File System**
- ML backend creates `.lock` file before writing
- ML backend removes `.lock` file after writing
- Website checks for `.lock` file before reading
- If `.lock` exists, website waits or uses cached data

### 5. **Data Validation**
- ML backend validates data before writing
- Website validates data after reading
- Backup files created before each update
- Rollback mechanism if data is corrupted

## 🔧 Implementation

### ML Backend Updates
```python
import os
import json
import time
from datetime import datetime

def safe_update_data(data_type, new_data):
    """Safely update data files with collision prevention"""
    
    # Create lock file
    lock_file = f"data/.{data_type}_lock"
    max_wait = 30  # seconds
    
    # Wait for lock to be released
    wait_time = 0
    while os.path.exists(lock_file) and wait_time < max_wait:
        time.sleep(1)
        wait_time += 1
    
    if os.path.exists(lock_file):
        raise Exception(f"Could not acquire lock for {data_type} after {max_wait} seconds")
    
    try:
        # Create lock
        with open(lock_file, 'w') as f:
            f.write(str(datetime.now()))
        
        # Backup current data
        backup_file = f"data/{data_type}_backup.json"
        if os.path.exists(f"data/{data_type}.json"):
            os.rename(f"data/{data_type}.json", backup_file)
        
        # Write new data
        with open(f"data/{data_type}.json", 'w') as f:
            json.dump(new_data, f, indent=2)
        
        # Update timestamp
        with open("data/last_update.txt", 'w') as f:
            f.write(str(datetime.now()))
        
        print(f"✅ Successfully updated {data_type}.json")
        
    except Exception as e:
        # Restore backup if update failed
        if os.path.exists(backup_file):
            os.rename(backup_file, f"data/{data_type}.json")
        raise e
    
    finally:
        # Remove lock
        if os.path.exists(lock_file):
            os.remove(lock_file)

# Usage
safe_update_data("performance", performance_data)
safe_update_data("transactions", transaction_data)
```

### Website Data Reading
```javascript
// Check for lock file before reading
async function safeReadData(filename) {
    const lockFile = `data/.${filename.replace('.json', '')}_lock`;
    
    // Check if lock exists
    try {
        const lockResponse = await fetch(lockFile);
        if (lockResponse.ok) {
            console.log('⚠️ Data file is being updated, using cached data');
            return getCachedData(filename);
        }
    } catch (e) {
        // Lock file doesn't exist, safe to read
    }
    
    // Read data file
    try {
        const response = await fetch(`data/${filename}`);
        if (response.ok) {
            const data = await response.json();
            cacheData(filename, data);
            return data;
        }
    } catch (e) {
        console.error(`Error reading ${filename}:`, e);
        return getCachedData(filename);
    }
}

// Cache data for fallback
function cacheData(filename, data) {
    localStorage.setItem(`cached_${filename}`, JSON.stringify(data));
    localStorage.setItem(`cached_${filename}_timestamp`, Date.now());
}

function getCachedData(filename) {
    const cached = localStorage.getItem(`cached_${filename}`);
    if (cached) {
        return JSON.parse(cached);
    }
    return null;
}
```

## 📋 Best Practices

### For ML Backend:
1. **Always use lock files** before writing
2. **Create backups** before updating
3. **Validate data** before writing
4. **Use atomic operations** (rename instead of overwrite)
5. **Handle errors gracefully** with rollback

### For Website:
1. **Never write to data directory**
2. **Check for lock files** before reading
3. **Use cached data** as fallback
4. **Validate data** after reading
5. **Handle missing data** gracefully

### For Data Files:
1. **Keep files small** (< 1MB each)
2. **Use JSON format** for consistency
3. **Include timestamps** for validation
4. **Version control** important changes
5. **Regular backups** of critical data

## 🚀 Quick Fix for Current Issue

### Immediate Solution:
1. **ML backend** should create a simple lock file before updating
2. **Website** should check for lock file before reading
3. **Add retry logic** if data is locked

### Example Lock File Check:
```javascript
// In loadRealData function
async function loadRealData() {
    // Check for lock files
    const performanceLock = await fetch('data/.performance_lock').catch(() => null);
    const transactionLock = await fetch('data/.transactions_lock').catch(() => null);
    
    if (performanceLock?.ok || transactionLock?.ok) {
        console.log('⚠️ Data files are being updated, using cached data');
        return loadCachedData();
    }
    
    // Proceed with normal data loading
    // ... existing code
}
```

This approach ensures data integrity while allowing both systems to work together without conflicts.
