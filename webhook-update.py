#!/usr/bin/env python3
"""
BrightFlow Webhook Data Update
Simple webhook server for ML backend to update data
"""

from flask import Flask, request, jsonify
import json
import os
from datetime import datetime, timezone
from update_data_api import BrightFlowDataUpdater

app = Flask(__name__)

# Initialize updater
github_token = os.getenv('GITHUB_TOKEN')
if not github_token:
    print("❌ GITHUB_TOKEN environment variable not set")
    exit(1)

updater = BrightFlowDataUpdater(github_token)

@app.route('/update-data', methods=['POST'])
def update_data():
    """Webhook endpoint to update data from ML backend"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        print(f"📊 Received data update request at {datetime.now().isoformat()}")
        
        success = True
        
        # Update performance data if provided
        if 'performance_data' in data:
            print("📈 Updating performance data...")
            perf_data = data['performance_data']
            success &= updater.update_performance_data(
                perf_data.get('performance', {}).get('brightflow', []),
                perf_data.get('performance', {}).get('spy', []),
                perf_data.get('performance', {}).get('vfiax', []),
                perf_data.get('performance', {}).get('spdr', []),
                perf_data.get('currentValue', 1.0),
                perf_data.get('dailyChange', 0.0)
            )
        
        # Update transaction data if provided
        if 'transaction_data' in data:
            print("📋 Updating transaction data...")
            tx_data = data['transaction_data']
            success &= updater.update_transaction_data(
                tx_data.get('transactions', []),
                tx_data.get('currentBalance', 0.0),
                tx_data.get('totalTransactions', 0)
            )
        
        if success:
            return jsonify({
                "status": "success",
                "message": "Data updated successfully",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Some updates failed"
            }), 500
            
    except Exception as e:
        print(f"❌ Error processing update request: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.route('/', methods=['GET'])
def home():
    """Home endpoint with usage instructions"""
    return jsonify({
        "service": "BrightFlow Data Update Webhook",
        "endpoints": {
            "POST /update-data": "Update data from ML backend",
            "GET /health": "Health check",
            "GET /": "This help message"
        },
        "usage": {
            "performance_data": "Send performance data with currentValue, dailyChange, and performance arrays",
            "transaction_data": "Send transaction data with transactions array, currentBalance, and totalTransactions"
        }
    })

if __name__ == '__main__':
    print("🚀 Starting BrightFlow Data Update Webhook")
    print(f"⏰ Started at: {datetime.now().isoformat()}")
    print("📡 Webhook endpoints:")
    print("   POST /update-data - Update data from ML backend")
    print("   GET /health - Health check")
    print("   GET / - Help and usage")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
