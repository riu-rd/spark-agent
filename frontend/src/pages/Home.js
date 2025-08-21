import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Bell, 
    User, 
    ArrowRight, 
    Star
} from 'lucide-react';
import VybeLogo from '../components/VybeLogo';
import BottomNavigation from '../components/BottomNavigation';

const Home = () => {
    const [balance, setBalance] = useState(parseFloat(localStorage.getItem('walletBalance') || '0').toFixed(2));
    const [rewardsPoints] = useState('1000');

    // Update balance when component mounts or localStorage changes
    React.useEffect(() => {
        const updateBalance = () => {
            const storedBalance = parseFloat(localStorage.getItem('walletBalance') || '0').toFixed(2);
            setBalance(storedBalance);
        };

        // Update balance when the component mounts
        updateBalance();

        // Listen for storage changes
        window.addEventListener('storage', updateBalance);
        window.addEventListener('focus', updateBalance);

        return () => {
            window.removeEventListener('storage', updateBalance);
            window.removeEventListener('focus', updateBalance);
        };
    }, []);

    // Mock data for trending deals
    const trendingDeals = [
        { id: 1, title: "Business Name", subtitle: "Business Name", image: "/api/placeholder/100/80" },
        { id: 2, title: "Business Name", subtitle: "Business Name", image: "/api/placeholder/100/80" },
        { id: 3, title: "Business Name", subtitle: "Business Name", image: "/api/placeholder/100/80" }
    ];

    // Mock data for featured rewards
    const featuredRewards = [
        { id: 1, title: "Business Name", subtitle: "Business Name", image: "/api/placeholder/100/80" },
        { id: 2, title: "Business Name", subtitle: "Business Name", image: "/api/placeholder/100/80" }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white text-black pt-12 pb-6 px-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <button className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center border border-red-200">
                            <User className="w-5 h-5 text-red-600" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center">
                        <VybeLogo size="default" />
                    </div>
                    <div className="relative">
                        <button className="p-2">
                            <Bell className="w-6 h-6 text-gray-700" />
                        </button>
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            11
                        </div>
                    </div>
                </div>
            </header>

            {/* Balance Cards */}
            <section className="px-4 -mt-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                    {/* VYBE eWallet Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                    >
                        <Link to="/transactions" className="block">
                            <div className="flex flex-col space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <span className="text-yellow-600 font-bold text-sm">₱</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">VYBE eWallet</h3>
                                    <p className="text-lg font-bold text-gray-900">PHP {balance}</p>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* BPI Rewards Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                    >
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Star className="w-4 h-4 text-yellow-600" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm">BPI Rewards</h3>
                                <p className="text-lg font-bold text-gray-900">{rewardsPoints}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Promotional Banner */}
            <section className="px-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white relative overflow-hidden"
                >
                    {/* Decorative elements */}
                    <div className="absolute top-2 left-4">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full opacity-80"></div>
                    </div>
                    <div className="absolute top-4 right-8">
                        <Star className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div className="absolute bottom-2 left-8">
                        <div className="w-4 h-4 bg-yellow-400 transform rotate-45 opacity-60"></div>
                    </div>
                    <div className="absolute bottom-4 right-4">
                        <div className="w-12 h-12 bg-yellow-400 rounded-full opacity-50"></div>
                    </div>
                    <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                        <div className="w-16 h-16 bg-blue-400 rounded-full opacity-30"></div>
                    </div>
                    
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-1">DISCOVER MORE REWARDS</h3>
                        <h4 className="text-lg font-bold mb-1">AND PROMOS ON BPI'S</h4>
                        <h4 className="text-lg font-bold mb-4">ANNIVERSARY MONTH</h4>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold">BPI</span>
                            <span className="text-lg font-script text-yellow-300">Rewards</span>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Trending Deals */}
            <section className="mb-6">
                <div className="flex items-center justify-between px-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Trending Deals</h3>
                    <ArrowRight className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex space-x-4 px-4 overflow-x-auto scrollbar-hide">
                    {trendingDeals.map((deal, index) => (
                        <motion.div
                            key={deal.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="flex-shrink-0 w-48 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden"
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-2 left-2">
                                <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                            </div>
                            <div className="absolute top-2 right-2">
                                <div className="w-4 h-4 bg-red-400 transform rotate-45"></div>
                            </div>
                            <div className="absolute bottom-2 right-2">
                                <div className="w-8 h-8 bg-yellow-400 rounded-full"></div>
                            </div>
                            
                            <div className="relative z-10 pt-8">
                                <div className="w-full h-16 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                    <div className="text-xs font-bold text-gray-700 text-center px-2">
                                        {deal.title}
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-teal-100 to-blue-100 rounded-lg h-8"></div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Featured Rewards */}
            <section className="mb-20">
                <div className="flex items-center justify-between px-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Featured Rewards</h3>
                    <ArrowRight className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex space-x-4 px-4 overflow-x-auto scrollbar-hide">
                    {featuredRewards.map((reward, index) => (
                        <motion.div
                            key={reward.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="flex-shrink-0 w-48 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden"
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-2 left-2">
                                <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                            </div>
                            <div className="absolute top-2 right-2">
                                <div className="w-4 h-4 bg-red-400 transform rotate-45"></div>
                            </div>
                            <div className="absolute bottom-2 right-2">
                                <div className="w-8 h-8 bg-yellow-400 rounded-full"></div>
                            </div>
                            
                            <div className="relative z-10 pt-8">
                                <div className="w-full h-16 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                    <div className="text-xs font-bold text-gray-700 text-center px-2">
                                        {reward.title}
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-teal-100 to-blue-100 rounded-lg h-8"></div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
};

export default Home;
