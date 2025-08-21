/**
 * Global Data Refresh Service
 * Triggers database refresh after agent responses with a 10-second debounce
 */

class DataRefreshService {
    constructor() {
        this.refreshTimer = null;
        this.refreshDelay = 10000; // 10 seconds
        this.listeners = new Set();
        this.isRefreshing = false;
    }

    /**
     * Register a callback to be called when refresh happens
     * @param {Function} callback - Function to call on refresh
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Notify all listeners to refresh their data
     */
    notifyListeners() {
        console.log('[DataRefreshService] Notifying listeners to refresh data');
        this.listeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('[DataRefreshService] Error in listener callback:', error);
            }
        });
    }

    /**
     * Trigger a refresh after the debounce delay
     * If called multiple times within the delay, the timer resets
     */
    triggerRefresh() {
        console.log('[DataRefreshService] Refresh triggered, resetting timer to 10 seconds');
        
        // Clear existing timer if any
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        // Set new timer
        this.refreshTimer = setTimeout(() => {
            console.log('[DataRefreshService] Executing refresh after 10 seconds of inactivity');
            this.executeRefresh();
        }, this.refreshDelay);
    }

    /**
     * Execute the actual refresh
     */
    async executeRefresh() {
        if (this.isRefreshing) {
            console.log('[DataRefreshService] Refresh already in progress, skipping');
            return;
        }

        this.isRefreshing = true;
        console.log('[DataRefreshService] Starting data refresh');
        
        try {
            // Notify all listeners to refresh their data
            this.notifyListeners();
            
            // Also trigger the database transaction manager to reload
            const { default: databaseTransactionManager } = await import('../utils/databaseTransactionManager');
            await databaseTransactionManager.loadTransactions();
            
            console.log('[DataRefreshService] Data refresh completed');
        } catch (error) {
            console.error('[DataRefreshService] Error during refresh:', error);
        } finally {
            this.isRefreshing = false;
            this.refreshTimer = null;
        }
    }

    /**
     * Cancel any pending refresh
     */
    cancelPendingRefresh() {
        if (this.refreshTimer) {
            console.log('[DataRefreshService] Cancelling pending refresh');
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Force an immediate refresh
     */
    forceRefresh() {
        console.log('[DataRefreshService] Forcing immediate refresh');
        this.cancelPendingRefresh();
        this.executeRefresh();
    }

    /**
     * Check if a refresh is pending
     */
    isRefreshPending() {
        return this.refreshTimer !== null;
    }

    /**
     * Update the refresh delay
     * @param {number} delay - New delay in milliseconds
     */
    setRefreshDelay(delay) {
        this.refreshDelay = delay;
        console.log(`[DataRefreshService] Refresh delay updated to ${delay}ms`);
    }
}

// Create singleton instance
const dataRefreshService = new DataRefreshService();

// Export the service
export default dataRefreshService;