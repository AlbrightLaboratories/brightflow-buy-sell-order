#!/usr/bin/env python3
import json
import sys
from datetime import datetime
import urllib.request

# Fetch the data
url = "https://raw.githubusercontent.com/AlbrightLaboratories/brightflow-sandbox/data/data/performance.json"
with urllib.request.urlopen(url) as response:
    data = json.loads(response.read())

print("=" * 70)
print("BRIGHTFLOW SANDBOX DATA VALIDATION REPORT")
print("=" * 70)

# Check timestamp
last_updated = data.get('lastUpdated')
print(f"\n✅ Last Updated: {last_updated}")
try:
    dt = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
    age_hours = (datetime.now(dt.tzinfo) - dt).total_seconds() / 3600
    print(f"   Data age: {age_hours:.1f} hours")
except:
    print("   ⚠️  Could not parse timestamp")

# Check current value
current_value = data.get('currentValue')
print(f"\n✅ Current BrightFlow Value: {current_value:.2f}")

# Check BrightFlow data
brightflow = data.get('brightflow', [])
print(f"\n✅ BrightFlow Data:")
print(f"   - Length: {len(brightflow)} data points")
if brightflow:
    print(f"   - First date: {brightflow[0]['date']}, value: {brightflow[0]['value']:.2f}")
    print(f"   - Last date: {brightflow[-1]['date']}, value: {brightflow[-1]['value']:.2f}")

# Check SPY data
spy = data.get('spy', [])
print(f"\n✅ SPY Data:")
print(f"   - Length: {len(spy)} data points")
if spy:
    print(f"   - First date: {spy[0]['date']}, value: {spy[0]['value']:.2f}")
    print(f"   - Last date: {spy[-1]['date']}, value: {spy[-1]['value']:.2f}")

# Check market indices
market_indices = data.get('marketIndices', {})
print(f"\n✅ Market Indices Available: {len(market_indices)}")
for key, index_data in market_indices.items():
    name = index_data.get('name', key)
    index_values = index_data.get('data', [])
    if index_values:
        first_val = index_values[0]['value']
        last_val = index_values[-1]['value']
        print(f"   - {name:20} ({key:10}): {len(index_values):3} points | First: {first_val:6.2f} | Last: {last_val:6.2f}")

# Comparison
print(f"\n📊 PERFORMANCE COMPARISON:")
if spy and brightflow:
    spy_last = spy[-1]['value']
    bf_last = brightflow[-1]['value']
    print(f"   BrightFlow: {bf_last:.2f}")
    print(f"   SPY:        {spy_last:.2f}")

# Issues
print(f"\n⚠️  ISSUES FOUND:")
issues = []

if len(brightflow) != len(spy):
    issues.append(f"   - BrightFlow ({len(brightflow)}) and SPY ({len(spy)}) have different lengths")

# Check if all market indices have consistent lengths
lengths = {key: len(idx.get('data', [])) for key, idx in market_indices.items()}
if len(set(lengths.values())) > 1:
    issues.append(f"   - Market indices have inconsistent lengths: {lengths}")

# Check first values
for key, index_data in market_indices.items():
    index_values = index_data.get('data', [])
    if index_values and index_values[0]['value'] != 100.0:
        issues.append(f"   - {key} doesn't start at 100.0 (starts at {index_values[0]['value']:.2f})")

if not issues:
    print("   None - data structure looks good!")
else:
    for issue in issues:
        print(issue)

print("\n" + "=" * 70)
