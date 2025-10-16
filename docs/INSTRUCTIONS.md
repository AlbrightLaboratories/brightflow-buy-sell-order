# BrightFlow Buy-Sell Order Instructions

## Project Overview
This project creates a web-based investment tracking system that displays BrightFlow performance against traditional investment options, with real-time visualizations and transaction history.

## Core Requirements

### 1. Performance Display
- **Location**: Top right corner of the webpage
- **Content**: Running balance showing potential earnings from $1 invested in BrightFlow starting September 25, 2024
- **Update Frequency**: Daily

### 2. Graph Visualization
- **Background**: Black with grey grid lines representing cells
- **Primary Line**: Yellow line showing BrightFlow activity (up/down movements)
- **Comparison Lines**:
  - Red line: SPY stock performance
  - Additional lines for Vanguard's VFIAX and SPDR S&P 500 ETF (different colors)
- **Purpose**: Visual comparison to show which investment performs better

### 3. Transaction Ledger
- **Format**: Table displaying the last 50 transactions
- **Layout**: Real ledger appearance with running balances on the right
- **Functionality**: Should look and feel like an authentic financial ledger

### 4. Technical Requirements
- **Data Format**: Machine-readable format
- **Integration**: Must be updatable via external repository
- **Source Repository**: https://github.com/AlbrightLaboratories/brightflow-ML/issues
- **Architecture**: Designed for automated updates from ML repository

## Implementation Guidelines

### Frontend Components
1. **Header Section**: Performance indicator (top right)
2. **Main Chart Area**: Multi-line graph with comparison data
3. **Transaction Table**: Ledger-style transaction history
4. **Responsive Design**: Ensure proper display across devices

### Data Integration
1. Set up API endpoints for receiving data from brightflow-ML repository
2. Implement data parsing for machine-readable format
3. Create update mechanisms for real-time data synchronization

### Visual Design
1. **Color Scheme**:
   - Background: Black
   - Grid: Grey
   - BrightFlow: Yellow
   - SPY: Red
   - Other ETFs: Distinct colors (blue, green, etc.)
2. **Typography**: Clear, readable fonts suitable for financial data
3. **Layout**: Professional appearance matching financial applications

## Development Tasks

### Phase 1: Setup and Structure
- [ ] Initialize project structure
- [ ] Set up development environment
- [ ] Create basic HTML/CSS framework

### Phase 2: Graph Implementation
- [ ] Implement chart library (Chart.js, D3.js, or similar)
- [ ] Create multi-line graph with proper scaling
- [ ] Add interactive features (hover, zoom, etc.)

### Phase 3: Data Integration
- [ ] Create API endpoints for data reception
- [ ] Implement data parsing and validation
- [ ] Set up automatic updates from ML repository

### Phase 4: Ledger Table
- [ ] Design transaction table layout
- [ ] Implement running balance calculations
- [ ] Add pagination for transaction history

### Phase 5: Testing and Deployment
- [ ] Test data integration
- [ ] Validate calculations
- [ ] Deploy to production environment

## Notes
- Ensure all financial calculations are accurate and verified
- Implement proper error handling for data updates
- Consider performance optimization for real-time updates
- Plan for scalability as transaction volume grows