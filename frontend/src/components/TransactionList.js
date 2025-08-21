import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, ArrowUpRight, ArrowDownLeft, Bot } from 'lucide-react';
import databaseTransactionManager, { subscribeToTransactions } from '../utils/databaseTransactionManager';
import dataRefreshService from '../services/dataRefreshService';

const TransactionList = ({ limit }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            console.log('[TransactionList] Loading transactions...');
            await databaseTransactionManager.loadTransactions(limit);
            const initialTransactions = databaseTransactionManager.getTransactions(limit);
            setTransactions(initialTransactions);
            setLoading(false);
        };

        // Initial load
        loadData();

        // Subscribe to transaction updates
        const unsubscribe = subscribeToTransactions((updatedTransactions) => {
            const displayTransactions = limit ? updatedTransactions.slice(0, limit) : updatedTransactions;
            setTransactions(displayTransactions);
        });

        // Subscribe to data refresh service (triggered by agent responses)
        const unsubscribeRefresh = dataRefreshService.subscribe(() => {
            console.log('[TransactionList] Refreshing transactions due to agent response...');
            loadData();
        });

        // Reduced auto-refresh to avoid conflicts with agent-triggered refreshes
        databaseTransactionManager.startAutoRefresh(30000); // Changed to 30 seconds

        return () => {
            unsubscribe();
            unsubscribeRefresh();
            databaseTransactionManager.stopAutoRefresh();
        };
    }, [limit]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'processing':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-50';
            case 'processing':
                return 'text-yellow-600 bg-yellow-50';
            case 'failed':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const formatAmount = (amount, type) => {
        const formatted = new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
        
        // Always show as positive amount with + prefix
        return `+${formatted}`;
    };

    const formatDate = (date) => {
        const transactionDate = new Date(date);
        const now = new Date();
        const diffInMinutes = Math.floor((now - transactionDate) / (1000 * 60));
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)}d ago`;
        }
    };

    const handleTransactionClick = (transaction) => {
        if (transaction.isFloatingCash || transaction.needsEscalation) {
            navigate('/payment-delayed');
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                                <div>
                                    <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                                </div>
                            </div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!transactions.length) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="text-gray-400 mb-4">
                    <Clock className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No transactions yet</h3>
                <p className="text-gray-500">Your transaction history will appear here</p>
                <p className="text-blue-600 text-sm mt-2">(Connected to database)</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {transactions.map((transaction, index) => {
                // Check if this is a successful retry transaction (RT prefix and is_retry_successful = true)
                const isSuccessfulRetry = transaction.id && 
                                         transaction.id.startsWith('RT') && 
                                         transaction.isRetrySuccessful === true;
                
                return (
                    <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => handleTransactionClick(transaction)}
                        className={`bg-white rounded-2xl p-4 shadow-sm transition-all duration-200 ${
                            isSuccessfulRetry
                                ? 'hover:shadow-md border-2 border-green-300 bg-gradient-to-r from-green-50 to-white'
                                : (transaction.isFloatingCash || transaction.needsEscalation)
                                    ? 'hover:shadow-md cursor-pointer hover:bg-gray-50 border border-red-200' 
                                    : 'hover:shadow-md'
                        }`}
                    >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 relative">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    {transaction.type === 'send' ? (
                                        <ArrowUpRight className="w-6 h-6 text-red-500" />
                                    ) : (
                                        <ArrowDownLeft className="w-6 h-6 text-green-500" />
                                    )}
                                </div>
                                {transaction.isRetrySuccessful && (
                                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                                        <Bot className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold text-gray-900">
                                        {transaction.type === 'send' 
                                            ? `To ${transaction.recipient}` 
                                            : `From ${transaction.recipient}`
                                        }
                                    </h3>
                                    {isSuccessfulRetry && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Retry Success
                                        </span>
                                    )}
                                    {getStatusIcon(transaction.status)}
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span>{transaction.method}</span>
                                    <span>•</span>
                                    <span>{formatDate(transaction.date)}</span>
                                    {isSuccessfulRetry && (
                                        <>
                                            <span>•</span>
                                            <span className="text-green-600 font-medium">Auto-Resolved</span>
                                        </>
                                    )}
                                    {transaction.isFloatingCash && !isSuccessfulRetry && (
                                        <>
                                            <span>•</span>
                                            <span className="text-orange-600 font-medium">Floating Cash</span>
                                        </>
                                    )}
                                    {transaction.needsEscalation && (
                                        <>
                                            <span>•</span>
                                            <span className="text-red-600 font-medium">Needs Attention</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold text-green-600">
                                {formatAmount(transaction.amount, transaction.type)}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(transaction.status)}`}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </div>
                        </div>
                    </div>
                </motion.div>
                );
            })}
        </div>
    );
};

export default TransactionList;