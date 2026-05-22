import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Download, Save, FolderPlus } from 'lucide-react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { formatIndianNumber, parseIndianNumber, formatIndianCurrency } from '../../../../utils/formatUtils'
import { LoadingSpinner } from '../../../../Components/Loading/LoadingSpinner'


export const ContractEditor = ({ contractData, setContractData, onSaveDraft, onConvertToProject, onExportPDF, savingDraft = false, exportingPdf = false }) => {
    const [expandedSections, setExpandedSections] = useState({
        agreement: true,
        items: true,
        payment: true,
        terms: true,
        copyright: true,
        disclaimer: true
    })

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const SectionHeader = ({ title, section }) => (
        <div
            className='flex items-center justify-between p-4 cursor-pointer bg-primary-dark text-white hover:bg-primary transition-colors'
            onClick={() => toggleSection(section)}
        >
            <h3 className='font-semibold'>{title}</h3>
            {expandedSections[section] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
    )

    const updateField = (section, field, value) => {
        setContractData(prev => {
            // Handle special cases for arrays at root level
            if ((section === 'items' || section === 'paymentMilestones' || section === 'deliverables' || section === 'complimentary') && field === '') {
                return {
                    ...prev,
                    [section]: value
                }
            }
            // Handle nested objects (agreement, terms, copyright, disclaimer)
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }
        })
    }

    const labelClasses = 'block text-sm font-medium text-gray-700 mb-1'
    const inputClasses = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm'

    return (
        <div className='h-full overflow-y-auto'>
            {/* Action Buttons */}
            <div className='sticky top-0 z-10 bg-white border-b border-gray-200 px-3 md:px-4 py-3'>
                <div className='flex flex-wrap items-center justify-between gap-2 md:gap-3'>
                    <div className='flex items-center gap-2 w-full sm:w-auto'>
                        {onSaveDraft && (
                            <button
                                onClick={onSaveDraft}
                                disabled={savingDraft || exportingPdf}
                                className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-xs md:text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {savingDraft ? (
                                    <LoadingSpinner size="sm" color="dark" />
                                ) : (
                                    <Save size={14} className="md:w-4 md:h-4" />
                                )}
                                <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
                            </button>
                        )}

                        {onExportPDF && (
                            <button
                                onClick={onExportPDF}
                                disabled={savingDraft || exportingPdf}
                                className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-primary-dark text-primary-dark rounded-lg hover:bg-primary-dark hover:text-white transition-all font-medium text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {exportingPdf ? (
                                    <LoadingSpinner size="sm" color="primary" />
                                ) : (
                                    <Download size={14} className="md:w-4 md:h-4" />
                                )}
                                <span>{exportingPdf ? 'Download' : 'Download PDF'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Agreement Details */}
            <div className='border-b border-gray-200'>
                <SectionHeader title='Agreement Details' section='agreement' />
                {expandedSections.agreement && (
                    <div className='p-4 space-y-3'>
                        <div>
                            <label className={labelClasses}>Agreement Date</label>
                            <DatePicker
                                value={contractData.agreement.agreementDate ? dayjs(contractData.agreement.agreementDate) : null}
                                onChange={(date) => updateField('agreement', 'agreementDate', date ? date.format('YYYY-MM-DD') : '')}
                                format="DD/MM/YYYY"
                                placeholder="dd-mm-yyyy"
                                className="w-full"
                                style={{ height: '38px' }}
                                classNames={{ popup: { root: 'small-calendar' } }}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Client Name</label>
                            <input
                                type='text'
                                value={contractData.agreement.corporationName}
                                onChange={(e) => updateField('agreement', 'corporationName', e.target.value)}
                                className={inputClasses}
                                placeholder='Enter client name'
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Client Address</label>
                            <textarea
                                value={contractData.agreement.corporationAddress || ''}
                                onChange={(e) => updateField('agreement', 'corporationAddress', e.target.value)}
                                className={inputClasses}
                                rows={3}
                                placeholder='Enter client address'
                            />
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            <div>
                                <label className={labelClasses}>Client Phone</label>
                                <input
                                    type='text'
                                    value={contractData.agreement.clientPhone || ''}
                                    onChange={(e) => updateField('agreement', 'clientPhone', e.target.value)}
                                    className={inputClasses}
                                    placeholder='+91 98765 43210'
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Client Email</label>
                                <input
                                    type='email'
                                    value={contractData.agreement.clientEmail || ''}
                                    onChange={(e) => updateField('agreement', 'clientEmail', e.target.value)}
                                    className={inputClasses}
                                    placeholder='client@email.com'
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Photographer / Studio Address</label>
                            <textarea
                                value={contractData.agreement.photographerAddress || ''}
                                onChange={(e) => updateField('agreement', 'photographerAddress', e.target.value)}
                                className={inputClasses}
                                rows={2}
                                placeholder='Enter photographer/studio address'
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Event Description</label>
                            <input
                                type='text'
                                value={contractData.agreement.eventDescription}
                                onChange={(e) => updateField('agreement', 'eventDescription', e.target.value)}
                                className={inputClasses}
                                placeholder='e.g., 2006 Corporate Retreat'
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Agreement Duration</label>
                            <input
                                type='text'
                                value={contractData.agreement.duration}
                                onChange={(e) => updateField('agreement', 'duration', e.target.value)}
                                className={inputClasses}
                                placeholder='e.g., 1 year, 6 months'
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Photograph Delivery Days</label>
                            <input
                                type='number'
                                value={contractData.agreement.deliveryDays === '' || contractData.agreement.deliveryDays === null ? '' : contractData.agreement.deliveryDays}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? '' : e.target.value
                                    updateField('agreement', 'deliveryDays', val)
                                }}
                                className={inputClasses}
                                placeholder='Number of days'
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Services, Deliverables, Complimentary */}
            <div className='border-b border-gray-200'>
                <SectionHeader title='Services & Deliverables' section='items' />
                {expandedSections.items && (
                    <div className='p-4 space-y-5'>

                        {/* ── Services ─────────────────────────────── */}
                        <div>
                            <div className='flex items-center justify-between mb-2'>
                                <h4 className='text-sm font-semibold text-gray-800'>Services</h4>
                                <span className='text-xs text-gray-500'>{contractData.items?.length || 0} item(s)</span>
                            </div>
                            <p className='text-xs text-gray-500 mb-3'>Auto-populated from the quotation. Modify if needed.</p>
                            {contractData.items && contractData.items.length > 0 ? (
                                <div className='space-y-3'>
                                    {contractData.items.map((item, index) => (
                                        <div key={index} className='border border-gray-200 rounded-lg p-3'>
                                            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                                <div>
                                                    <label className={labelClasses}>Service Name</label>
                                                    <input
                                                        type='text'
                                                        value={item.description || ''}
                                                        onChange={(e) => {
                                                            const newItems = [...contractData.items]
                                                            newItems[index] = { ...newItems[index], description: e.target.value }
                                                            updateField('items', '', newItems)
                                                        }}
                                                        className={inputClasses}
                                                        placeholder='Service name'
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Quantity</label>
                                                    <input
                                                        type='number'
                                                        value={item.quantity === '' || item.quantity === null || item.quantity === undefined ? '' : item.quantity}
                                                        onChange={(e) => {
                                                            const newItems = [...contractData.items]
                                                            const val = e.target.value === '' ? '' : parseInt(e.target.value) || ''
                                                            const quantity = val === '' ? 1 : (val || 1)
                                                            const rate = newItems[index].rate || 0
                                                            newItems[index] = { ...newItems[index], quantity: val === '' ? '' : quantity, total: rate * quantity }
                                                            updateField('items', '', newItems)
                                                        }}
                                                        onBlur={(e) => {
                                                            if (e.target.value === '') {
                                                                const newItems = [...contractData.items]
                                                                const rate = newItems[index].rate || 0
                                                                newItems[index] = { ...newItems[index], quantity: 1, total: rate }
                                                                updateField('items', '', newItems)
                                                            }
                                                        }}
                                                        className={inputClasses}
                                                        min='1'
                                                        placeholder='1'
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Rate (₹)</label>
                                                    <input
                                                        type='text'
                                                        value={item.rate === '' || item.rate === null || item.rate === undefined ? '' : formatIndianNumber(item.rate)}
                                                        onChange={(e) => {
                                                            const newItems = [...contractData.items]
                                                            const rawVal = parseIndianNumber(e.target.value)
                                                            const val = rawVal === '' ? '' : parseFloat(rawVal) || ''
                                                            const rate = val === '' ? 0 : (val || 0)
                                                            const quantity = newItems[index].quantity || 1
                                                            newItems[index] = { ...newItems[index], rate: val === '' ? '' : rate, total: rate * quantity }
                                                            updateField('items', '', newItems)
                                                        }}
                                                        onBlur={(e) => {
                                                            if (e.target.value === '') {
                                                                const newItems = [...contractData.items]
                                                                const quantity = newItems[index].quantity || 1
                                                                newItems[index] = { ...newItems[index], rate: 0, total: 0 }
                                                                updateField('items', '', newItems)
                                                            }
                                                        }}
                                                        className={inputClasses}
                                                        placeholder='0'
                                                    />
                                                </div>
                                            </div>
                                            <div className='mt-3 pt-3 border-t border-gray-100 flex justify-between items-center'>
                                                <span className='text-sm font-medium text-gray-700'>Total: {formatIndianCurrency((item.total || (item.rate || 0) * (item.quantity || 1)))}</span>
                                                <button
                                                    onClick={() => updateField('items', '', contractData.items.filter((_, i) => i !== index))}
                                                    className='text-red-600 hover:text-red-800 text-sm font-medium'
                                                >Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-sm text-gray-400 italic'>No services — add one below.</p>
                            )}
                            <button
                                onClick={() => updateField('items', '', [...(contractData.items || []), { description: '', quantity: 1, rate: 0, total: 0 }])}
                                className='mt-2 w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-600'
                            >+ Add Service</button>
                        </div>

                        {/* ── Deliverables ─────────────────────────── */}
                        <div className='border-t border-gray-100 pt-4'>
                            <div className='flex items-center justify-between mb-2'>
                                <h4 className='text-sm font-semibold text-gray-800'>Deliverables</h4>
                                <span className='text-xs text-gray-500'>{contractData.deliverables?.length || 0} item(s)</span>
                            </div>
                            <p className='text-xs text-gray-500 mb-3'>What will be delivered to the client.</p>
                            {contractData.deliverables && contractData.deliverables.length > 0 ? (
                                <div className='space-y-2'>
                                    {contractData.deliverables.map((item, index) => (
                                        <div key={index} className='flex gap-2 items-center border border-gray-200 rounded-lg p-2'>
                                            <input
                                                type='text'
                                                value={item.description || ''}
                                                onChange={(e) => {
                                                    const newD = [...contractData.deliverables]
                                                    newD[index] = { ...newD[index], description: e.target.value }
                                                    updateField('deliverables', '', newD)
                                                }}
                                                className={`${inputClasses} flex-1`}
                                                placeholder='Deliverable description'
                                            />
                                            <div className='w-20'>
                                                <input
                                                    type='number'
                                                    value={item.quantity || 1}
                                                    onChange={(e) => {
                                                        const newD = [...contractData.deliverables]
                                                        newD[index] = { ...newD[index], quantity: parseInt(e.target.value) || 1 }
                                                        updateField('deliverables', '', newD)
                                                    }}
                                                    className={inputClasses}
                                                    min='1'
                                                    placeholder='Qty'
                                                    title='Quantity'
                                                />
                                            </div>
                                            <button
                                                onClick={() => updateField('deliverables', '', contractData.deliverables.filter((_, i) => i !== index))}
                                                className='text-red-500 hover:text-red-700 text-sm font-medium px-2'
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-sm text-gray-400 italic'>No deliverables — add one below.</p>
                            )}
                            <button
                                onClick={() => updateField('deliverables', '', [...(contractData.deliverables || []), { description: '', quantity: 1 }])}
                                className='mt-2 w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-600'
                            >+ Add Deliverable</button>
                        </div>

                        {/* ── Complimentary ────────────────────────── */}
                        <div className='border-t border-gray-100 pt-4'>
                            <div className='flex items-center justify-between mb-2'>
                                <h4 className='text-sm font-semibold text-gray-800'>Complimentary</h4>
                                <span className='text-xs text-gray-500'>{contractData.complimentary?.length || 0} item(s)</span>
                            </div>
                            <p className='text-xs text-gray-500 mb-3'>Free/bonus items included in this contract.</p>
                            {contractData.complimentary && contractData.complimentary.length > 0 ? (
                                <div className='space-y-2'>
                                    {contractData.complimentary.map((item, index) => (
                                        <div key={index} className='flex gap-2 items-center border border-gray-200 rounded-lg p-2'>
                                            <input
                                                type='text'
                                                value={item.description || ''}
                                                onChange={(e) => {
                                                    const newC = [...contractData.complimentary]
                                                    newC[index] = { ...newC[index], description: e.target.value }
                                                    updateField('complimentary', '', newC)
                                                }}
                                                className={`${inputClasses} flex-1`}
                                                placeholder='Complimentary item'
                                            />
                                            <div className='w-20'>
                                                <input
                                                    type='number'
                                                    value={item.quantity || 1}
                                                    onChange={(e) => {
                                                        const newC = [...contractData.complimentary]
                                                        newC[index] = { ...newC[index], quantity: parseInt(e.target.value) || 1 }
                                                        updateField('complimentary', '', newC)
                                                    }}
                                                    className={inputClasses}
                                                    min='1'
                                                    placeholder='Qty'
                                                    title='Quantity'
                                                />
                                            </div>
                                            <button
                                                onClick={() => updateField('complimentary', '', contractData.complimentary.filter((_, i) => i !== index))}
                                                className='text-red-500 hover:text-red-700 text-sm font-medium px-2'
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-sm text-gray-400 italic'>No complimentary items.</p>
                            )}
                            <button
                                onClick={() => updateField('complimentary', '', [...(contractData.complimentary || []), { description: '', quantity: 1 }])}
                                className='mt-2 w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-600'
                            >+ Add Complimentary Item</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Milestones */}
            <div className='border-b border-gray-200'>
                <SectionHeader title='Payment Timeline' section='payment' />
                {expandedSections.payment && (
                    <div className='p-4 space-y-3'>
                        <div className='text-sm text-gray-600 mb-3'>
                            Payment milestones are automatically populated from the quotation. You can modify them here if needed.
                        </div>
                        {contractData.paymentMilestones && contractData.paymentMilestones.length > 0 ? (
                            <div className='space-y-3'>
                                {contractData.paymentMilestones.map((milestone, index) => (
                                    <div key={index} className='border border-gray-200 rounded-lg p-3'>
                                        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                            <div>
                                                <label className={labelClasses}>Description</label>
                                                <input
                                                    type='text'
                                                    value={milestone.description || ''}
                                                    onChange={(e) => {
                                                        const newMilestones = [...contractData.paymentMilestones]
                                                        newMilestones[index] = { ...newMilestones[index], description: e.target.value }
                                                        updateField('paymentMilestones', '', newMilestones)
                                                    }}
                                                    className={inputClasses}
                                                    placeholder='Payment milestone description'
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Amount (₹)</label>
                                                <input
                                                    type='text'
                                                    value={milestone.amount === '' || milestone.amount === null || milestone.amount === undefined ? '' : formatIndianNumber(milestone.amount)}
                                                    onChange={(e) => {
                                                        const newMilestones = [...contractData.paymentMilestones]
                                                        const rawVal = parseIndianNumber(e.target.value)
                                                        const val = rawVal === '' ? '' : parseFloat(rawVal) || ''
                                                        newMilestones[index] = { ...newMilestones[index], amount: val === '' ? 0 : (val || 0) }
                                                        updateField('paymentMilestones', '', newMilestones)
                                                    }}
                                                    className={inputClasses}
                                                    placeholder='0'
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Due Date</label>
                                                <DatePicker
                                                    value={milestone.dueDate ? dayjs(milestone.dueDate) : null}
                                                    onChange={(date) => {
                                                        const newMilestones = [...contractData.paymentMilestones]
                                                        newMilestones[index] = { ...newMilestones[index], dueDate: date ? date.format('YYYY-MM-DD') : '' }
                                                        updateField('paymentMilestones', '', newMilestones)
                                                    }}
                                                    format="DD/MM/YYYY"
                                                    placeholder="dd-mm-yyyy"
                                                    className="w-full"
                                                    style={{ height: '38px' }}
                                                    classNames={{ popup: { root: 'small-calendar' } }}
                                                />
                                            </div>
                                        </div>
                                        <div className='mt-3 pt-3 border-t border-gray-100'>
                                            <button
                                                onClick={() => {
                                                    const newMilestones = contractData.paymentMilestones.filter((_, i) => i !== index)
                                                    updateField('paymentMilestones', '', newMilestones)
                                                }}
                                                className='text-red-600 hover:text-red-800 text-sm font-medium'
                                            >
                                                Remove Milestone
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const newMilestones = [...(contractData.paymentMilestones || []), { description: '', amount: 0, dueDate: '' }]
                                        updateField('paymentMilestones', '', newMilestones)
                                    }}
                                    className='w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700'
                                >
                                    + Add Payment Milestone
                                </button>
                            </div>
                        ) : (
                            <div className='text-center py-8 text-gray-500'>
                                <p>No payment milestones added yet.</p>
                                <button
                                    onClick={() => {
                                        const newMilestones = [{ description: '', amount: 0, dueDate: '' }]
                                        updateField('paymentMilestones', '', newMilestones)
                                    }}
                                    className='mt-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium'
                                >
                                    Add First Milestone
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Terms and Conditions */}
            <div className='border-b border-gray-200'>
                <SectionHeader title='Terms and Conditions' section='terms' />
                {expandedSections.terms && (
                    <div className='p-4 space-y-3'>
                        <div>
                            <label className={labelClasses}>
                                Terms and Conditions
                                <span className='text-gray-500 text-xs ml-2'>(Enter each term on a new line or use bullet points)</span>
                            </label>
                            <textarea
                                value={contractData.terms.customTerms}
                                onChange={(e) => updateField('terms', 'customTerms', e.target.value)}
                                className={`${inputClasses} min-h-[400px] font-mono text-sm`}
                                placeholder='Enter your custom terms and conditions here...&#10;&#10;Example:&#10;• For the duration of this agreement, the Photographer shall have the exclusive right to photograph participants and events.&#10;• The Corporation agrees to obtain model releases from each attendee.&#10;• The Photographer agrees to provide photographs within 30 days of event completion.'
                            />
                            <p className='text-xs text-gray-500 mt-1'>
                                Tip: Use bullet points (•) or numbered lists for better formatting in the preview
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Copyright and Licensing */}
            <div className='border-b border-gray-200'>
                <SectionHeader title='Copyright and Licensing' section='copyright' />
                {expandedSections.copyright && (
                    <div className='p-4 space-y-3'>
                        <div>
                            <label className='flex items-center gap-2 mb-2'>
                                <input
                                    type='checkbox'
                                    checked={contractData.copyright.transferCopyright}
                                    onChange={(e) => updateField('copyright', 'transferCopyright', e.target.checked)}
                                    className='w-4 h-4 text-primary-dark focus:ring-primary-dark border-gray-300 rounded'
                                />
                                <span className={labelClasses}>Transfer Copyright to Corporation</span>
                            </label>
                        </div>
                        {contractData.copyright.transferCopyright && (
                            <div>
                                <label className={labelClasses}>Images Subject to Copyright Transfer</label>
                                <textarea
                                    value={contractData.copyright.imagesDescription}
                                    onChange={(e) => updateField('copyright', 'imagesDescription', e.target.value)}
                                    className={inputClasses}
                                    rows={3}
                                    placeholder='Describe the images subject to copyright transfer...'
                                />
                            </div>
                        )}
                        {!contractData.copyright.transferCopyright && (
                            <>
                                <div>
                                    <label className={labelClasses}>Photo Credit Format</label>
                                    <input
                                        type='text'
                                        value={contractData.copyright.photoCredit}
                                        onChange={(e) => updateField('copyright', 'photoCredit', e.target.value)}
                                        className={inputClasses}
                                        placeholder='e.g., Photo by [Photographer Name]'
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Licensing Terms</label>
                                    <textarea
                                        value={contractData.copyright.licensingTerms}
                                        onChange={(e) => updateField('copyright', 'licensingTerms', e.target.value)}
                                        className={inputClasses}
                                        rows={4}
                                        placeholder='Describe licensing terms...'
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className='border-b border-gray-200'>
                <SectionHeader title='Disclaimer' section='disclaimer' />
                {expandedSections.disclaimer && (
                    <div className='p-4 space-y-3'>
                        <div>
                            <label className={labelClasses}>Disclaimer Text</label>
                            <textarea
                                value={contractData.disclaimer.text}
                                onChange={(e) => updateField('disclaimer', 'text', e.target.value)}
                                className={inputClasses}
                                rows={5}
                                placeholder='Enter disclaimer text...'
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

