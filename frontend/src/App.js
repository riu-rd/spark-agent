import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import AddMoney from './pages/AddMoney';
import PaymentDelayedScreen from './pages/PaymentDelayedScreen';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import FloatingChatButton from './components/FloatingChatButton';
import ChatModal from './components/ChatModal';

function AppContent() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  // Don't show chat on dashboard
  const showChat = location.pathname !== '/dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/add-money" element={<AddMoney />} />
        <Route path="/payment-delayed" element={<PaymentDelayedScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Floating Chat Button - Hidden on dashboard */}
      {showChat && (
        <FloatingChatButton 
          onClick={toggleChat}
          hasNewMessage={false}
          isOpen={isChatOpen}
        />
      )}
      
      {/* Chat Modal - Hidden on dashboard */}
      {showChat && (
        <ChatModal 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
        
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
