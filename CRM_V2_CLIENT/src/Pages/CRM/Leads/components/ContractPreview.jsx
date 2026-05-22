import React from 'react'
import { formatIndianCurrency } from '../../../../utils/formatUtils'

export const ContractPreview = ({ contractData, quotationData }) => {
    const { agreement, terms, copyright, disclaimer, items, paymentMilestones } = contractData

    // Use contract items if available, otherwise fall back to quotation items
    const displayItems = items && items.length > 0 ? items : (quotationData?.items || [])
    const displayPaymentMilestones = paymentMilestones && paymentMilestones.length > 0 ? paymentMilestones : (quotationData?.paymentMilestones || [])

    // Helper to safely format dates
    const safeFormatDate = (dVal, options = { year: 'numeric', month: 'long', day: 'numeric' }) => {
        if (!dVal) return '_____________'
        const d = new Date(dVal)
        return isNaN(d.getTime()) ? '_____________' : d.toLocaleDateString('en-US', options)
    }

    // Calculate totals from items
    const calculateTotals = () => {
        if (!displayItems || displayItems.length === 0) {
            return { subtotal: 0, tax: 0, discount: 0, total: 0 }
        }

        const subtotal = displayItems.reduce((sum, item) => {
            // Support both quotation-style items (amount) and contract-style items (rate × quantity)
            const itemTotal = Number(item.amount) || Number(item.total) || ((Number(item.rate) || 0) * (Number(item.quantity) || 1))
            return sum + itemTotal
        }, 0)
        const taxRate = quotationData?.taxRate || 0
        const tax = (subtotal * taxRate) / 100
        const discount = quotationData?.discount?.enabled
            ? quotationData.discount.type === 'percentage'
                ? (subtotal * quotationData.discount.value) / 100
                : quotationData.discount.value
            : 0
        const total = subtotal + tax - discount

        return { subtotal, tax, discount, total }
    }

    const totals = calculateTotals()

    return (
        <div className='min-h-full bg-white p-4 md:p-8 print:p-0' style={{ backgroundColor: '#ffffff' }}>
            <div className='max-w-4xl mx-auto bg-white print:shadow-none' style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#000000',
                backgroundColor: '#ffffff'
            }}>
                {/* Header - Formal Word Document Style */}
                <div className='p-4 md:p-8 border-b-2 border-black' style={{ borderColor: '#000000' }}>
                    <div className='text-center mb-6'>
                        {quotationData?.studio?.logo && (
                            <img
                                src={quotationData.studio.logo}
                                alt={quotationData.studio.name || 'Studio'}
                                className='h-20 w-20 object-contain mx-auto mb-4'
                                style={{ filter: 'grayscale(100%)' }}
                            />
                        )}
                        <h1 className='text-3xl font-bold mb-2' style={{
                            color: '#000000',
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}>
                            {quotationData?.studio?.name || agreement.photographerName || 'Studio Name'}
                        </h1>
                        {(quotationData?.studio?.address || agreement.photographerAddress) && (
                            <p className='text-sm mb-1' style={{ color: '#000000' }}>
                                {quotationData?.studio?.address || agreement.photographerAddress}
                            </p>
                        )}
                        {quotationData?.studio?.phone && (
                            <p className='text-sm mb-1' style={{ color: '#000000' }}>
                                {quotationData.studio.phone}
                            </p>
                        )}
                        {quotationData?.studio?.gstNumber && (
                            <p className='text-sm' style={{ color: '#000000' }}>
                                GSTIN: {quotationData.studio.gstNumber}
                            </p>
                        )}
                    </div>
                    <div className='text-center mt-6'>
                        <h2 className='text-2xl font-bold' style={{
                            color: '#000000',
                            letterSpacing: '3px',
                            textTransform: 'uppercase'
                        }}>
                            Service Agreement Contract
                        </h2>
                    </div>
                </div>

                {/* Studio & Client Info - Formal Word Document Style */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 p-4 md:p-8 border-b-2 border-black' style={{ borderColor: '#000000' }}>
                    {/* Studio Details */}
                    <div>
                        <h3 className='text-xs font-bold uppercase mb-4' style={{
                            color: '#000000',
                            letterSpacing: '1px'
                        }}>
                            Service Provider
                        </h3>
                        <div className='space-y-2'>
                            <p className='font-bold text-base' style={{ color: '#000000' }}>
                                {quotationData?.studio?.name || agreement.photographerName || 'Studio Name'}
                            </p>
                            {(quotationData?.studio?.address || agreement.photographerAddress) && (
                                <p className='text-sm leading-relaxed' style={{ color: '#000000' }}>
                                    {quotationData?.studio?.address || agreement.photographerAddress}
                                </p>
                            )}
                            {quotationData?.studio?.phone && (
                                <p className='text-sm' style={{ color: '#000000' }}>
                                    {quotationData.studio.phone}
                                </p>
                            )}
                            {quotationData?.studio?.gstNumber && (
                                <p className='text-sm' style={{ color: '#000000' }}>
                                    GSTIN: {quotationData.studio.gstNumber}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Client Details */}
                    <div>
                        <h3 className='text-xs font-bold uppercase mb-4' style={{
                            color: '#000000',
                            letterSpacing: '1px'
                        }}>
                            Client
                        </h3>
                        <div className='space-y-2'>
                            <p className='font-bold text-base' style={{ color: '#000000' }}>
                                {quotationData?.client?.name || agreement.corporationName || 'Client Name'}
                            </p>
                            {(quotationData?.client?.address || agreement.corporationAddress) && (
                                <p className='text-sm leading-relaxed' style={{ color: '#000000' }}>
                                    {quotationData?.client?.address || agreement.corporationAddress}
                                </p>
                            )}
                            {(quotationData?.client?.email || agreement.clientEmail) && (
                                <p className='text-sm' style={{ color: '#000000' }}>
                                    {quotationData?.client?.email || agreement.clientEmail}
                                </p>
                            )}
                            {(quotationData?.client?.phone || agreement.clientPhone) && (
                                <p className='text-sm' style={{ color: '#000000' }}>
                                    {quotationData?.client?.phone || agreement.clientPhone}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Agreement Details - Formal Word Document Style */}
                <div className='p-4 md:p-8'>
                    <div className='mb-8'>
                        <p className='text-sm leading-relaxed mb-4' style={{
                            color: '#000000',
                            textAlign: 'justify',
                            lineHeight: '1.8'
                        }}>
                            This Agreement is made this <span className='font-semibold'>{safeFormatDate(agreement.agreementDate)}</span> between{' '}
                            <span className='font-semibold'>{quotationData?.client?.name || agreement.corporationName || '_____________'}</span>,{' '}
                            {(quotationData?.client?.address || agreement.corporationAddress) && <span>located at <span className='font-semibold'>{quotationData?.client?.address || agreement.corporationAddress}</span>, </span>}
                            (the "Client"), and{' '}
                            <span className='font-semibold'>{quotationData?.studio?.name || agreement.photographerName || '_____________'}</span>,{' '}
                            {(quotationData?.studio?.address || agreement.photographerAddress) && <span>located at <span className='font-semibold'>{quotationData?.studio?.address || agreement.photographerAddress}</span>, </span>}
                            (the "Service Provider").
                        </p>
                        {(agreement.eventDescription || quotationData?.event?.type) && (
                            <p className='text-sm leading-relaxed mb-4' style={{
                                color: '#000000',
                                textAlign: 'justify',
                                lineHeight: '1.8'
                            }}>
                                This Agreement pertains to the following event: <span className='font-semibold'>{agreement.eventDescription || quotationData?.event?.type || '_____________'}</span>
                            </p>
                        )}
                        {quotationData?.event?.date && (
                            <p className='text-sm leading-relaxed mb-4' style={{
                                color: '#000000',
                                textAlign: 'justify',
                                lineHeight: '1.8'
                            }}>
                                Event Date: <span className='font-semibold'>{safeFormatDate(quotationData.event.date)}</span>
                                {quotationData.event.location && <span>, Location: <span className='font-semibold'>{quotationData.event.location}</span></span>}
                            </p>
                        )}
                        {agreement.duration && (
                            <p className='text-sm leading-relaxed mb-4' style={{
                                color: '#000000',
                                textAlign: 'justify',
                                lineHeight: '1.8'
                            }}>
                                This Agreement is for the following length of time: <span className='font-semibold'>{agreement.duration}</span>
                            </p>
                        )}
                        {agreement.deliveryDays && (
                            <p className='text-sm leading-relaxed mb-4' style={{
                                color: '#000000',
                                textAlign: 'justify',
                                lineHeight: '1.8'
                            }}>
                                Photographs shall be delivered within <span className='font-semibold'>{agreement.deliveryDays}</span> days of event completion.
                            </p>
                        )}
                        <p className='text-sm leading-relaxed mb-6' style={{
                            color: '#000000',
                            textAlign: 'justify',
                            lineHeight: '1.8'
                        }}>
                            The Client and the Service Provider hereby agree to the following terms:
                        </p>
                    </div>

                    {/* Terms Section - Formal Word Document Style */}
                    <div className='mb-8'>
                        <h3 className='text-base font-bold uppercase mb-4' style={{
                            color: '#000000',
                            letterSpacing: '1px',
                            borderBottom: '1px solid #000000',
                            paddingBottom: '8px'
                        }}>
                            Terms and Conditions
                        </h3>
                        {terms.customTerms || quotationData?.termsAndConditions ? (
                            <div className='text-sm leading-relaxed' style={{
                                color: '#000000',
                                textAlign: 'justify',
                                lineHeight: '1.8'
                            }}>
                                {(terms.customTerms || quotationData.termsAndConditions || '').split('\n').map((line, index) => {
                                    // Check if line starts with bullet point or number
                                    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')
                                    const isNumbered = /^\d+[\.\)]\s/.test(line.trim())

                                    if (isBullet || isNumbered) {
                                        return (
                                            <p key={index} className='mb-3 ml-6' style={{ color: '#000000' }}>
                                                {line}
                                            </p>
                                        )
                                    } else if (line.trim()) {
                                        return (
                                            <p key={index} className='mb-3' style={{ color: '#000000' }}>
                                                {line}
                                            </p>
                                        )
                                    } else {
                                        return <br key={index} />
                                    }
                                })}
                            </div>
                        ) : (
                            <p className='text-sm leading-relaxed italic' style={{ color: '#666666' }}>
                                Terms and conditions will appear here once added.
                            </p>
                        )}
                    </div>

                    {/* Items - Formal Word Document Style */}
                    {displayItems && displayItems.length > 0 && (
                        <div className='mb-8 border-t-2 border-black pt-6' style={{ borderColor: '#000000' }}>
                            <h3 className='text-base font-bold uppercase mb-4' style={{
                                color: '#000000',
                                letterSpacing: '1px',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '8px'
                            }}>
                                Services and Items
                            </h3>
                            <div className='space-y-4 mb-6'>
                                {displayItems.map((item, index) => {
                                    // Support both quotation-style items (amount) and contract-style items
                                    const itemTotal = Number(item.amount) || Number(item.total) || ((Number(item.rate) || 0) * (Number(item.quantity) || 1))
                                    const description = item.event || item.description || item.name || `Item ${index + 1}`
                                    return (
                                        <div key={index} className='flex justify-between items-start pb-3 border-b border-black' style={{ borderColor: '#000000' }}>
                                            <div className='flex-1'>
                                                <p className='font-semibold mb-1' style={{ color: '#000000' }}>
                                                    {description}
                                                </p>
                                                {/* Quotation-style: show date & location */}
                                                {(item.date || item.location) && (
                                                    <p className='text-xs mt-0.5' style={{ color: '#555555' }}>
                                                        {item.date && safeFormatDate(item.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        {item.date && item.location && ' · '}
                                                        {item.location}
                                                    </p>
                                                )}
                                                {/* Contract-style: show qty & rate */}
                                                {(item.rate !== undefined || item.quantity !== undefined) && (
                                                    <div className='flex gap-6 mt-1 text-sm' style={{ color: '#000000' }}>
                                                        {item.quantity !== undefined && <span>Quantity: {item.quantity || 1}</span>}
                                                        {item.rate !== undefined && <span>Rate: {formatIndianCurrency(item.rate || 0)}</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className='text-right'>
                                                <p className='font-semibold' style={{ color: '#000000' }}>
                                                    {formatIndianCurrency(itemTotal)}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {totals.total > 0 && (
                                <div className='border-t-2 border-black pt-4 mt-4' style={{ borderColor: '#000000' }}>
                                    <div className='flex justify-between text-sm mb-2' style={{ color: '#000000' }}>
                                        <span>Subtotal:</span>
                                        <span className='font-semibold'>{formatIndianCurrency(totals.subtotal)}</span>
                                    </div>
                                    {totals.tax > 0 && (
                                        <div className='flex justify-between text-sm mb-2' style={{ color: '#000000' }}>
                                            <span>Tax ({quotationData?.taxRate || 0}%):</span>
                                            <span className='font-semibold'>{formatIndianCurrency(totals.tax)}</span>
                                        </div>
                                    )}
                                    {totals.discount > 0 && (
                                        <div className='flex justify-between text-sm mb-2' style={{ color: '#000000' }}>
                                            <span>Discount:</span>
                                            <span className='font-semibold'>-{formatIndianCurrency(totals.discount)}</span>
                                        </div>
                                    )}
                                    <div className='flex justify-between text-base font-bold mt-4 pt-4 border-t-2 border-black' style={{
                                        borderColor: '#000000',
                                        color: '#000000'
                                    }}>
                                        <span>Grand Total:</span>
                                        <span>{formatIndianCurrency(totals.total)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payment Timeline - Formal Word Document Style */}
                    {displayPaymentMilestones && displayPaymentMilestones.length > 0 && (
                        <div className='mb-8 border-t-2 border-black pt-6' style={{ borderColor: '#000000' }}>
                            <h3 className='text-base font-bold uppercase mb-4' style={{
                                color: '#000000',
                                letterSpacing: '1px',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '8px'
                            }}>
                                Payment Schedule
                            </h3>
                            <div className='space-y-4'>
                                {displayPaymentMilestones.map((milestone, index) => (
                                    <div key={index} className='flex justify-between items-center pb-3 border-b border-black' style={{ borderColor: '#000000' }}>
                                        <div>
                                            <p className='font-semibold mb-1' style={{ color: '#000000' }}>
                                                {milestone.description || `Payment Milestone ${index + 1}`}
                                            </p>
                                            {milestone.dueDate && (
                                                <p className='text-sm mt-1' style={{ color: '#000000' }}>
                                                    Due Date: {safeFormatDate(milestone.dueDate)}
                                                </p>
                                            )}
                                        </div>
                                        {milestone.amount > 0 && (
                                            <p className='font-semibold' style={{ color: '#000000' }}>
                                                {formatIndianCurrency(milestone.amount)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes - Formal Word Document Style */}
                    {quotationData?.notes && (
                        <div className='mb-8 border-t-2 border-black pt-6' style={{ borderColor: '#000000' }}>
                            <h3 className='text-base font-bold uppercase mb-3' style={{
                                color: '#000000',
                                letterSpacing: '1px',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '8px'
                            }}>
                                Additional Notes
                            </h3>
                            <p className='text-sm whitespace-pre-wrap leading-relaxed' style={{
                                color: '#000000',
                                textAlign: 'justify',
                                lineHeight: '1.8'
                            }}>
                                {quotationData.notes}
                            </p>
                        </div>
                    )}

                    {/* Copyright License Details - Formal Word Document Style */}
                    {copyright.transferCopyright ? (
                        <div className='mb-8 border-t-2 border-black pt-6' style={{ borderColor: '#000000' }}>
                            <h3 className='text-base font-bold uppercase mb-4' style={{
                                color: '#000000',
                                letterSpacing: '1px',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '8px'
                            }}>
                                Copyright and Licensing
                            </h3>
                            <p className='text-sm leading-relaxed mb-4' style={{
                                color: '#000000',
                                textAlign: 'justify',
                                lineHeight: '1.8'
                            }}>
                                The Service Provider agrees to transfer the copyrights of images as described below to the Client.
                            </p>
                            <div className='ml-6 mb-4'>
                                <p className='text-sm leading-relaxed mb-2' style={{
                                    color: '#000000',
                                    textAlign: 'justify',
                                    lineHeight: '1.8'
                                }}>
                                    1. The image(s) subject to this agreement are as follows: <span className='font-semibold'>{copyright.imagesDescription || '_____________'}</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        copyright.photoCredit || copyright.licensingTerms ? (
                            <div className='mb-8 border-t-2 border-black pt-6' style={{ borderColor: '#000000' }}>
                                <h3 className='text-base font-bold uppercase mb-4' style={{
                                    color: '#000000',
                                    letterSpacing: '1px',
                                    borderBottom: '1px solid #000000',
                                    paddingBottom: '8px'
                                }}>
                                    Copyright and Licensing
                                </h3>
                                <p className='text-sm leading-relaxed mb-4' style={{
                                    color: '#000000',
                                    textAlign: 'justify',
                                    lineHeight: '1.8'
                                }}>
                                    The Service Provider and the Client agree to the following licensing terms:
                                </p>
                                <ul className='list-disc list-inside space-y-3 text-sm leading-relaxed ml-6' style={{
                                    color: '#000000',
                                    lineHeight: '1.8'
                                }}>
                                    <li>
                                        The Service Provider retains all rights to each image. The Service Provider also retains all rights not expressed in the agreement including advertising rights.
                                    </li>
                                    {copyright.photoCredit && (
                                        <li>
                                            The Client agrees to give the Service Provider proper photo credit on each reprint as follows: <span className='font-semibold'>{copyright.photoCredit}</span>
                                        </li>
                                    )}
                                </ul>
                                {copyright.licensingTerms && (
                                    <div className='mt-4 ml-6'>
                                        <p className='text-sm leading-relaxed' style={{
                                            color: '#000000',
                                            textAlign: 'justify',
                                            lineHeight: '1.8'
                                        }}>
                                            {copyright.licensingTerms}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : null
                    )}

                    {/* Disclaimer - Formal Word Document Style */}
                    {disclaimer.text && (
                        <div className='mb-8 border-t-2 border-black pt-6' style={{ borderColor: '#000000' }}>
                            <h3 className='text-base font-bold uppercase mb-3' style={{
                                color: '#000000',
                                letterSpacing: '1px',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '8px'
                            }}>
                                Disclaimer
                            </h3>
                            <p className='text-xs leading-relaxed italic' style={{
                                color: '#000000',
                                textAlign: 'justify',
                                lineHeight: '1.8'
                            }}>
                                {disclaimer.text}
                            </p>
                        </div>
                    )}

                    {/* Signature Section - Formal Word Document Style */}
                    <div className='mt-12 md:mt-16 border-t-2 border-black pt-8' style={{ borderColor: '#000000' }}>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16'>
                            <div>
                                <p className='text-sm font-bold uppercase mb-3' style={{
                                    color: '#000000',
                                    letterSpacing: '1px'
                                }}>
                                    Client Signature
                                </p>
                                <div className='border-b-2 border-black mb-3 h-16' style={{ borderColor: '#000000' }}></div>
                                <p className='text-xs mb-1' style={{ color: '#000000' }}>
                                    {quotationData?.client?.name || agreement.corporationName || 'Client Name'}
                                </p>
                                <p className='text-xs' style={{ color: '#000000' }}>
                                    Date: _____________
                                </p>
                            </div>
                            <div>
                                <p className='text-sm font-bold uppercase mb-3' style={{
                                    color: '#000000',
                                    letterSpacing: '1px'
                                }}>
                                    Service Provider Signature
                                </p>
                                <div className='border-b-2 border-black mb-3 h-16' style={{ borderColor: '#000000' }}></div>
                                <p className='text-xs mb-1' style={{ color: '#000000' }}>
                                    {quotationData?.studio?.name || agreement.photographerName || 'Service Provider Name'}
                                </p>
                                <p className='text-xs' style={{ color: '#000000' }}>
                                    Date: _____________
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

