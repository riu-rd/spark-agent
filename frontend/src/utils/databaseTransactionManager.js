import { transactionService } from '../services/api';

class DatabaseTransactionManager {
    constructor() {
        this.transactions = [];
        this.listeners = [];
        this.isLoading = false;
        this.lastFetch = null;
        this.fetchInterval = 5000;
    }

    async loadTransactions(limit = null) {
        try {
            this.isLoading = true;
            const transactions = await transactionService.getTransactions('user_1', limit || 50, 0);
            this.transactions = transactions;
            this.lastFetch = Date.now();
            this.notifyListeners();
            return transactions;
        } catch (error) {
            console.error('Error loading transactions:', error);
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    getTransactions(limit = null) {
        if (!this.lastFetch || Date.now() - this.lastFetch > this.fetchInterval) {
            this.loadTransactions(limit);
        }
        return limit ? this.transactions.slice(0, limit) : this.transactions;
    }

    async addTransaction(transaction) {
        try {
            const newTransaction = await transactionService.createTransaction(transaction);
            await this.loadTransactions();
            return newTransaction;
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    }

    async updateTransactionStatus(transactionId, newStatus) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction) {
            transaction.status = newStatus;
            this.notifyListeners();
            return transaction;
        }
        return null;
    }

    subscribe(callback) {
        this.listeners.push(callback);
        if (this.transactions.length === 0) {
            this.loadTransactions();
        }
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.transactions));
    }

    async getStats() {
        try {
            const stats = await transactionService.getTransactionStats('user_1');
            return stats;
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                total: this.transactions.length,
                completed: this.transactions.filter(t => t.status === 'completed').length,
                processing: this.transactions.filter(t => t.status === 'processing').length,
                failed: this.transactions.filter(t => t.status === 'failed').length,
                floating_cash: 0,
                needs_escalation: 0
            };
        }
    }

    startAutoRefresh(interval = 5000) {
        this.stopAutoRefresh();
        this.refreshTimer = setInterval(() => {
            this.loadTransactions();
        }, interval);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
}

const databaseTransactionManager = new DatabaseTransactionManager();

export { DatabaseTransactionManager };
export default databaseTransactionManager;

export const getTransactions = (limit) => databaseTransactionManager.getTransactions(limit);
export const addAgentTransaction = (transaction) => databaseTransactionManager.addTransaction(transaction);
export const updateTransactionStatus = (id, status) => databaseTransactionManager.updateTransactionStatus(id, status);
export const subscribeToTransactions = (callback) => databaseTransactionManager.subscribe(callback);
export const getTransactionStats = () => databaseTransactionManager.getStats();
export const loadTransactionsFromDB = (limit) => databaseTransactionManager.loadTransactions(limit);
export const startAutoRefresh = (interval) => databaseTransactionManager.startAutoRefresh(interval);
export const stopAutoRefresh = () => databaseTransactionManager.stopAutoRefresh();

export const createDemoAgentTransaction = () => {
    return databaseTransactionManager.addTransaction({
        type: 'send',
        recipient: 'AI Suggested Recipient',
        amount: Math.floor(Math.random() * 5000) + 500,
        method: 'SPARK Smart Assistant'
    });
};