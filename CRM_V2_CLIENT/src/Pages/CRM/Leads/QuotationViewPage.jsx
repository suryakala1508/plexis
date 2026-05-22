import React from 'react'
import { useParams } from 'react-router-dom'
import { QuotationPreview } from './components/QuotationPreview'
import { useUser } from '../../../contexts/UserContext'
import { getLeadById } from '../../../services/leadService'
import { getQuotationById, sendQuotation } from '../../../services/quotationService'
import { SendQuotationModal } from './components/SendQuotationModal'
import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'

export const QuotationViewPage = () => {
    const { leadId, quotationId } = useParams()
    const { user, studio } = useUser()
    const [quotationData, setQuotationData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showSendModal, setShowSendModal] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [successMessage, setSuccessMessage] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => {
        const loadQuotation = async () => {
            try {
                // Fetch the actual quotation data
                const quotationResponse = await getQuotationById(quotationId)
                const quotation = quotationResponse.quotation || quotationResponse

                setQuotationData(quotation)
            } catch (err) {
                console.error('Error loading quotation:', err)
                setErrorMessage('Failed to load quotation')
            } finally {
                setLoading(false)
            }
        }

        if (quotationId) {
            loadQuotation()
        }
    }, [quotationId])

    const handleSendToClient = () => {
        setShowSendModal(true)
    }

    const handleSendQuotation = async (emailData) => {
        try {
            setIsSending(true)
            setErrorMessage(null)

            await sendQuotation(quotationId, emailData)

            setShowSendModal(false)
            setSuccessMessage('Quotation sent! The email is on its way to your client.')
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (error) {
            console.error('Error sending quotation:', error)
            setErrorMessage(error.message || 'Failed to send quotation')
            setTimeout(() => setErrorMessage(null), 3000)
        } finally {
            setIsSending(false)
        }
    }

    if (loading || !quotationData) {
        return (
            <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary-dark border-t-transparent mx-auto mb-4'></div>
                    <p className='text-gray-600'>Loading quotation...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Messages */}
            {successMessage && (
                <div className='fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg'>
                    {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className='fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg'>
                    {errorMessage}
                </div>
            )}

            <div className='min-h-screen bg-gray-100 p-8 print:p-0'>
                <div className='max-w-4xl mx-auto bg-white shadow-2xl print:shadow-none'>
                    {/* Header with Send Button */}
                    <div className='p-6 border-b border-gray-200 print:hidden'>
                        <div className='flex justify-between items-center'>
                            <h1 className='text-2xl font-bold text-gray-900'>Quotation Preview</h1>
                            <button
                                onClick={handleSendToClient}
                                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                            >
                                <Send size={16} />
                                Send to Client
                            </button>
                        </div>
                    </div>

                    <QuotationPreview quotationData={quotationData} />
                </div>
            </div>

            {/* Send Quotation Modal */}
            <SendQuotationModal
                isOpen={showSendModal}
                onClose={() => setShowSendModal(false)}
                quotationData={quotationData}
                onSend={handleSendQuotation}
            />
        </>
    )
}

