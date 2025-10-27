# Changelog

All notable changes to the BrightFlow Trading Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-10-27

### Added
- **Transaction Filter Dropdown**: Users can now filter transactions by timeframe
  - Options: Last 24 Hours, Last 7 Days, Last 30 Days, All Time (default)
  - Available on both desktop and mobile versions
  - Real-time filtering with smooth animations
- **Mobile Transaction Table**: Complete transaction table on mobile page
  - 6-column optimized layout (Date, Action, Symbol, Qty, Price, Amount)
  - Horizontal scrolling with touch-optimized interface
  - Sticky table headers for better navigation
- **Mobile Summary Cards**: Added transaction summary cards
  - Total Transactions counter
  - Current Balance display
  - Responsive grid layout
- **Mobile Filter Controls**: Transaction filter dropdown integrated into mobile interface
  - Styled with gold accents matching desktop theme
  - Touch-optimized dropdown interface

### Changed
- **Data Directory Management**: Re-enabled tracking for `/data` directory
  - Removed from `.gitignore` to allow GitHub Pages to serve JSON files
  - Enables proper data fetching from static site
- **Transaction Display Logic**: Updated `createTransactionRow()` function
  - Detects mobile vs desktop context automatically
  - Generates appropriate column layout per platform
  - Maintains feature parity across viewports
- **Mobile Styling Enhancements**: Improved visual appeal on mobile
  - Dark theme (#1a1a1a) consistent with desktop
  - Gold (#ffd700) highlights for headers and key values
  - Green/red color coding for BUY/SELL actions
  - Smooth transitions and hover effects

### Fixed
- **Workflow Authentication**: Fixed GitHub Actions permission issues
  - Enabled organization-level write permissions for workflows
  - Workflows can now commit and push data updates successfully
  - Resolved 403 "Permission denied" errors
- **Data Update Workflow**: Removed problematic git clone step
  - Workflow now relies on ML repo pushing data via GitHub API
  - Eliminates authentication errors during automated updates
  - Cleaner separation of concerns between repositories
- **Transaction Visibility**: Fixed mobile transaction display issues
  - Transactions now visible in full scrollable table
  - Filter shows all transactions by default (All Time)
  - Eliminated "No transactions in last 24 hours" false negatives
- **Jekyll Configuration**: Disabled Jekyll processing for GitHub Pages
  - Added `.nojekyll` file to prevent Jekyll from ignoring `/data` directory
  - Ensures data files are properly served to website visitors

### Infrastructure
- **GitHub Actions Permissions**: Updated workflow permissions
  - Set `default_workflow_permissions` to `write`
  - Enables automated data commits from workflows
  - Applied at organization level for all repositories
- **Workflow Architecture**: Simplified data update pipeline
  - ML repo pushes data directly via GitHub API
  - Website repo workflows process and validate data
  - Eliminated redundant git clone operations

### Documentation
- **Workflow Documentation**: Updated workflow explanation files
  - Clarified data flow from ML repo to website
  - Documented proper architecture for data updates
  - Added troubleshooting guides for common issues

## [1.1.0] - 2025-10-16

### Added
- Mobile-optimized interface with separate `index-mobile.html`
- Automatic mobile detection and redirection
- Stock search functionality with bull mascot graphics
- Mobile chart with time range controls (1D, 7D, 1M)
- Performance card showing current value and daily change

### Changed
- Split desktop and mobile experiences for better optimization
- Improved chart rendering on iPhone Safari
- Enhanced mobile debugging capabilities

### Fixed
- iPhone Safari chart rendering issues
- Mobile balance reverting problems
- Data collision prevention between mobile and desktop

## [1.0.0] - 2025-09-25

### Added
- Initial release of BrightFlow Trading Platform
- Real-time performance tracking vs SPY, VFIAX, SPDR
- Interactive Chart.js performance visualization
- Transaction ledger with detailed trade history
- Competitor comparison modal
- Dark theme with gold accents
- Responsive design for desktop and tablet

### Features
- Performance data fetched from `/data/performance.json`
- Transaction history from `/data/transactions.json`
- Multiple time range views (1D, 7D, 14D, 1M, 3M, 6M, 1Y, 5Y)
- Legend with toggle functionality for competitors
- Real-time data updates every 30 seconds
- Cached data fallback for offline resilience

---

## Release Types

- **Major**: Breaking changes, major new features
- **Minor**: New features, backwards-compatible
- **Patch**: Bug fixes, minor improvements

## Links

- [Repository](https://github.com/AlbrightLaboratories/brightflow-buy-sell-order)
- [Live Site](https://albright-laboratories.github.io/brightflow-buy-sell-order/)
- [Issues](https://github.com/AlbrightLaboratories/brightflow-buy-sell-order/issues)
