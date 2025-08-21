import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, AlertCircle, Hash, ChevronRight } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReports();
        // Refresh reports every 30 seconds
        const interval = setInterval(fetchReports, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchReports = async () => {
        try {
            const response = await axios.get('http://localhost:3081/api/messages');
            setReports(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleReportClick = (report) => {
        setSelectedReport(report);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setTimeout(() => setSelectedReport(null), 300);
    };

    // Function to render markdown with table support
    const renderMarkdown = (text) => {
        if (!text) return '';
        
        // First, handle tables
        let html = text;
        
        // Process tables (simple markdown tables)
        const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/gm;
        html = html.replace(tableRegex, (match, header, body) => {
            // Parse header
            const headers = header.split('|').filter(h => h.trim());
            const headerRow = headers.map(h => 
                `<th class="px-4 py-2 bg-gray-100 font-semibold text-left border border-gray-300">${h.trim()}</th>`
            ).join('');
            
            // Parse body rows
            const rows = body.trim().split('\n').map(row => {
                const cells = row.split('|').filter(c => c.trim());
                const cellsHtml = cells.map(c => 
                    `<td class="px-4 py-2 border border-gray-300">${c.trim()}</td>`
                ).join('');
                return `<tr class="hover:bg-gray-50">${cellsHtml}</tr>`;
            }).join('');
            
            return `<div class="overflow-x-auto my-4">
                <table class="min-w-full border-collapse border border-gray-300">
                    <thead><tr>${headerRow}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        });
        
        // Remove standalone table separator lines (that aren't part of a table)
        html = html.replace(/^\|[-:\s|]+\|$/gm, '');
        
        // Process other markdown elements
        html = html
            // Headers (process before other replacements to avoid conflicts)
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-900">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2 text-gray-900">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-3 text-gray-900">$1</h1>')
            // Code blocks (before other inline elements)
            .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-3 rounded-lg my-3 overflow-x-auto font-mono text-sm"><code>$1</code></pre>')
            // Blockquotes
            .replace(/^> (.+)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-700">$1</blockquote>')
            // Bold (must come before italic to handle **text* correctly)
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            // Italic
            .replace(/\*([^*]+?)\*/g, '<em class="italic">$1</em>')
            // Unordered lists
            .replace(/^[\*\-] (.+)/gim, '<li class="ml-4 mb-1 list-disc">$1</li>')
            // Ordered lists
            .replace(/^\d+\. (.+)/gim, '<li class="ml-4 mb-1 list-decimal">$1</li>')
            // Wrap consecutive list items in ul/ol tags
            .replace(/(<li class="ml-4 mb-1 list-disc">.+<\/li>\n?)+/g, '<ul class="my-2">$&</ul>')
            .replace(/(<li class="ml-4 mb-1 list-decimal">.+<\/li>\n?)+/g, '<ol class="my-2">$&</ol>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
            // Horizontal rules
            .replace(/^[\-\*]{3,}$/gim, '<hr class="my-4 border-gray-300">')
            // Line breaks (convert double newlines to paragraphs)
            .replace(/\n\n/g, '</p><p class="mb-3 text-gray-700">')
            // Single line breaks (preserve them)
            .replace(/\n/g, '<br />');
        
        // Wrap in paragraph tags if not already wrapped
        if (!html.startsWith('<')) {
            html = `<p class="mb-3 text-gray-700">${html}</p>`;
        }
        
        // Clean up any empty paragraphs
        html = html.replace(/<p class="mb-3 text-gray-700"><\/p>/g, '');
        
        return html;
    };


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Ops Reports Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Transaction escalation reports from SPARK agents
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                                {reports.length} Reports
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading reports...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-700">{error}</p>
                        <button 
                            onClick={fetchReports}
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-600 mb-2">No Reports Yet</h3>
                        <p className="text-gray-500">Escalation reports will appear here when agents detect issues.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports.map((report, index) => (
                            <motion.div
                                key={report.message_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                onClick={() => handleReportClick(report)}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-red-600" />
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <Hash className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-500">Message ID</span>
                                            <span className="text-sm font-mono font-semibold text-gray-900">
                                                {report.message_id}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-500">Transaction</span>
                                        </div>
                                        <p className="text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded break-all">
                                            {report.transaction_id || 'N/A'}
                                        </p>
                                        
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <span className="text-xs text-gray-500">Click to view report details</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Report Modal */}
            <AnimatePresence>
                {modalOpen && selectedReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-white">
                                        <h2 className="text-xl font-bold">Escalation Report</h2>
                                        <div className="flex items-center space-x-4 mt-2 text-sm text-red-100">
                                            <span>Message #{selectedReport.message_id}</span>
                                            {selectedReport.transaction_id && (
                                                <>
                                                    <span>•</span>
                                                    <span>Transaction: {selectedReport.transaction_id.substring(0, 8)}...</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto max-h-[65vh]">
                                <div className="prose prose-sm max-w-none">
                                    {selectedReport.report ? (
                                        <div 
                                            className="markdown-content"
                                            dangerouslySetInnerHTML={{ 
                                                __html: renderMarkdown(selectedReport.report) 
                                            }}
                                        />
                                    ) : (
                                        <p className="text-gray-500 italic">No report content available</p>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;