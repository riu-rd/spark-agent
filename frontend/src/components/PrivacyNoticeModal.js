import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Eye, Network, CreditCard } from 'lucide-react';

const PrivacyNoticeModal = ({ isVisible, onClose, onAllow, onManual }) => {
  const accessItems = [
    {
      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
      title: "Transaction Status",
      description: "Current payment state and processing details"
    },
    {
      icon: <Network className="w-5 h-5 text-green-600" />,
      title: "Network Connectivity", 
      description: "Connection status with payment networks"
    },
    {
      icon: <Shield className="w-5 h-5 text-purple-600" />,
      title: "Payment Processing Systems",
      description: "Secure access to resolve transaction issues"
    }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Privacy Notice</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">
                  We can automatically resolve your delayed payment by securely accessing your transaction data and network connections. Our AI agents will work to complete your transfer or safely reverse it within 5 minutes.
                </p>
              </div>

              {/* What we'll access */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-blue-600 mr-2" />
                  What we'll access:
                </h3>
                
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {accessItems.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security notice */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                <p className="text-sm text-blue-800">
                  <strong>Your security is our priority.</strong> All access is encrypted, temporary, and used only to resolve this specific transaction. No sensitive data is stored.
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={onAllow}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Shield className="w-5 h-5" />
                  <span>Allow auto-resolution</span>
                </button>
                
                <button
                  onClick={onManual}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
                >
                  Resolve manually
                </button>
              </div>

              {/* Footer note */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  You can revoke access anytime in Settings
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrivacyNoticeModal;
