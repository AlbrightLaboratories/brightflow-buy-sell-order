#!/usr/bin/env python3
"""
Capture screenshot of BrightFlow Buy-Sell Order dashboard
"""
import asyncio
from playwright.async_api import async_playwright

async def capture_brightflow():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})

        print("📸 Loading BrightFlow dashboard...")

        try:
            file_path = 'file:///Users/hawaiidevelopergmail.com/Documents/github/albright-laboratories/brightflow-buy-sell-order/index.html'
            await page.goto(file_path, timeout=10000, wait_until='networkidle')

            print("✅ Page loaded, waiting for content...")
            await page.wait_for_timeout(5000)  # Wait for charts and data to load

            # Take screenshot
            screenshot_path = '/tmp/brightflow_dashboard.png'
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved to: {screenshot_path}")

            # Get page title
            title = await page.title()
            print(f"📄 Page title: {title}")

        except Exception as e:
            print(f"❌ Error: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_brightflow())
