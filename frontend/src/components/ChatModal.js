import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader, RotateCcw } from 'lucide-react';
import { agentService } from '../services/agentApi';

const ChatModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your BPI banking assistant. I can help you with transaction issues, floating cash detection, and payment resolution. How can I assist you today?",
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !sessionId) {
      // Initialize chat session when modal opens
      initializeSession();
    }
  }, [isOpen, sessionId]);

  const initializeSession = async () => {
    try {
      const session = await agentService.createSession();
      setSessionId(session.id);
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      // Generate a fallback session ID
      setSessionId(`session_${Date.now()}`);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to host agent
      const response = await agentService.sendMessage(sessionId, inputMessage);
      
      const agentMessage = {
        id: messages.length + 2,
        text: response.message || response,
        sender: 'agent',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error sending message to agent:', error);
      
      // Fallback message if agent is not available
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm having trouble connecting to the banking system. Please ensure the host agent is running on port 8000. You can start it with: `uv run adk web` in the agents/host_agent_adk directory.",
        sender: 'agent',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRestartChat = () => {
    // Reset to initial welcome message
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your BPI banking assistant. I can help you with transaction issues, floating cash detection, and payment resolution. How can I assist you today?",
        sender: 'agent',
        timestamp: new Date()
      }
    ]);
    // Create new session
    setSessionId(null);
    initializeSession();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] md:w-96 max-w-md h-[70vh] md:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ position: 'fixed' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 md:p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm md:text-base">BPI Assistant</h3>
                <p className="text-white/80 text-xs hidden md:block">Powered by SPARK AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={handleRestartChat}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors group"
                title="Restart chat"
              >
                <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' ? 'bg-blue-500' : 'bg-red-500'
                  }`}>
                    {message.sender === 'user' ? 
                      <User className="w-4 h-4 text-white" /> : 
                      <Bot className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : message.isError 
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 px-2">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-center space-x-2 bg-white rounded-2xl px-4 py-3 border border-gray-200">
                  <Loader className="w-4 h-4 text-red-500 animate-spin" />
                  <span className="text-sm text-gray-500">Agent is thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Connected to SPARK Host Agent
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatModal;