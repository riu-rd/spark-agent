import React from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const PaymentInfoCard = ({ amount, recipient, date, time, transactionId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyTransactionId = async () => {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopied(true);
      toast.success('Transaction ID copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl p-6 mx-4 mt-6 shadow-lg border border-gray-100"
    >
      {/* Amount */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-1">
          ₱{amount}
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Payment Amount
        </div>
      </div>

      {/* Transaction Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600 font-medium">Recipient</span>
          <span className="text-sm text-gray-900 font-semibold">{recipient}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600 font-medium">Date & Time</span>
          <span className="text-sm text-gray-900 font-semibold">{date} • {time}</span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600 font-medium">Transaction ID</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900 font-mono">{transactionId}</span>
            <button
              onClick={handleCopyTransactionId}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy Transaction ID"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentInfoCard;
