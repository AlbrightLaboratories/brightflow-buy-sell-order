# BrightFlow Buy-Sell Order Tracker

A real-time investment tracking system that displays BrightFlow performance against traditional investment options with animated visualizations and transaction history.

## Features

- **Real-time Performance Display**: Shows current value of $1 invested since September 25, 2024
- **Multi-line Chart**: Compares BrightFlow (yellow) vs SPY (red), VFIAX (green), and SPDR S&P 500 (blue)
- **Animated Transaction Ledger**: Displays last 50 transactions with running balances
- **Live Updates**: Simulates real-time data updates with smooth animations
- **Responsive Design**: Works on desktop and mobile devices

## GitHub Pages Demo

View the live demo: [https://albright-laboratories.github.io/brightflow-buy-sell-order/](https://albright-laboratories.github.io/brightflow-buy-sell-order/)

## Animations Included

### Chart Animations
- Smooth line drawing with easing transitions
- Real-time data updates every 10 seconds
- Interactive hover effects with tooltips
- Color-coded performance lines

### Transaction Table Animations
- Staggered row appearance (50ms delay between rows)
- New transaction highlighting (golden background fade)
- Smooth hover effects with translateX
- Auto-scrolling for new entries

### Performance Display
- Pulsing animation for current value
- Smooth number transitions when values update
- Color-coded positive/negative changes

## Technical Implementation

- **Chart.js**: For animated line charts with custom styling
- **Pure CSS3**: For smooth transitions and hover effects
- **JavaScript**: For real-time data simulation and DOM manipulation
- **Responsive Grid**: CSS Grid layout that adapts to screen size

## File Structure

```
├── index.html          # Main HTML structure
├── styles.css          # CSS styling with animations
├── script.js           # JavaScript functionality
├── INSTRUCTIONS.md     # Development instructions
└── README.md          # This file
```

## GitHub Pages Compatibility

This project is fully compatible with GitHub Pages and includes:
- Static HTML/CSS/JS files only
- CDN-based Chart.js library
- No server-side dependencies
- Responsive design for all devices

## Animation Performance

All animations are optimized for GitHub Pages:
- CSS3 transforms for smooth 60fps animations
- RequestAnimationFrame for JavaScript animations
- Efficient DOM updates to prevent lag
- Lightweight dependencies (Chart.js from CDN)

The mock demonstrates that complex financial visualizations with real-time updates and smooth animations are fully achievable on GitHub Pages.

## Original Requirements

Every day the webpage will show at the top right corner, the running balance of how much money you would of made had you invested $1 in brightflow September 25, 2024

 There should be some sort of yellow line on a black background with grey lines representing a cell and depicted as a graph, showing the activity of it going up and down, so that he can visually depict whether we're making money or not
On that same graph will be another line showing SPY stock line in red and how it is doing against the brightflow line so users can compare which one is doing better
There will be other lines like Vanguard's VFIAX or SPDR S&P 500 ETF and they will be depicted in other colors as well

 There should be a table showing the last 50 transactions with running balances on the right, where it looks like a real ledger.

 It should be machine-readable, and be able to be updated via another repo like https://github.com/AlbrightLaboratories/brightflow-ML/issuesbpage will show at the top right corner, the running balance of how much money you would of made had you invested $1 in brightflow September 25, 2024

 There should be some sort of yellow line on a black background with grey lines representing a cell and depicted as a graph, showing the activity of it going up and down, so that he can visually depict whether we're making money or not
On that same graph will be another line showing SPY stock line in red and how it is doing against the brightflow line so users can compare which one is doing better
There will be other lines like Vanguard’s VFIAX or SPDR S&P 500 ETF and they will be depicted in other colors as well



 There should be a table showing the last 50 transactions with running balances on the right, where it looks like a real ledger.

 It should be machine-readable, and be able to be updated via another repo like https://github.com/AlbrightLaboratories/brightflow-ML/issues

 


 
