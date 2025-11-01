# ML Repository Template Files

These are the template files your AI agent should copy to the ML repository for complete disaster recovery capability.

## Files to Copy to ML Repo:

### 1. `.github/workflows/update-brightflow.yml`
The main workflow that ensures continuous operation even if Kubernetes is down.

### 2. `update_brightflow_website.py`  
Script that handles updating the website data files.

### 3. `generate_brightflow_predictions.py`
Template for your ML pipeline (customize with your actual logic).

### 4. `calculate_performance_vs_benchmarks.py`
Template for calculating performance against SPY, VFIAX, SPDR.

### 5. `verify_website_update.py`
Script to verify the website update was successful.

## Setup Instructions:

1. Copy all files to your ML repository
2. Customize the ML scripts with your actual algorithms
3. Add required secrets to ML repository settings
4. Test the workflow manually first
5. Enable scheduled runs

This provides complete backup/disaster recovery for your BrightFlow system.