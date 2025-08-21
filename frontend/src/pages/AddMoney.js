import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Banknote } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import toast from 'react-hot-toast';
import axios from 'axios';

const AddMoney = () => {
    const navigate = useNavigate();
    const [selectedAccount, setSelectedAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [currentBalance, setCurrentBalance] = useState(parseFloat(localStorage.getItem('walletBalance') || '0'));
    const [databaseBalance, setDatabaseBalance] = useState(null);

    // Bank accounts with actual balance from database
    const [dummyAccounts, setDummyAccounts] = useState([
        { id: 'bpi-savings', name: 'BPI Savings Account', number: '****1234', balance: 0 }
    ]);

    // Quick amount options
    const quickAmounts = [100, 300, 500, 1000];

    // Fetch actual balance from database
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await axios.get('http://localhost:3081/api/users/user_1');
                const walletBalance = parseFloat(response.data.wallet_balance || 0);
                
                // Update database balance
                setDatabaseBalance(walletBalance);
                
                // Update current balance from database
                setCurrentBalance(walletBalance);
                localStorage.setItem('walletBalance', walletBalance.toFixed(2));
                
                // Update the dummy accounts with the actual balance
                setDummyAccounts([
                    { 
                        id: 'bpi-savings', 
                        name: 'BPI Savings Account', 
                        number: '****1234', 
                        balance: walletBalance 
                    }
                ]);
            } catch (error) {
                console.error('Error fetching balance:', error);
                // If error, keep using localStorage value
                const storedBalance = parseFloat(localStorage.getItem('walletBalance') || '0');
                setDummyAccounts([
                    { 
                        id: 'bpi-savings', 
                        name: 'BPI Savings Account', 
                        number: '****1234', 
                        balance: storedBalance 
                    }
                ]);
            }
        };

        fetchBalance();
    }, []);

    const handleAccountSelect = (accountId) => {
        setSelectedAccount(accountId);
    };

    const handleQuickAmount = (quickAmount) => {
        setAmount(quickAmount.toString());
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        // Only allow numbers and decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const generateUniqueTransactionId = async () => {
        // Generate a UUID-like ID with suffix
        const generateId = () => {
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            return `${uuid}_1`;
        };

        // Try to generate a unique ID (in practice, UUIDs are unique enough)
        let transactionId = generateId();
        
        try {
            // Check if ID exists in database
            const response = await axios.get(`http://localhost:3081/api/users/user_1/transactions`);
            const existingIds = response.data.transactions ? 
                response.data.transactions.map(t => t.id) : 
                response.data.map(t => t.id);
            
            // Keep generating until we find a unique one
            while (existingIds.includes(transactionId)) {
                transactionId = generateId();
            }
        } catch (error) {
            console.error('Error checking transaction IDs:', error);
            // If we can't check, use the generated ID anyway
        }
        
        return transactionId;
    };

    const handleAddMoney = async () => {
        if (!selectedAccount) {
            toast.error('Please select an account first');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        const amountToAdd = parseFloat(amount);
        
        // Create loading toast
        const loadingToast = toast.loading('Processing transaction...');
        
        try {
            // Generate unique transaction ID
            const transactionId = await generateUniqueTransactionId();
            const now = new Date();
            const futureTime = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
            
            // Create transaction object with all required fields
            const transactionData = {
                transaction_id: transactionId,
                user_id: 'user_1',
                timestamp_initiated: now.toISOString(),
                amount: amountToAdd.toFixed(2),
                transaction_type: 'add_money',
                recipient_type: 'wallet_topup',
                recipient_account_id: 'WALLET_USER_1',
                recipient_bank_name_or_ewallet: 'BPI Digital Wallet',
                device_id: 'WEB_BROWSER_001',
                location_coordinates: '14.5995,120.9842', // Manila coordinates
                simulated_network_latency: 150, // 150ms latency
                status_timestamp_1: now.toISOString(),
                status_1: 'initiated',
                status_timestamp_2: new Date(now.getTime() + 1000).toISOString(), // 1 second later
                status_2: 'processing',
                status_timestamp_3: new Date(now.getTime() + 3000).toISOString(), // 3 seconds later
                status_3: 'pending_completion',
                status_timestamp_4: null, // Not completed yet - floating cash
                status_4: null, // Not completed yet - floating cash
                expected_completion_time: futureTime.toISOString(),
                is_floating_cash: true, // This is a floating cash transaction
                floating_duration_minutes: 5, // Expected to float for 5 minutes
                is_fraudulent_attempt: false,
                is_cancellation: false,
                is_retry_successful: false,
                manual_escalation_needed: false,
                transaction_types: null // As requested
            };
            
            // Send transaction to backend
            const response = await axios.post('http://localhost:3081/api/transactions', transactionData);
            
            // Dismiss loading toast
            toast.dismiss(loadingToast);
            
            if (response.status === 200 || response.status === 201) {
                // Show success message
                toast.success(
                    `Transaction initiated for ₱${amountToAdd.toFixed(2)}. This will be processed shortly.`,
                    { duration: 4000 }
                );
                
                // Note: We're NOT updating the wallet balance immediately since this simulates floating cash
                // The balance will be updated when the transaction is completed
                
                // Navigate back to transactions page after a brief delay
                setTimeout(() => {
                    navigate('/transactions');
                }, 1500);
            } else {
                toast.error('Failed to create transaction. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Error creating transaction:', error);
            toast.error('Error processing transaction. Please try again.');
        }
    };

    const selectedAccountDetails = dummyAccounts.find(acc => acc.id === selectedAccount);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white pt-12 pb-6 px-4 shadow-sm">
                <div className="flex items-center space-x-4">
                    <Link to="/transactions" className="p-2">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Add money</h1>
                </div>
            </header>

            {/* Current Balance Display */}
            <section className="px-4 py-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm"
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Banknote className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm mb-1">Your Available Balance</p>
                            <p className="text-3xl font-bold text-gray-900">
                                PHP {currentBalance.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Account Selection */}
            <section className="px-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    Which account would you like to add money from?
                </h2>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                >
                    <select
                        value={selectedAccount}
                        onChange={(e) => handleAccountSelect(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-xl bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        style={{ fontSize: '16px' }} // Prevent zoom on iOS
                    >
                        <option value="">Please Select an Account</option>
                        {dummyAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name} {account.number} - ₱{account.balance.toLocaleString()}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </motion.div>
            </section>

            {/* Amount Input */}
            <section className="px-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount</h3>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="relative">
                        <input
                            type="text"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            className="w-full p-4 border border-gray-300 rounded-xl bg-white text-gray-900 text-right text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            style={{ fontSize: '16px' }} // Prevent zoom on iOS
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-gray-500 text-lg">PHP</span>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Amount Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-4 gap-3 mt-6"
                >
                    {quickAmounts.map((quickAmount) => (
                        <button
                            key={quickAmount}
                            onClick={() => handleQuickAmount(quickAmount)}
                            className={`py-3 px-4 rounded-full border-2 transition-colors ${
                                amount === quickAmount.toString()
                                    ? 'border-red-500 bg-red-50 text-red-600'
                                    : 'border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50'
                            }`}
                        >
                            {quickAmount.toLocaleString()}
                        </button>
                    ))}
                </motion.div>
            </section>

            {/* Selected Account Info */}
            {selectedAccountDetails && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="px-4 mb-8"
                >
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">Selected:</span> {selectedAccountDetails.name}
                        </p>
                        <p className="text-sm text-blue-600">
                            Available: ₱{selectedAccountDetails.balance.toLocaleString()}
                        </p>
                    </div>
                </motion.section>
            )}

            {/* Add Money Button */}
            <section className="px-4 pb-8">
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={handleAddMoney}
                    disabled={!selectedAccount || !amount || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-to-r from-pink-400 to-red-400 hover:from-pink-500 hover:to-red-500 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-full transition-all duration-200 shadow-lg"
                >
                    Next
                </motion.button>
            </section>

            {/* Bottom Navigation */}
            <BottomNavigation />

            {/* Bottom Safe Area */}
            <div className="h-8"></div>
        </div>
    );
};

export default AddMoney;
