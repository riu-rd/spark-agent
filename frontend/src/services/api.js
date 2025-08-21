import axios from 'axios';

const API_BASE_URL = 'http://localhost:3081/api';
const DEFAULT_USER_ID = 'user_1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userService = {
  async getUser(userId = DEFAULT_USER_ID) {
    try {
      console.log(`Fetching user from: ${API_BASE_URL}/users/${userId}`);
      const response = await api.get(`/users/${userId}`);
      console.log('User data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error.message);
      console.error('Full error:', error);
      return null;
    }
  },

  async getWalletBalance(userId = DEFAULT_USER_ID) {
    try {
      const user = await this.getUser(userId);
      console.log('Wallet balance for user:', user);
      return user ? parseFloat(user.wallet_balance) : 0;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  },
};

export const transactionService = {
  async getTransactions(userId = DEFAULT_USER_ID, limit = 50, offset = 0) {
    try {
      console.log(`Fetching transactions from: ${API_BASE_URL}/users/${userId}/transactions`);
      const response = await api.get(`/users/${userId}/transactions`, {
        params: { limit, offset }
      });
      
      // Check if response includes wallet update metadata
      if (response.data.walletUpdated) {
        console.log(`Wallet updated! Added ₱${response.data.walletUpdateAmount} from ${response.data.processedRTCount} RT transaction(s)`);
        console.log('Processed RT transactions:', response.data.processedRTTransactions);
        
        // Show notification to user
        const toast = (await import('react-hot-toast')).default;
        toast.success(response.data.message, {
          duration: 5000,
          icon: '💰'
        });
        
        // Trigger an immediate wallet balance refresh
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('wallet-updated'));
        }, 100);
        
        // Return just the transactions array
        console.log(`Transactions received: ${response.data.transactions.length} items`);
        return response.data.transactions;
      }
      
      console.log(`Transactions received: ${response.data.length} items`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
      console.error('Full error:', error);
      return [];
    }
  },

  async getTransactionStats(userId = DEFAULT_USER_ID) {
    try {
      const response = await api.get(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      return {
        total: 0,
        completed: 0,
        processing: 0,
        failed: 0,
        floating_cash: 0,
        needs_escalation: 0
      };
    }
  },

  async createTransaction(transaction, userId = DEFAULT_USER_ID) {
    try {
      const response = await api.post(`/users/${userId}/transactions`, transaction);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },
};

export default {
  userService,
  transactionService,
};