import React, { useState, useEffect } from 'react'
import { X, Send, Mail, User, Building, Eye, Edit3, FileText } from 'lucide-react'
import { formatDate } from '../../../utils/formatUtils'

export const SendContractModal = ({ isOpen, onClose, contractData, quotationData, onSend }) => {
    // Calculate totals function
    const calculateTotals = (data) => {
        const items = data?.items || []
        const subtotal = items.reduce((sum, item) => {
            const total = item.total === '' || item.total === null || item.total === undefined ? 0 : Number(item.total) || 0
            return sum + total
        }, 0)

        const taxRate = quotationData?.taxRate || 0
        const taxAmount = (subtotal * taxRate) / 100

        const discountAmount = quotationData?.discount?.enabled
            ? quotationData.discount.type === 'percentage'
                ? (subtotal * quotationData.discount.value) / 100
                : quotationData.discount.value
            : 0

        const grandTotal = subtotal + taxAmount - discountAmount

        return {
            subtotal,
            discountAmount,
            taxAmount,
            grandTotal
        }
    }

    // Generate detailed email content for preview
    const generateDetailedMessage = (contract, quotation) => {
        if (!contract) return '';

        const clientName = quotation?.client?.name || contract?.agreement?.corporationName || 'Valued Client';
        const studioName = quotation?.studio?.name || contract?.agreement?.photographerName || 'Our Studio';
        const totals = calculateTotals(contract);
        const totalAmount = `₹${totals.grandTotal.toFixed(2)}`;
        const agreementDate = contract?.agreement?.agreementDate
            ? new Date(contract.agreement.agreementDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

        let message = `Dear ${clientName},

Thank you for choosing ${studioName} for your photography needs. We're pleased to present you with our service agreement contract.

AGREEMENT DETAILS:
• Agreement Date: ${agreementDate}
• Event: ${contract?.agreement?.eventDescription || quotation?.event?.type || 'Photography Services'}
${contract?.agreement?.duration ? `• Duration: ${contract.agreement.duration}` : ''}
${contract?.agreement?.deliveryDays ? `• Delivery Timeline: ${contract.agreement.deliveryDays} days after event completion` : ''}

`;

        // Add contract items if available
        if (contract?.items && contract.items.length > 0) {
            message += `SERVICES AND ITEMS:\n`;
            contract.items.forEach((item, index) => {
                const itemTotal = item.total ? `₹${item.total.toFixed(2)}` : `₹${((item.rate || 0) * (item.quantity || 1)).toFixed(2)}`;
                message += `• ${item.description || `Item ${index + 1}`} - Quantity: ${item.quantity || 1}, Rate: ₹${item.rate || 0}, Total: ${itemTotal}\n`;
            });
            message += `\n`;
        }

        // Add payment milestones if available
        if (contract?.paymentMilestones && contract.paymentMilestones.length > 0) {
            message += `PAYMENT SCHEDULE:\n`;
            contract.paymentMilestones.forEach((milestone, index) => {
                const amount = milestone.amount ? `₹${milestone.amount.toFixed(2)}` : '₹0.00';
                const dueDate = milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('en-IN') : 'TBD';
                message += `${index + 1}. ${milestone.description || `Milestone ${index + 1}`} - Amount: ${amount}, Due Date: ${dueDate}\n`;
            });
            message += `\n`;
        }

        // Add totals
        message += `CONTRACT SUMMARY:
• Subtotal: ₹${totals.subtotal.toFixed(2)}
${totals.taxAmount > 0 ? `• Tax (${quotation?.taxRate || 0}%): ₹${totals.taxAmount.toFixed(2)}\n` : ''}${totals.discountAmount > 0 ? `• Discount: -₹${totals.discountAmount.toFixed(2)}\n` : ''}• Grand Total: ${totalAmount}

`;

        // Add terms if available
        if (contract?.terms?.customTerms) {
            message += `TERMS & CONDITIONS:\n${contract.terms.customTerms}\n\n`;
        }

        // Add copyright info if available
        if (contract?.copyright) {
            if (contract.copyright.transferCopyright) {
                message += `COPYRIGHT: Copyright will be transferred to the client.\n`;
                if (contract.copyright.imagesDescription) {
                    message += `Images: ${contract.copyright.imagesDescription}\n`;
                }
            } else {
                message += `COPYRIGHT: Copyright remains with the photographer.\n`;
                if (contract.copyright.photoCredit) {
                    message += `Photo Credit: ${contract.copyright.photoCredit}\n`;
                }
                if (contract.copyright.licensingTerms) {
                    message += `Licensing Terms: ${contract.copyright.licensingTerms}\n`;
                }
            }
            message += `\n`;
        }

        // Add disclaimer if available
        if (contract?.disclaimer?.text) {
            message += `DISCLAIMER:\n${contract.disclaimer.text}\n\n`;
        }

        message += `We're committed to providing you with exceptional service and capturing your special moments with the highest quality and professionalism. Please review the attached contract for complete details.

If you have any questions or would like to discuss this contract further, please don't hesitate to contact us.

Best regards,
${studioName}`;

        if (quotation?.studio?.phone || contract?.agreement?.photographerPhone) {
            message += `\n\nPhone: ${quotation?.studio?.phone || contract?.agreement?.photographerPhone}`;
        }
        if (quotation?.studio?.address || contract?.agreement?.photographerAddress) {
            message += `\nAddress: ${quotation?.studio?.address || contract?.agreement?.photographerAddress}`;
        }

        return message;
    };

    const [emailData, setEmailData] = useState({
        recipientEmail: '',
        recipientName: '',
        subject: '',
        message: ''
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isEditingMessage, setIsEditingMessage] = useState(false)

    // Function to render message in template format
    const renderMessageTemplate = (message) => {
        if (!message) return null;

        const lines = message.split('\n');
        const sections = [];
        let currentSection = null;

        lines.forEach((line) => {
            const trimmedLine = line.trim();

            // Check for section headers
            if (trimmedLine.includes('AGREEMENT DETAILS:') ||
                trimmedLine.includes('SERVICES AND ITEMS:') ||
                trimmedLine.includes('PAYMENT SCHEDULE:') ||
                trimmedLine.includes('CONTRACT SUMMARY:') ||
                trimmedLine.includes('TERMS & CONDITIONS:') ||
                trimmedLine.includes('COPYRIGHT:') ||
                trimmedLine.includes('DISCLAIMER:')) {

                if (currentSection) sections.push(currentSection);
                currentSection = {
                    title: trimmedLine.replace(':', ''),
                    content: [],
                    type: 'list'
                };
            } else if (currentSection) {
                if (trimmedLine.startsWith('•') || trimmedLine.match(/^\d+\./)) {
                    currentSection.content.push(trimmedLine);
                } else if (trimmedLine === '') {
                    // Skip empty lines
                } else {
                    // Regular paragraph
                    if (currentSection.type === 'list') {
                        sections.push(currentSection);
                        currentSection = {
                            title: null,
                            content: [trimmedLine],
                            type: 'paragraph'
                        };
                    } else {
                        currentSection.content.push(trimmedLine);
                    }
                }
            } else {
                // Initial greeting or closing
                if (!currentSection) {
                    currentSection = {
                        title: null,
                        content: [trimmedLine],
                        type: 'paragraph'
                    };
                }
            }
        });

        if (currentSection) sections.push(currentSection);

        return (
            <div className="space-y-4 text-sm">
                {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-2">
                        {section.title && (
                            <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-1">
                                {section.title}
                            </h4>
                        )}
                        {section.type === 'list' ? (
                            <ul className="space-y-1 ml-4">
                                {section.content.map((item, itemIndex) => (
                                    <li key={itemIndex} className="text-gray-700">
                                        {item.replace(/^•\s*/, '').replace(/^\d+\.\s*/, '')}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-gray-700 whitespace-pre-line">
                                {section.content.join('\n')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Update email data when contractData changes
    useEffect(() => {
        if (contractData && isOpen) {
            const clientEmail = quotationData?.client?.email || '';
            const clientName = quotationData?.client?.name || contractData?.agreement?.corporationName || '';
            const studioName = quotationData?.studio?.name || contractData?.agreement?.photographerName || 'Our Studio';

            setEmailData({
                recipientEmail: clientEmail,
                recipientName: clientName,
                subject: `Service Agreement Contract from ${studioName}`,
                message: generateDetailedMessage(contractData, quotationData)
            })
        }
    }, [contractData, quotationData, isOpen])

    const handleSend = async () => {
        if (!emailData.recipientEmail || !emailData.recipientName) {
            setError('Please fill in all required fields')
            return
        }

        // Check if client data is available
        if (!quotationData?.client?.email || (!quotationData?.client?.name && !contractData?.agreement?.corporationName)) {
            setError('Client information is not available. Please ensure the contract has client details.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await onSend(emailData)
            onClose()
        } catch (err) {
            setError(err.message || 'Failed to send contract')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Send size={20} />
                        Send Contract to Client
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Client Info Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <User size={16} />
                            Client Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Name:</span>
                                <span className="ml-2 font-medium">
                                    {quotationData?.client?.name || contractData?.agreement?.corporationName || 'Loading...'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">Email:</span>
                                <span className="ml-2 font-medium">{quotationData?.client?.email || 'Loading...'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contract Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                            <FileText size={16} />
                            Contract Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-600">Total Amount:</span>
                                <span className="ml-2 font-semibold text-blue-800">
                                    ₹{calculateTotals(contractData).grandTotal.toFixed(2)}
                                </span>
                            </div>
                            <div>
                                <span className="text-blue-600">Agreement Date:</span>
                                <span className="ml-2 font-medium">
                                    {contractData?.agreement?.agreementDate
                                        ? formatDate(contractData.agreement.agreementDate)
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Email Form */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Recipient Email *
                                </label>
                                <input
                                    type="email"
                                    value={emailData.recipientEmail}
                                    onChange={(e) => setEmailData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                                    placeholder="client@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Recipient Name *
                                </label>
                                <input
                                    type="text"
                                    value={emailData.recipientName}
                                    onChange={(e) => setEmailData(prev => ({ ...prev, recipientName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                                    placeholder="Client Name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={emailData.subject}
                                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                                placeholder="Email subject"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Message Preview
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingMessage(!isEditingMessage)}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    {isEditingMessage ? <Eye size={14} /> : <Edit3 size={14} />}
                                    {isEditingMessage ? 'Preview' : 'Edit'}
                                </button>
                            </div>
                            {isEditingMessage ? (
                                <textarea
                                    value={emailData.message}
                                    onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                                    rows={8}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent resize-vertical font-mono text-sm"
                                    placeholder="Email message"
                                />
                            ) : (
                                <div className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-[200px] max-h-[400px] overflow-y-auto">
                                    {renderMessageTemplate(emailData.message)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={loading || !quotationData?.client?.email || (!quotationData?.client?.name && !contractData?.agreement?.corporationName)}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-dark text-white rounded-md hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail size={16} />
                                Send Contract
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
