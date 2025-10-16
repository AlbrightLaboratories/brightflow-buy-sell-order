/**
 * Debug Data Loading
 * Test if data files are accessible and what errors occur
 */

async function debugDataLoading() {
    console.log('🔍 Starting data loading debug...');
    
    try {
        console.log('📊 Testing performance.json...');
        const performanceResponse = await fetch('./data/performance.json');
        console.log('Performance response status:', performanceResponse.status);
        console.log('Performance response ok:', performanceResponse.ok);
        
        if (performanceResponse.ok) {
            const performanceData = await performanceResponse.json();
            console.log('Performance data loaded:', performanceData);
            console.log('Performance data keys:', Object.keys(performanceData));
            console.log('Last updated:', performanceData.lastUpdated);
        } else {
            console.error('Performance data failed to load:', performanceResponse.status, performanceResponse.statusText);
        }
    } catch (error) {
        console.error('Performance data fetch error:', error);
    }
    
    try {
        console.log('📋 Testing transactions.json...');
        const transactionResponse = await fetch('./data/transactions.json');
        console.log('Transaction response status:', transactionResponse.status);
        console.log('Transaction response ok:', transactionResponse.ok);
        
        if (transactionResponse.ok) {
            const transactionData = await transactionResponse.json();
            console.log('Transaction data loaded:', transactionData);
            console.log('Transaction data keys:', Object.keys(transactionData));
            console.log('Transaction count:', transactionData.transactions ? transactionData.transactions.length : 'No transactions array');
        } else {
            console.error('Transaction data failed to load:', transactionResponse.status, transactionResponse.statusText);
        }
    } catch (error) {
        console.error('Transaction data fetch error:', error);
    }
    
    // Test if we can access the files directly
    try {
        console.log('🌐 Testing direct file access...');
        const testResponse = await fetch('./data/performance.json', {
            method: 'HEAD'
        });
        console.log('Direct access test status:', testResponse.status);
    } catch (error) {
        console.error('Direct access test error:', error);
    }
}

// Run debug when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Debug script loaded');
    debugDataLoading();
});

// Also test after a delay to see if it's a timing issue
setTimeout(debugDataLoading, 2000);
