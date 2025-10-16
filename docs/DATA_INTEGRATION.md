# Data Integration Guide

This document explains how the BrightFlow ML repository can update the webpage data.

## Overview

The webpage reads data from JSON files in the `/data` directory. The ML repository can update these files using GitHub Actions to trigger real-time updates on the website.

## Data Files

### `/data/performance.json`
Contains performance data for all investment options:

```json
{
  "lastUpdated": "2024-10-14T10:30:00Z",
  "startDate": "2024-09-25", 
  "currentValue": 1.47,
  "dailyChange": 0.0234,
  "performance": {
    "brightflow": [{"date": "2024-09-25", "value": 1.0}, ...],
    "spy": [{"date": "2024-09-25", "value": 1.0}, ...],
    "vfiax": [{"date": "2024-09-25", "value": 1.0}, ...],
    "spdr": [{"date": "2024-09-25", "value": 1.0}, ...]
  }
}
```

### `/data/transactions.json`
Contains recent transaction history:

```json
{
  "lastUpdated": "2024-10-14T10:30:00Z",
  "totalTransactions": 847,
  "currentBalance": 12534.67,
  "transactions": [
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
}
```

## Integration Methods

### Method 1: Repository Dispatch (Recommended)

From the BrightFlow ML repository, trigger updates using GitHub API:

```python
import requests
import json

def update_brightflow_website(performance_data, transaction_data):
    url = "https://api.github.com/repos/AlbrightLaboratories/brightflow-buy-sell-order/dispatches"
    
    payload = {
        "event_type": "update-brightflow-data",
        "client_payload": {
            "performance_data": performance_data,
            "transaction_data": transaction_data
        }
    }
    
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.status_code == 204
```

### Method 2: Direct File Updates

The ML repo can directly push to this repository:

```python
import requests
import json
import base64

def update_data_file(file_path, content, github_token):
    url = f"https://api.github.com/repos/AlbrightLaboratories/brightflow-buy-sell-order/contents/{file_path}"
    
    # Get current file SHA
    response = requests.get(url, headers={
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github.v3+json"
    })
    
    sha = response.json().get("sha") if response.status_code == 200 else None
    
    # Update file
    payload = {
        "message": f"Update {file_path}",
        "content": base64.b64encode(json.dumps(content).encode()).decode(),
        "sha": sha
    }
    
    response = requests.put(url, json=payload, headers={
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github.v3+json"  
    })
    
    return response.status_code in [200, 201]

# Usage
update_data_file("data/performance.json", performance_data, GITHUB_TOKEN)
update_data_file("data/transactions.json", transaction_data, GITHUB_TOKEN)
```

### Method 3: Webhook Integration

Set up a webhook in the ML repo that triggers on new ML predictions:

1. **In ML repo**: Add webhook to `.github/workflows/ml-update.yml`
2. **On prediction**: POST to webhook URL
3. **This repo**: Receives webhook and updates data files

## Required GitHub Secrets

In the BrightFlow ML repository, add these secrets:

- `BRIGHTFLOW_WEBSITE_TOKEN`: Personal Access Token with `repo` permissions
- `BRIGHTFLOW_WEBSITE_REPO`: `AlbrightLaboratories/brightflow-buy-sell-order`

## Automation Schedule

The website checks for updates:
- **Every 5 minutes** during market hours (9 AM - 4 PM EST, Monday-Friday)
- **On-demand** when triggered by ML repository
- **Fallback**: If no updates in 5 minutes, continues with demo mode

## Data Validation

The website includes error handling:
- Falls back to mock data if JSON files are missing
- Validates data structure before updating charts
- Caches last known good data
- Displays timestamp of last update

## Real-time Updates

Once data files are updated:
1. GitHub Pages serves new JSON files immediately
2. Website polls for updates every 30 seconds
3. Charts and tables animate to show new data
4. Performance display updates with latest values

## Testing

To test the integration:
1. Manually trigger the GitHub Action
2. Update JSON files directly via GitHub interface  
3. Verify website updates within 30 seconds
4. Check browser console for any errors

## Security

- All data is public (GitHub Pages limitation)
- Use repository dispatch for controlled updates
- Validate all input data in the workflow
- Rate limit API calls to prevent abuse