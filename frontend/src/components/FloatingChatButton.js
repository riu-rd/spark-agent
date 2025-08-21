import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

const FloatingChatButton = ({ onClick, hasNewMessage = false, isOpen = false }) => {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 md:w-14 md:h-14 bg-red-500 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-all duration-200"
      style={{ position: 'fixed' }}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </motion.div>
        ) : (
          <motion.div
            key="message"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
      {hasNewMessage && !isOpen && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
      )}
    </motion.button>
  );
};

export default FloatingChatButton;