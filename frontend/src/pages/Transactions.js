import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, 
    Plus, 
    Send, 
    Download, 
    DollarSign, 
    CreditCard, 
    Building,
    Smartphone,
    MoreHorizontal,
    Eye,
    EyeOff,
    FileText,
    Bell,
    ChevronRight,
    Bot
} from 'lucide-react';
import TransactionList from '../components/TransactionList';
import PrivacyNoticeModal from '../components/PrivacyNoticeModal';
import BottomNavigation from '../components/BottomNavigation';
import { createDemoAgentTransaction, getTransactionStats } from '../utils/transactionManager';

const Transactions = () => {
    const [balance, setBalance] = useState(parseFloat(localStorage.getItem('walletBalance') || '0').toFixed(2));
    const [showBalance, setShowBalance] = useState(true);
    const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
    const navigate = useNavigate();

    // Update balance when component mounts or localStorage changes
    React.useEffect(() => {
        const updateBalance = () => {
            const storedBalance = parseFloat(localStorage.getItem('walletBalance') || '0').toFixed(2);
            setBalance(storedBalance);
        };

        // Update balance when the component mounts
        updateBalance();

        // Listen for storage changes (when balance is updated from AddMoney page)
        window.addEventListener('storage', updateBalance);
        
        // Also check for changes when the window gains focus (for same-tab updates)
        window.addEventListener('focus', updateBalance);

        return () => {
            window.removeEventListener('storage', updateBalance);
            window.removeEventListener('focus', updateBalance);
        };
    }, []);

    const handleDemoAgentTransaction = () => {
        const transaction = createDemoAgentTransaction();
        alert(`Demo: AI Agent created transaction!\nRecipient: ${transaction.recipient}\nAmount: ₱${transaction.amount.toLocaleString()}`);
    };

    // Handle the "Simulate AI" demo flow
    const handleSimulateAI = () => {
        setShowPrivacyNotice(true);
    };

    const handleAllowAutoResolution = () => {
        setShowPrivacyNotice(false);
        // Navigate to Payment Delayed Screen with demo mode
        navigate('/payment-delayed');
    };

    const handleResolveManually = () => {
        setShowPrivacyNotice(false);
        alert('Demo: In real app, you would be redirected to manual resolution options or customer support.');
    };

    const quickActions = [
        { 
            icon: <Send className="w-8 h-8" strokeWidth={1.5} />, 
            label: "Send Money", 
            action: () => alert('Demo: Send Money feature')
        },
        { 
            icon: <Download className="w-8 h-8" strokeWidth={1.5} />, 
            label: "Request Money", 
            action: () => alert('Demo: Request Money feature')
        },
        { 
            icon: <DollarSign className="w-8 h-8" strokeWidth={1.5} />, 
            label: "Cash Out", 
            action: () => alert('Demo: Cash Out feature')
        },
        { 
            icon: <Building className="w-8 h-8" strokeWidth={1.5} />, 
            label: "Send to Bank", 
            action: () => alert('Demo: Send to Bank feature')
        },
        { 
            icon: <Smartphone className="w-8 h-8" strokeWidth={1.5} />, 
            label: "Buy Load", 
            action: () => alert('Demo: Buy Load feature')
        },
        { 
            icon: <FileText className="w-8 h-8" strokeWidth={1.5} />, 
            label: "Pay Bills", 
            action: () => alert('Demo: Pay Bills feature')
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white text-black pt-12 pb-8 px-4">
                <div className="flex items-center justify-between mb-8">
                    <Link to="/" className="p-2">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">VYBE eWallet</h1>
                    <div className="relative">
                        <Bell className="w-6 h-6 text-gray-700" />
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            11
                        </div>
                    </div>
                </div>
                
                {/* Balance Display */}
                <div className="text-center py-4">
                    <p className="text-gray-600 text-lg mb-2">Available Balance</p>
                    <div className="flex items-center justify-center space-x-3">
                        <h2 className="text-4xl font-light text-black">
                            {showBalance ? `PHP ${balance}` : 'PHP ••••••'}
                        </h2>
                        <button 
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-1"
                        >
                            {showBalance ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                        </button>
                    </div>
                </div>

                {/* Add Money Button */}
                <div className="text-center mt-6">
                    <Link 
                        to="/add-money"
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full flex items-center space-x-2 mx-auto transition-colors w-fit"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Money</span>
                    </Link>
                </div>
            </header>

            {/* Quick Actions Grid */}
            <section className="px-4 -mt-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm"
                >
                    <div className="grid grid-cols-4 gap-4">
                        {quickActions.map((action, index) => (
                            <motion.button
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={action.action}
                                className="flex flex-col items-center space-y-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <div className="text-red-500">
                                    {action.icon}
                                </div>
                                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                                    {action.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Unique Promos */}
            <section className="px-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Unique Promos</h3>
                    <ChevronRight className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex space-x-4 overflow-x-auto">
                    {/* Promo Card 1 */}
                    <div className="flex-shrink-0 w-64 bg-white rounded-2xl p-4 shadow-sm border">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-2">
                                <span className="text-pink-600 font-bold text-lg">PROMO NAME</span>
                            </div>
                            <div className="bg-yellow-400 rounded-full p-1">
                                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-teal-100 to-blue-100 rounded-lg h-12"></div>
                    </div>
                    
                    {/* Promo Card 2 */}
                    <div className="flex-shrink-0 w-64 bg-white rounded-2xl p-4 shadow-sm border">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-gradient-to-r from-teal-100 to-green-100 rounded-lg p-2">
                                <span className="text-teal-600 font-bold text-lg">PROMO NAME</span>
                            </div>
                            <div className="bg-yellow-400 rounded-full p-1">
                                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-teal-100 to-blue-100 rounded-lg h-12"></div>
                    </div>
                </div>
            </section>

            {/* Recent Activities */}
            <section className="px-4 mb-20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                    <ChevronRight className="w-5 h-5 text-red-500" />
                </div>
                <TransactionList limit={3} />
                
                {/* Demo Notice */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-700">
                                <span className="font-medium">Demo Mode:</span> Showing mock transactions. 
                                Agent integration will allow dynamic transaction management.
                            </p>
                        </div>
                        <button
                            onClick={handleSimulateAI}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                            <Bot className="w-4 h-4" />
                            <span>Simulate AI</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Bottom Navigation */}
            <BottomNavigation />

            {/* Privacy Notice Modal for Demo Flow */}
            <PrivacyNoticeModal
                isVisible={showPrivacyNotice}
                onClose={() => setShowPrivacyNotice(false)}
                onAllow={handleAllowAutoResolution}
                onManual={handleResolveManually}
            />
        </div>
    );
};

export default Transactions;
