import React from 'react';

const VybeLogo = ({ size = 'default' }) => {
    const dimensions = {
        small: { width: 'w-6', height: 'h-6', text: 'text-lg' },
        default: { width: 'w-8', height: 'h-8', text: 'text-xl' },
        large: { width: 'w-12', height: 'h-12', text: 'text-2xl' }
    };

    const { width, height, text } = dimensions[size] || dimensions.default;

    return (
        <div className="flex items-center space-x-2">
            {/* VYBE Logo Image */}
            <img 
                src="/vybe-logo.png" 
                alt="VYBE Logo" 
                className={`${width} ${height} object-contain`}
            />
            
            {/* VYBE Text */}
            <span className={`${text} font-bold text-red-600`}>VYBE</span>
        </div>
    );
};

export default VybeLogo;
