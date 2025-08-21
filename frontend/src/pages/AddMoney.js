import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Banknote } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import toast from 'react-hot-toast';

const AddMoney = () => {
    const navigate = useNavigate();
    const [selectedAccount, setSelectedAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [currentBalance] = useState(parseFloat(localStorage.getItem('walletBalance') || '0'));

    // Dummy bank accounts - only BPI Savings
    const dummyAccounts = [
        { id: 'bpi-savings', name: 'BPI Savings Account', number: '****1234', balance: 50000 }
    ];

    // Quick amount options
    const quickAmounts = [100, 300, 500, 1000];

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

    const handleAddMoney = () => {
        if (!selectedAccount) {
            toast.error('Please select an account first');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        const amountToAdd = parseFloat(amount);
        const newBalance = currentBalance + amountToAdd;
        
        // Update balance in localStorage
        localStorage.setItem('walletBalance', newBalance.toFixed(2));
        
        // Show success message
        toast.success(`Successfully added ₱${amountToAdd.toFixed(2)} to your wallet!`);
        
        // Navigate back to transactions page after a brief delay
        setTimeout(() => {
            navigate('/transactions');
        }, 1500);
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
