import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, QrCode, Gift } from 'lucide-react';

const BottomNavigation = () => {
    const location = useLocation();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
            <div className="flex justify-around items-center">
                <Link 
                    to="/" 
                    className={`flex flex-col items-center space-y-1 ${
                        location.pathname === '/' ? 'text-red-600' : 'text-gray-400'
                    }`}
                >
                    <HomeIcon className="w-6 h-6" />
                    <span className={`text-xs ${location.pathname === '/' ? 'font-medium' : ''}`}>
                        Home
                    </span>
                </Link>
                
                <button className="flex flex-col items-center space-y-1 text-gray-400">
                    <QrCode className="w-6 h-6" />
                    <span className="text-xs">QR</span>
                </button>
                
                <button className="flex flex-col items-center space-y-1 text-gray-400">
                    <Gift className="w-6 h-6" />
                    <span className="text-xs">My Rewards</span>
                </button>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full"></div>
        </div>
    );
};

export default BottomNavigation;
