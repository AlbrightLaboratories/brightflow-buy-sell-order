# Emergency Trade Card

## Overview
The Emergency Trade Card is a specialized UI component designed for executing high-priority trades quickly and safely. It provides an emergency trading interface with built-in risk management and routing options.

## Key Features

### 1. Trade Execution
- **Buy/Sell Actions**: Quick toggle between buying and selling
- **Symbol Entry**: Support for any stock symbol (e.g., AAPL, TSLA)
- **Fractional Shares**: Ability to trade fractional quantities (e.g., 0.5 shares)
- **Order Types**:
  - Market orders for immediate execution
  - Limit orders with custom price specification

### 2. Risk Management
- **Stop Loss Protection**: Automatic stop loss with configurable percentage (default: 3%)
- **Take Profit Targets**: Automatic profit-taking with configurable percentage (default: 5%)
- **Real-time Calculations**: Live display of:
  - Current market price
  - Stop loss price levels
  - Take profit price levels
  - Total trade value

### 3. Routing Options
The component offers three routing modes for trade review and execution:

- **Spock Review** 🖖: Routes trade through Spock AI agent for logical analysis
- **Jackson Review** 💼: Routes trade through Jackson AI agent for business analysis
- **Immediate** ⚡: Executes trade immediately without agent review (default)

### 4. Visual Design
- Dark mode interface with animated gradient backgrounds
- High-contrast emergency styling (red accents, gold text)
- Pulsing animations to indicate live status
- Responsive design for mobile and desktop

### 5. User Safety Features
- Clear visual indicators for live status
- Confirmation workflow before execution
- Cancel button for trade abandonment
- Status messages for feedback
- Help links for documentation access

## Technical Details
- Pure HTML/CSS/JavaScript component
- No external dependencies required
- Fully responsive grid layout
- Animated UI elements for visual feedback
- References external JavaScript file: `emergency-trade-card.js`

## Use Cases
- Emergency market situations requiring immediate action
- Quick trades during market volatility
- Situations where standard trading interface is too slow
- High-priority trades that need rapid execution

## Files
- `emergency-trade-card.html` - Main UI component
- `emergency-trade-card.js` - Trading logic and API integration (referenced but not included)

## Note
This component should be integrated into the ML trading system where AI agents (Spock, Jackson) can review and validate emergency trades before execution.
