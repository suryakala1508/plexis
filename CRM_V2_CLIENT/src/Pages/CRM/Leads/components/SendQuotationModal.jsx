import React, { useState, useEffect } from 'react'
import { X, Send, Mail, User, Building, Eye, Edit3, FileText, Calendar, MapPin, Users, CreditCard } from 'lucide-react'
import { LoadingSpinner } from '../../../../Components/Loading'
import { formatIndianCurrency, formatDate } from '../../../../utils/formatUtils'

export const SendQuotationModal = ({ isOpen, onClose, quotationData, onSend }) => {
    // Calculate totals function
    const calculateTotals = (data) => {
        const subtotal = data.items?.reduce((sum, item) => {
            const amount = item.amount === '' || item.amount === null || item.amount === undefined ? (item.total || 0) : Number(item.amount) || 0
            return sum + amount
        }, 0) || 0

        const taxRate = data.taxRate === '' || data.taxRate === null || data.taxRate === undefined ? 0 : Number(data.taxRate) || 0
        const taxAmount = (subtotal * taxRate) / 100

        const discountValue = data.discount?.value === '' || data.discount?.value === null || data.discount?.value === undefined ? 0 : Number(data.discount?.value) || 0
        const discountAmount = data.discount?.enabled
            ? data.discount?.type === 'percentage'
                ? (subtotal * discountValue) / 100
                : discountValue
            : 0

        const grandTotal = subtotal + taxAmount - discountAmount

        return {
            subtotal,
            discountAmount,
            taxAmount,
            grandTotal
        }
    }
    // Generate detailed email content for preview (structured text)
    const generateDetailedMessage = (data) => {
        if (!data) return '';

        const clientName = data?.client?.name || 'Valued Client';
        const studioName = data?.studio?.name || 'Our Studio';
        const totals = calculateTotals(data);
        const totalAmount = formatIndianCurrency(totals.grandTotal);
        const dueDate = data?.dueDate ? new Date(data.dueDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'N/A';

        let message = `Dear ${clientName},

Thank you for considering ${studioName} for your photography needs. We're excited to present you with our professional quotation for your upcoming event.

`;

        // Add event details if available
        if (data?.event?.type) {
            message += `EVENT DETAILS:\n`;
            message += `• Event Type: ${data.event.type}\n`;
            if (data.event.date) message += `• Date: ${formatDate(data.event.date)}\n`;
            if (data.event.time) message += `• Time: ${data.event.time}\n`;
            if (data.event.location) message += `• Location: ${data.event.location}\n`;
            message += `\n`;
        }

        // Add quotation items if available
        if (data?.items && data.items.length > 0) {
            message += `QUOTATION BREAKDOWN:\n`;
            data.items.forEach((item, index) => {
                const amount = item.amount || item.total || 0;
                const itemTotal = formatIndianCurrency(amount);
                message += `${index + 1}. ${item.event || item.description || 'Service'}\n`;
                message += `   Total: ${itemTotal}\n`;
            });
            message += `\n`;
        }

        // Add payment milestones if available
        if (data?.paymentMilestones && data.paymentMilestones.length > 0) {
            message += `PAYMENT SCHEDULE:\n`;
            data.paymentMilestones.forEach((milestone, index) => {
                const amount = milestone.amount ? formatIndianCurrency(milestone.amount) : '₹0.00';
                const dueDate = milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('en-IN') : 'TBD';
                message += `${index + 1}. ${milestone.description} - ${amount} (Due: ${dueDate})\n`;
            });
            message += `\n`;
        }

        // Add totals
        if (data?.items && data.items.length > 0) {
            message += `QUOTATION SUMMARY:
• Subtotal: ${formatIndianCurrency(totals.subtotal)}
• Tax (${data?.taxRate || 0}%): ${formatIndianCurrency(totals.taxAmount)}`;

            if (totals.discountAmount > 0) {
                message += `\n• Discount: -${formatIndianCurrency(totals.discountAmount)}`;
            }

            message += `\n• Grand Total: ${totalAmount}
• Valid Until: ${dueDate}

`;
        } else {
            message += `QUOTATION SUMMARY:
• Total Amount: ${totalAmount}
• Valid Until: ${dueDate}

`;
        }

        // Add complimentary if available
        if (data?.complimentary && data.complimentary.length > 0) {
            message += `COMPLIMENTARY:\n`;
            data.complimentary.forEach((item, index) => {
                const desc = typeof item === 'string' ? item : (item.description || item.name || '');
                const qty = item.quantity || 1;
                message += `${index + 1}. ${desc} (Qty: ${qty})\n`;
            });
            message += `\n`;
        }

        // Add notes and terms if available
        if (data?.notes) {
            message += `ADDITIONAL NOTES:
${data.notes}

`;
        }

        if (data?.termsAndConditions) {
            message += `TERMS & CONDITIONS:
${data.termsAndConditions}

`;
        }

        // Add payment methods if available
        if (data?.paymentMethods) {
            const methods = [];
            if (data.paymentMethods.creditCards) methods.push('Credit Cards');
            if (data.paymentMethods.bankTransfer) methods.push('Bank Transfer');
            if (data.paymentMethods.cashOrCheck) methods.push('Cash/Check');

            if (methods.length > 0) {
                message += `ACCEPTED PAYMENT METHODS:
${methods.join(', ')}

`;
            }
        }

        message += `We're committed to capturing your special moments with the highest quality and professionalism. Please review the attached quotation for complete details.

If you have any questions or would like to discuss this quotation further, please don't hesitate to contact us. We're here to make your event unforgettable!

Best regards,
${studioName}`;

        if (data?.studio?.phone) {
            message += `\nPhone: ${data.studio.phone}`;
        }
        if (data?.studio?.address) {
            message += `\nAddress: ${data.studio.address}`;
        }

        return message;
    };

    // Generate HTML email content for Gmail
    const generateHtmlEmail = (data) => {
        if (!data) return '';

        const clientName = data?.client?.name || 'Valued Client';
        const studioName = data?.studio?.name || 'Our Studio';
        const totals = calculateTotals(data);
        const totalAmount = formatIndianCurrency(totals.grandTotal);
        const dueDate = data?.dueDate ? new Date(data.dueDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'N/A';

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photography Quotation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #007bff; margin: 0; font-size: 28px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #007bff; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; }
        .event-details, .quotation-summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
        .quotation-table { width: 100%; border-collapse: collapse;margin: 15px 0; }
        .quotation-table th, .quotation-table td { padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .quotation-table th { background-color: #007bff; color: white; }
        .total-row { font-weight: bold; background-color: #e9ecef; }
        .payment-schedule { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
        .payment-item { margin-bottom: 8px; padding: 8px; background-color: white; border-radius: 3px; }
        .notes, .terms { background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; }
        .payment-methods { background-color: #d1ecf1; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8; }
        .closing { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; }
        .signature { margin-top: 20px; font-style: italic; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Photography Quotation</h1>
        </div>

        <div class="greeting">
            Dear ${clientName},<br><br>
            Thank you for considering ${studioName} for your photography needs. We're excited to present you with our professional quotation for your upcoming event.
        </div>`;

        // Add event details if available
        html += `
        <div class="section">
            <h2>Event Details</h2>
            <div class="event-details">
                <strong>Event Type:</strong> ${data.event.type}<br>`;
        if (data.event.date) html += `<strong>Date:</strong> ${formatDate(data.event.date)}<br>`;
        if (data.event.time) html += `<strong>Time:</strong> ${data.event.time}<br>`;
        if (data.event.location) html += `<strong>Location:</strong> ${data.event.location}<br>`;
        html += `
            </div>
        </div>`;

        // Add quotation items if available
        if (data?.items && data.items.length > 0) {
            html += `
        <div class="section">
            <h2>Quotation Breakdown</h2>
            <table class="quotation-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>`;

            data.items.forEach((item, index) => {
                const amount = item.amount || item.total || 0;
                const itemTotal = formatIndianCurrency(amount);
                html += `
                    <tr>
                        <td>${item.event || item.description || 'Service'}</td>
                        <td>${itemTotal}</td>
                    </tr>`;
            });

            html += `
                </tbody>
            </table>
        </div>`;
        }

        // Add payment milestones if available
        if (data?.paymentMilestones && data.paymentMilestones.length > 0) {
            html += `
        <div class="section">
            <h2>Payment Schedule</h2>
            <div class="payment-schedule">`;

            data.paymentMilestones.forEach((milestone, index) => {
                const amount = milestone.amount ? formatIndianCurrency(milestone.amount) : '₹0.00';
                const dueDate = milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('en-IN') : 'TBD';
                html += `
                <div class="payment-item">
                    <strong>${index + 1}. ${milestone.description}</strong><br>
                    Amount: ${amount} | Due Date: ${dueDate}
                </div>`;
            });

            html += `
            </div>
        </div>`;
        }

        // Add complimentary if available
        if (data?.complimentary && data.complimentary.length > 0) {
            html += `
        <div class="section">
            <h2>Complimentary</h2>
            <table class="quotation-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">#</th>
                        <th>Item</th>
                        <th style="width: 80px; text-align: center;">Qty</th>
                    </tr>
                </thead>
                <tbody>`;
            data.complimentary.forEach((item, index) => {
                const desc = typeof item === 'string' ? item : (item.description || item.name || '');
                const qty = item.quantity || 1;
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${desc}</td>
                        <td style="text-align: center;">${qty}</td>
                    </tr>`;
            });
            html += `
                </tbody>
            </table>
        </div>`;
        }

        // Add totals
        html += `
        <div class="section">
            <h2>Quotation Summary</h2>
            <div class="quotation-summary">
                <strong>Subtotal:</strong> ${formatIndianCurrency(totals.subtotal)}<br>`;

        if (data?.taxRate > 0) {
            html += `<strong>Tax (${data.taxRate}%):</strong> ${formatIndianCurrency(totals.taxAmount)}<br>`;
        }

        if (totals.discountAmount > 0) {
            html += `<strong>Discount:</strong> -${formatIndianCurrency(totals.discountAmount)}<br>`;
        }

        html += `
                <strong>Grand Total:</strong> ${totalAmount}<br>
                <strong>Valid Until:</strong> ${dueDate}
            </div>
        </div>`;

        // Add notes and terms if available
        if (data?.notes) {
            html += `
        <div class="section">
            <h2>Additional Notes</h2>
            <div class="notes">
                ${data.notes.replace(/\n/g, '<br>')}
            </div>
        </div>`;
        }

        if (data?.termsAndConditions) {
            html += `
        <div class="section">
            <h2>Terms & Conditions</h2>
            <div class="terms">
                ${data.termsAndConditions.replace(/\n/g, '<br>')}
            </div>
        </div>`;
        }

        // Add payment methods if available
        if (data?.paymentMethods) {
            const methods = [];
            if (data.paymentMethods.creditCards) methods.push('Credit Cards');
            if (data.paymentMethods.bankTransfer) methods.push('Bank Transfer');
            if (data.paymentMethods.cashOrCheck) methods.push('Cash/Check');

            if (methods.length > 0) {
                html += `
        <div class="section">
            <h2>Accepted Payment Methods</h2>
            <div class="payment-methods">
                ${methods.join(', ')}
            </div>
        </div>`;
            }
        }

        html += `
        <div class="closing">
            We're committed to capturing your special moments with the highest quality and professionalism. Please review the attached quotation for complete details.<br><br>
            If you have any questions or would like to discuss this quotation further, please don't hesitate to contact us. We're here to make your event unforgettable!
        </div>

        <div class="signature">
            Best regards,<br>
            ${studioName}`;

        if (data?.studio?.phone) {
            html += `<br><br><div class="contact-info">Phone: ${data.studio.phone}</div>`;
        }
        if (data?.studio?.address) {
            html += `<div class="contact-info">Address: ${data.studio.address}</div>`;
        }

        html += `
        </div>
    </div>
</body>
</html>`;

        return html;
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

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // Check for section headers
            if (trimmedLine.includes('EVENT DETAILS:') ||
                trimmedLine.includes('QUOTATION BREAKDOWN:') ||
                trimmedLine.includes('PAYMENT SCHEDULE:') ||
                trimmedLine.includes('QUOTATION SUMMARY:') ||
                trimmedLine.includes('ADDITIONAL NOTES:') ||
                trimmedLine.includes('TERMS & CONDITIONS:') ||
                trimmedLine.includes('ACCEPTED PAYMENT METHODS:')) {

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

    // Update email data when quotationData changes
    useEffect(() => {
        if (quotationData && isOpen) {
            const clientEmail = quotationData?.client?.email || quotationData?.leadId?.email || '';
            const clientName = quotationData?.client?.name || quotationData?.leadId?.name || '';
            const studioName = quotationData?.studio?.name || 'Our Studio';

            setEmailData({
                recipientEmail: clientEmail,
                recipientName: clientName,
                subject: `Photography Quotation from ${studioName}`,
                message: generateDetailedMessage(quotationData)
            })
        }
    }, [quotationData, isOpen])

    const handleSend = async () => {
        setError(null)

        if (!emailData.recipientEmail || !emailData.recipientName) {
            setError('Please fill in all required fields')
            return
        }

        // Check if client data is available locally
        const effectiveEmail = emailData.recipientEmail;
        const effectiveName = emailData.recipientName;

        if (!effectiveEmail || !effectiveName) {
            setError('Recipient information is incomplete. Please ensure both name and email are filled.')
            return
        }

        setLoading(true)

        try {
            // Prepare email data with HTML content for Gmail
            const emailDataWithHtml = {
                ...emailData,
                htmlMessage: generateHtmlEmail(quotationData)
            }
            await onSend(emailDataWithHtml)
            // No need to onClose() here if onSend does navigation, but it's safer to let it be handled by parent or here if successful
            // However, looking at QuotationViewPage, it closes the modal after await sendQuotation.
        } catch (err) {
            console.error('Error in handleSend:', err);
            setError(err.message || 'Failed to send quotation')
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
                        Send Quotation to Client
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
                                <span className="ml-2 font-medium">{quotationData?.client?.name || 'Loading...'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Email:</span>
                                <span className="ml-2 font-medium">{quotationData?.client?.email || 'Loading...'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quotation Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                            <Building size={16} />
                            Quotation Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-600">Total Amount:</span>
                                <span className="ml-2 font-semibold text-blue-800">
                                    {formatIndianCurrency(calculateTotals(quotationData).grandTotal)}
                                </span>
                            </div>
                            <div>
                                <span className="text-blue-600">Valid Until:</span>
                                <span className="ml-2 font-medium">
                                    {quotationData?.dueDate ? formatDate(quotationData.dueDate) : 'N/A'}
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
                        disabled={loading || !emailData.recipientEmail || !emailData.recipientName}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-dark text-white rounded-md hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="sm" color="white" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail size={16} />
                                Send Quotation
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}