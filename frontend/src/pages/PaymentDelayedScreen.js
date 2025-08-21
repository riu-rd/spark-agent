import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  RotateCcw,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import PaymentInfoCard from '../components/PaymentInfoCard';
import PrivacyNoticeModal from '../components/PrivacyNoticeModal';
import BottomNavigation from '../components/BottomNavigation';
import toast from 'react-hot-toast';

const PaymentDelayedScreen = () => {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [hasSeenPrivacyNotice, setHasSeenPrivacyNotice] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(183); // 3:03 in seconds
  const [status, setStatus] = useState('delayed'); // delayed, resolving, resolved, failed
  const [autoResolutionEnabled, setAutoResolutionEnabled] = useState(false);
  const [resolutionProgress, setResolutionProgress] = useState(0);    // Mock transaction data for demo
    const transactionData = {
        amount: "350.00",
        recipient: "Ronnel Bermas (Demo)",
        date: "Dec 15, 2024",
        time: "2:34 PM",
        transactionId: "DEMO240567891"
    };

  // Timer effect - stops when issue is resolved
  useEffect(() => {
    if (status === 'resolved') {
      return; // Don't start timer if already resolved
    }
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status]); // Add status as dependency to restart/stop timer when status changes

  // Auto-resolution simulation
  useEffect(() => {
    if (autoResolutionEnabled && status === 'resolving') {
      const progressTimer = setInterval(() => {
        setResolutionProgress(prev => {
          if (prev >= 100) {
            setStatus('resolved');
            toast.success('Payment successfully completed!');
            clearInterval(progressTimer);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      return () => clearInterval(progressTimer);
    }
  }, [autoResolutionEnabled, status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };    const handleAllowAutoResolution = () => {
        setAutoResolutionEnabled(true);
        setStatus('resolving');
        setShowPrivacyNotice(false);
        setHasSeenPrivacyNotice(true);
        toast.success('Demo: Auto-resolution enabled. Simulating AI agent work...');
    };

    const handleResolveManually = () => {
        setShowPrivacyNotice(false);
        setHasSeenPrivacyNotice(true);
        toast.info('Demo: In real app, you can contact support for manual assistance.');
    };    const handleRefresh = () => {
        toast.loading('Demo: Checking transaction status...', { duration: 2000 });
        // Simulate refresh
        setTimeout(() => {
            toast.dismiss();
            if (Math.random() > 0.7) {
                setStatus('resolved');
                toast.success('Demo: Payment completed successfully!');
            } else {
                toast.info('Demo: Still processing. AI agents are working on it.');
            }
        }, 2000);
    };

  const getStatusColor = () => {
    switch (status) {
      case 'delayed': return 'bg-yellow-500';
      case 'resolving': return 'bg-red-500';
      case 'resolved': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };    const getStatusText = () => {
        switch (status) {
            case 'delayed': return 'Payment Delayed (Demo)';
            case 'resolving': return 'AI Resolving Issue (Demo)';
            case 'resolved': return 'Payment Completed (Demo)';
            case 'failed': return 'Resolution Failed (Demo)';
            default: return 'Processing (Demo)';
        }
    };

  const getStatusIcon = () => {
    switch (status) {
      case 'delayed': return <AlertTriangle className="w-6 h-6" />;
      case 'resolving': return <RefreshCw className="w-6 h-6 animate-spin" />;
      case 'resolved': return <CheckCircle className="w-6 h-6" />;
      case 'failed': return <XCircle className="w-6 h-6" />;
      default: return <Clock className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <header className="bg-white pt-12 pb-6 px-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <Link to="/transactions" className="p-2">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Payment Status</h1>
        </div>
      </header>

      {/* Status Header */}
      <div className={`${getStatusColor()} text-white p-6`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-2">
            {getStatusIcon()}
            <h1 className="text-2xl font-bold">{getStatusText()}</h1>
          </div>
          
          {status === 'delayed' && (
            <p className="text-white/90 mb-3">Working to resolve the issue...</p>
          )}
          
          {status === 'resolving' && (
            <>
              <p className="text-white/90 mb-3">AI agents are resolving your transaction</p>
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${resolutionProgress}%` }}
                />
              </div>
              <p className="text-sm text-white/80">{resolutionProgress}% complete</p>
            </>
          )}
          
          <div className="flex items-center justify-center space-x-2 text-white/80">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Time elapsed: {formatTime(timeElapsed)}</span>
          </div>
        </motion.div>
      </div>

      {/* Transaction Info */}
      <PaymentInfoCard {...transactionData} />

      {/* What's Happening Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-4 mt-6 bg-white rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">What's Happening?</h2>
        </div>
        
        <p className="text-gray-700 leading-relaxed">
          {status === 'delayed' && "Your payment is taking longer than usual due to a temporary network delay. We're actively working to resolve this and complete your transaction safely."}
          {status === 'resolving' && "Our AI agents are analyzing the transaction flow and implementing automated fixes to complete your payment."}
          {status === 'resolved' && "The transaction has been successfully completed! Your payment has reached the recipient."}
          {status === 'failed' && "We couldn't complete the automatic resolution. Your funds have been safely reversed to your account."}
        </p>
      </motion.div>

      {/* Next Steps Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-4 mt-4 bg-white rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Next Steps</h2>
        </div>
        
        <p className="text-gray-700 leading-relaxed">
          {status === 'delayed' && "We're attempting to complete the transfer or automatically reverse it within 5 minutes. No action needed from you."}
          {status === 'resolving' && "Our AI is working on the issue. You'll be notified once the resolution is complete."}
          {status === 'resolved' && "Transaction completed successfully! You can view the details in your transaction history."}
          {status === 'failed' && "Please try your transaction again or contact support if the issue persists."}
        </p>
      </motion.div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Privacy Notice Modal */}
      <PrivacyNoticeModal
        isVisible={showPrivacyNotice}
        onClose={() => setShowPrivacyNotice(false)}
        onAllow={handleAllowAutoResolution}
        onManual={handleResolveManually}
      />

      {/* Bottom padding for fixed navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default PaymentDelayedScreen;
