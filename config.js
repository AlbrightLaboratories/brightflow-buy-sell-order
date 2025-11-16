// BrightFlow Configuration
// Configure data source URLs

const BrightFlowConfig = {
    // Data source mode: 'local' or 'sandbox'
    dataMode: 'sandbox',

    // Local data paths (relative to index.html)
    local: {
        recommendations: './data/recommendations.json',
        performance: './data/performance.json',
        transactions: './data/transactions.json',
        performanceLock: 'data/.performance_lock',
        transactionsLock: 'data/.transactions_lock'
    },

    // Sandbox data paths (GitHub raw content URLs)
    sandbox: {
        recommendations: 'https://raw.githubusercontent.com/AlbrightLaboratories/brightflow-sandbox/data/recommendations.json',
        performance: 'https://raw.githubusercontent.com/AlbrightLaboratories/brightflow-sandbox/data/performance.json',
        transactions: 'https://raw.githubusercontent.com/AlbrightLaboratories/brightflow-sandbox/data/transactions.json',
        performanceLock: 'https://raw.githubusercontent.com/AlbrightLaboratories/brightflow-sandbox/data/.performance_lock',
        transactionsLock: 'https://raw.githubusercontent.com/AlbrightLaboratories/brightflow-sandbox/data/.transactions_lock'
    },

    // Get the appropriate URL based on current mode
    getDataUrl: function(file) {
        const mode = this.dataMode;
        return this[mode][file] || this.local[file];
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrightFlowConfig;
}
