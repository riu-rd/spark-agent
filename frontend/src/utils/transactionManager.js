/**
 * Transaction Manager - Handles both demo transactions and agent-generated transactions
 * This utility will be enhanced when AI agents are integrated
 */

// Mock transactions for demo purposes
const mockTransactions = [
    {
        id: '12345678-9abc-def0-1234-56789abcdef0',
        type: 'send',
        recipient: 'Business Name',
        amount: 3250.00,
        status: 'completed',
        date: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        method: 'InstaPay',
        source: 'demo'
    },
    {
        id: '23456789-abcd-ef01-2345-6789abcdef01',
        type: 'receive',
        sender: 'Business Name',
        amount: 850.75,
        status: 'completed',
        date: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        method: 'PESONet',
        source: 'demo'
    },
    {
        id: 'fedcba98-7654-3210-abcd-ef0123456789',
        type: 'send',
        recipient: 'Business Name',
        amount: 1200.00,
        status: 'processing',
        date: new Date(Date.now() - 1000 * 60 * 8), // 8 minutes ago
        method: 'GCash',
        source: 'demo',
        isResolutionOngoing: true // This transaction has ongoing AI resolution
    },
    {
        id: '456789ab-cdef-0123-4567-89abcdef0123',
        type: 'send',
        recipient: 'Business Name',
        amount: 950.50,
        status: 'failed',
        date: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
        method: 'Maya',
        source: 'demo'
    },
    {
        id: '56789abc-def0-1234-5678-9abcdef01234',
        type: 'receive',
        sender: 'Monthly Salary',
        amount: 48500.00,
        status: 'completed',
        date: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        method: 'Direct Deposit',
        source: 'demo'
    },
    {
        id: '6789abcd-ef01-2345-6789-abcdef012345',
        type: 'send',
        recipient: 'Business Name',
        amount: 675.25,
        status: 'completed',
        date: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        method: 'Bank Transfer',
        source: 'demo'
    },
    {
        id: '789abcde-f012-3456-789a-bcdef0123456',
        type: 'receive',
        sender: 'Business Name',
        amount: 2800.00,
        status: 'completed',
        date: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
        method: 'InstaPay',
        source: 'demo'
    },
    {
        id: '89abcdef-0123-4567-89ab-cdef01234567',
        type: 'send',
        recipient: 'Business Name',
        amount: 1500.00,
        status: 'completed',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        method: 'SPARK AI Assistant',
        source: 'demo',
        agentAssisted: true
    },
    {
        id: '9abcdef0-1234-5678-9abc-def012345678',
        type: 'receive',
        sender: 'Business Name',
        amount: 425.00,
        status: 'completed',
        date: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
        method: 'PESONet',
        source: 'demo'
    },
    {
        id: 'abcdef01-2345-6789-abcd-ef0123456789',
        type: 'send',
        recipient: 'Business Name',
        amount: 3750.00,
        status: 'completed',
        date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        method: 'Bank Transfer',
        source: 'demo'
    }
];

// In-memory storage for agent-generated transactions
let agentTransactions = [];

/**
 * Generate a UUID v4 format string
 * @returns {string} UUID in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID format
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Transaction Manager Class
 */
class TransactionManager {
    constructor() {
        this.transactions = [...mockTransactions];
        this.listeners = [];
    }

    /**
     * Get all transactions (demo + agent-generated)
     * @param {number} limit - Optional limit for number of transactions
     * @returns {Array} Array of transactions
     */
    getTransactions(limit = null) {
        const allTransactions = [...this.transactions, ...agentTransactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
        
        return limit ? allTransactions.slice(0, limit) : allTransactions;
    }

    /**
     * Add a new transaction (will be used by AI agents)
     * @param {Object} transaction - Transaction object
     */
    addTransaction(transaction) {
        const newTransaction = {
            ...transaction,
            id: transaction.id || generateUUID(),
            date: transaction.date || new Date(),
            source: 'agent',
            agentAssisted: true
        };

        agentTransactions.unshift(newTransaction); // Add to beginning (newest first)
        this.notifyListeners();
        
        console.log('SPARK: New agent transaction added:', newTransaction);
        return newTransaction;
    }

    /**
     * Update transaction status (useful for processing -> completed/failed)
     * @param {string} transactionId - Transaction ID to update
     * @param {string} newStatus - New status
     */
    updateTransactionStatus(transactionId, newStatus) {
        // Check agent transactions first
        const agentTransaction = agentTransactions.find(t => t.id === transactionId);
        if (agentTransaction) {
            agentTransaction.status = newStatus;
            this.notifyListeners();
            return agentTransaction;
        }

        // For demo purposes, we can also update mock transactions
        const mockTransaction = this.transactions.find(t => t.id === transactionId);
        if (mockTransaction) {
            mockTransaction.status = newStatus;
            this.notifyListeners();
            return mockTransaction;
        }

        return null;
    }

    /**
     * Subscribe to transaction updates
     * @param {Function} callback - Callback function to call when transactions update
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    /**
     * Notify all listeners of transaction updates
     */
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.getTransactions()));
    }

    /**
     * Simulate AI agent creating a transaction (for demo/testing)
     * @param {Object} params - Transaction parameters
     */
    simulateAgentTransaction(params = {}) {
        const defaultTransaction = {
            type: 'send',
            recipient: 'AI Suggested Recipient',
            amount: 1000.00,
            status: 'processing',
            method: 'SPARK AI Assistant',
            description: 'Transaction created by AI agent'
        };

        return this.addTransaction({ ...defaultTransaction, ...params });
    }

    /**
     * Get transaction statistics
     */
    getStats() {
        const allTransactions = this.getTransactions();
        return {
            total: allTransactions.length,
            demo: allTransactions.filter(t => t.source === 'demo').length,
            agent: allTransactions.filter(t => t.source === 'agent').length,
            completed: allTransactions.filter(t => t.status === 'completed').length,
            processing: allTransactions.filter(t => t.status === 'processing').length,
            failed: allTransactions.filter(t => t.status === 'failed').length
        };
    }
}

// Create singleton instance
const transactionManager = new TransactionManager();

// Export both the class and instance for different use cases
export { TransactionManager };
export default transactionManager;

// Helper functions for components
export const getTransactions = (limit) => transactionManager.getTransactions(limit);
export const addAgentTransaction = (transaction) => transactionManager.addTransaction(transaction);
export const updateTransactionStatus = (id, status) => transactionManager.updateTransactionStatus(id, status);
export const subscribeToTransactions = (callback) => transactionManager.subscribe(callback);
export const generateTransactionId = generateUUID;
export const validateTransactionId = isValidUUID;
export const getTransactionStats = () => transactionManager.getStats();

// Demo function for testing (can be called from components)
export const createDemoAgentTransaction = () => {
    return transactionManager.simulateAgentTransaction({
        recipient: 'Business Name',
        amount: Math.floor(Math.random() * 5000) + 500,
        method: 'SPARK Smart Assistant'
    });
};
