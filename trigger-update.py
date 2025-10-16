#!/usr/bin/env python3
"""
Trigger BrightFlow Data Update
Simple script to trigger GitHub Actions workflow for data updates
"""

import requests
import json
import os
from datetime import datetime

def trigger_github_workflow(github_token, repo_owner, repo_name, workflow_name="update-data.yml"):
    """Trigger a GitHub Actions workflow"""
    
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/actions/workflows/{workflow_name}/dispatches"
    
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    data = {
        "ref": "main",
        "inputs": {
            "market_focus": "all",
            "emergency_update": "true"
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 204:
            print("✅ Successfully triggered GitHub Actions workflow")
            return True
        else:
            print(f"❌ Failed to trigger workflow: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error triggering workflow: {e}")
        return False

def main():
    # Get GitHub token from environment variable
    github_token = os.getenv('GITHUB_TOKEN')
    
    if not github_token:
        print("❌ Please set GITHUB_TOKEN environment variable")
        print("   export GITHUB_TOKEN=your_github_token_here")
        exit(1)
    
    repo_owner = "AlbrightLaboratories"
    repo_name = "brightflow-buy-sell-order"
    
    print(f"🚀 Triggering data update for {repo_owner}/{repo_name}")
    print(f"⏰ Time: {datetime.now().isoformat()}")
    
    success = trigger_github_workflow(github_token, repo_owner, repo_name)
    
    if success:
        print("🎉 Data update triggered successfully!")
        print("📊 Check the GitHub Actions tab to see the workflow running")
    else:
        print("❌ Failed to trigger data update")
        exit(1)

if __name__ == "__main__":
    main()
