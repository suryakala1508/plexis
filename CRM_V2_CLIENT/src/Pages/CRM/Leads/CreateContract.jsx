import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../../../contexts/UserContext'
import { getLeadById, updateLead } from '../../../services/leadService'
import { getQuotationById, getQuotationsByLead } from '../../../services/quotationService'
import { generateAndDownloadContractPdf } from '../../../services/pdfService'
import { saveContractDraft, updateContract, getContractsByLead, getContractById } from '../../../services/contractService'
import { createProject } from '../../../services/projectService'
import { formatIndianCurrency } from '../../../utils/formatUtils'
import { checkProjectExists } from '../../../utils/workflowChecks'
import { ContractEditor } from './components/ContractEditor'
import { ContractPreview } from './components/ContractPreview'
import { LeadBreadcrumb } from './components/LeadBreadcrumb'
import { Success } from '../../../Components/Success'
import { Error } from '../../../Components/Error'
import { Skeleton } from '../../../Components/Skeleton'

export const CreateContract = () => {
    const { leadId, quotationId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user, studio } = useUser()

    // Get lead name from navigation state first, avoid unnecessary API call
    const [lead, setLead] = useState(null)
    const [quotationData, setQuotationData] = useState(null)
    const [contractId, setContractId] = useState(location.state?.contractId || null)
    const [loading, setLoading] = useState(true)
    const [savingDraft, setSavingDraft] = useState(false)
    const [exportingPdf, setExportingPdf] = useState(false)
    const [leadName, setLeadName] = useState(null)
    const [activeTab, setActiveTab] = useState('editor') // 'editor' or 'preview'
    const [successMessage, setSuccessMessage] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const [contractData, setContractData] = useState({
        agreement: {
            agreementDate: new Date().toISOString().split('T')[0],
            corporationName: '',
            corporationAddress: '',
            photographerName: '',
            photographerAddress: '',
            eventDescription: '',
            duration: '',
            deliveryDays: ''
        },
        terms: { customTerms: '' },
        items: [],
        deliverables: [],
        complimentary: [],
        paymentMilestones: [],
        copyright: {
            transferCopyright: false,
            imagesDescription: '',
            photoCredit: '',
            licensingTerms: ''
        },
        disclaimer: { text: '' }
    })

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('CreateContract: loadData started')
                console.log('CreateContract: leadId', leadId)
                console.log('CreateContract: contractId from state', location.state?.contractId)
                setLoading(true)

                // Helper to safely format ISO dates
                const safeISO = (dVal) => {
                    if (!dVal) return ''
                    const d = new Date(dVal)
                    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
                }

                // ── 1. Fetch lead ──────────────────────────────────────────
                let leadDataObj = null
                let responseData = null
                try {
                    const leadResponse = await getLeadById(leadId)
                    responseData = leadResponse.data || leadResponse
                    leadDataObj = responseData.lead || responseData

                    if (leadDataObj) {
                        setLead(leadDataObj)
                        if (!leadName && leadDataObj?.name) setLeadName(leadDataObj.name)
                        console.log('CreateContract: lead loaded', leadDataObj?.name)
                    }
                } catch (leadErr) {
                    console.error('CreateContract: Failed to load lead:', leadErr)
                    setErrorMessage('Failed to load lead details: ' + (leadErr?.message || 'Unknown error'))
                    setLoading(false)
                    return
                }

                // ── 2. Identify the quotation to use ──────────────────────
                let resolvedQuotationId = quotationId || location.state?.quotationId
                let quotationDataToUse = null

                // Extract quotations from leadResponse (which includes them without strict userId filtering)
                const quotationsFromLead = responseData.quotations || []
                console.log('CreateContract: Quotations from lead response:', quotationsFromLead.length)

                if (quotationsFromLead.length > 0) {
                    // Priority: accepted first, then sent, then draft; most recent within each
                    const statusOrder = ['accepted', 'sent', 'viewed', 'draft']
                    let bestQuotation = null

                    if (resolvedQuotationId) {
                        bestQuotation = quotationsFromLead.find(q => (q._id || q.id) === resolvedQuotationId)
                    }

                    if (!bestQuotation) {
                        for (const status of statusOrder) {
                            bestQuotation = quotationsFromLead.find(q => (q.status || '').toLowerCase() === status)
                            if (bestQuotation) break
                        }
                    }

                    if (!bestQuotation) bestQuotation = quotationsFromLead[0]

                    if (bestQuotation) {
                        console.log('CreateContract: Selected quotation', bestQuotation._id || bestQuotation.id, 'with status', bestQuotation.status)

                        // IMPORTANT: quotations from getLeadById are LEAN but full documents
                        // Ensure we have the items and other fields
                        quotationDataToUse = {
                            quotationNumber: bestQuotation.quotationNumber || `QT-${bestQuotation._id || bestQuotation.id}`,
                            quotationDate: safeISO(bestQuotation.createdAt) || new Date().toISOString().split('T')[0],
                            studio: {
                                name: bestQuotation.studio?.name || studio?.name || user?.name || '',
                                address: bestQuotation.studio?.address || studio?.address || '',
                                phone: bestQuotation.studio?.phone || studio?.phone || '',
                                gstNumber: bestQuotation.studio?.gstNumber || studio?.gstNumber || '',
                                logo: bestQuotation.studio?.logo || studio?.logo || ''
                            },
                            client: {
                                name: bestQuotation.client?.name || leadDataObj?.name || '',
                                email: bestQuotation.client?.email || leadDataObj?.email || '',
                                phone: bestQuotation.client?.phone || leadDataObj?.contactNumber || leadDataObj?.whatsappNumber || '',
                                address: bestQuotation.client?.address || leadDataObj?.Location || ''
                            },
                            event: {
                                type: bestQuotation.event?.type || leadDataObj?.EventType || leadDataObj?.EnquiryType || '',
                                date: safeISO(bestQuotation.event?.date) || safeISO(leadDataObj?.EventDate) || '',
                                location: bestQuotation.event?.location || leadDataObj?.Location || ''
                            },
                            items: bestQuotation.items || [],
                            deliverables: bestQuotation.deliverables || [],
                            complimentary: bestQuotation.complimentary || [],
                            paymentMilestones: bestQuotation.paymentMilestones || [],
                            termsAndConditions: bestQuotation.termsAndConditions || '',
                            notes: bestQuotation.notes || '',
                            taxRate: bestQuotation.taxRate || 0,
                            discount: bestQuotation.discount || { enabled: false, type: 'percentage', value: 0 }
                        }
                    }
                }

                // Fallback: build empty structure from lead if no quotation found
                if (!quotationDataToUse) {
                    console.log('CreateContract: No quotation found — building from lead data')
                    quotationDataToUse = {
                        quotationNumber: 'New Contract',
                        quotationDate: new Date().toISOString().split('T')[0],
                        studio: {
                            name: studio?.name || user?.name || '',
                            address: studio?.address || '',
                            phone: studio?.phone || '',
                            gstNumber: studio?.gstNumber || '',
                            logo: studio?.logo || ''
                        },
                        client: {
                            name: leadDataObj?.name || '',
                            email: leadDataObj?.email || '',
                            phone: leadDataObj?.contactNumber || leadDataObj?.whatsappNumber || '',
                            address: leadDataObj?.Location || ''
                        },
                        event: {
                            type: leadDataObj?.EventType || leadDataObj?.EnquiryType || '',
                            date: safeISO(leadDataObj?.EventDate),
                            location: leadDataObj?.Location || ''
                        },
                        items: [],
                        deliverables: [],
                        complimentary: [],
                        paymentMilestones: [],
                        termsAndConditions: '',
                        notes: '',
                        taxRate: 0,
                        discount: { enabled: false, type: 'percentage', value: 0 }
                    }
                }
                setQuotationData(quotationDataToUse)

                // Map quotation items → contract services
                // item schema: { event (name), packages[{name,amount}], amount (total), ... }
                const itemsWithTotals = (quotationDataToUse.items || []).map(item => {
                    const quantity = 1
                    const total = item.amount || item.total || 0
                    const rate = total // amount is already the total for the service

                    // Build description: "Event Name – Package 1, Package 2"
                    let description = item.event || item.description || item.name || ''
                    if (item.packages && item.packages.length > 0) {
                        const pkgNames = item.packages.map(p => p.name).filter(Boolean).join(', ')
                        if (pkgNames) description = description ? `${description} – ${pkgNames}` : pkgNames
                    }

                    return { description, quantity, rate, total }
                })
                const deliverablesForContract = (quotationDataToUse.deliverables || []).map(d => ({
                    description: d.description || '',
                    quantity: d.quantity || 1
                }))
                const complimentaryForContract = (quotationDataToUse.complimentary || []).map(c => ({
                    description: c.description || '',
                    quantity: c.quantity || 1
                }))

                setContractData(prev => ({
                    ...prev,
                    agreement: {
                        ...prev.agreement,
                        agreementDate: quotationDataToUse.quotationDate,
                        corporationName: leadDataObj?.name || quotationDataToUse.client?.name || '',
                        corporationAddress: leadDataObj?.Location || quotationDataToUse.client?.address || '',
                        photographerName: quotationDataToUse.studio?.name || studio?.name || user?.name || '',
                        photographerAddress: quotationDataToUse.studio?.address || studio?.address || user?.address || '',
                        clientPhone: quotationDataToUse.client?.phone || leadDataObj?.contactNumber || leadDataObj?.whatsappNumber || '',
                        clientEmail: quotationDataToUse.client?.email || leadDataObj?.email || '',
                        eventDescription: leadDataObj?.EventType || leadDataObj?.EnquiryType || quotationDataToUse.event?.type || '',
                        duration: '1 year',
                        deliveryDays: '30'
                    },
                    terms: { customTerms: quotationDataToUse.termsAndConditions || '' },
                    items: itemsWithTotals,
                    deliverables: deliverablesForContract,
                    complimentary: complimentaryForContract,
                    paymentMilestones: quotationDataToUse.paymentMilestones || []
                }))

                // ── 4. Fetch and overlay saved contract data ───────────────
                try {
                    let existingContract = null

                    if (location.state?.contractId) {
                        console.log('CreateContract: Fetching specific contract', location.state.contractId)
                        const contractResponse = await getContractById(location.state.contractId)
                        existingContract = contractResponse.data || contractResponse
                        if (!contractId) setContractId(existingContract._id || existingContract.id)
                    } else {
                        console.log('CreateContract: Fetching all contracts for lead', leadId)
                        const contractsResponse = await getContractsByLead(leadId)
                        const contractsList = contractsResponse.contracts || contractsResponse.data?.contracts || (Array.isArray(contractsResponse) ? contractsResponse : [])
                        existingContract = contractsList.length > 0 ? contractsList[0] : null
                        console.log('CreateContract: contracts found:', contractsList.length)
                        if (existingContract) setContractId(existingContract._id || existingContract.id)
                    }

                    if (existingContract) {
                        console.log('CreateContract: Populating state from existing contract', existingContract._id)
                        console.log('  Existing Contract Items count:', existingContract.items?.length || 0)

                        setContractData(prev => {
                            const newItems = existingContract.items && existingContract.items.length > 0
                                ? existingContract.items
                                : prev.items;
                            const newDeliverables = existingContract.deliverables && existingContract.deliverables.length > 0
                                ? existingContract.deliverables
                                : prev.deliverables;
                            const newComplimentary = existingContract.complimentary && existingContract.complimentary.length > 0
                                ? existingContract.complimentary
                                : prev.complimentary;

                            console.log('CreateContract: Overlay result - Items:', newItems?.length || 0, 'Deliverables:', newDeliverables?.length || 0)

                            return {
                                ...prev,
                                agreement: {
                                    ...prev.agreement,
                                    agreementDate: existingContract.agreement?.agreementDate || prev.agreement.agreementDate,
                                    photographerName: existingContract.agreement?.photographerName || prev.agreement.photographerName,
                                    photographerAddress: existingContract.agreement?.photographerAddress || prev.agreement.photographerAddress,
                                    corporationName: existingContract.agreement?.corporationName || prev.agreement.corporationName,
                                    corporationAddress: existingContract.agreement?.corporationAddress || prev.agreement.corporationAddress,
                                    clientPhone: existingContract.agreement?.clientPhone ?? prev.agreement.clientPhone ?? '',
                                    clientEmail: existingContract.agreement?.clientEmail ?? prev.agreement.clientEmail ?? '',
                                    eventDescription: existingContract.agreement?.eventDescription || prev.agreement.eventDescription,
                                    duration: existingContract.agreement?.duration || prev.agreement.duration,
                                    deliveryDays: existingContract.agreement?.deliveryDays || prev.agreement.deliveryDays,
                                },
                                terms: {
                                    ...prev.terms,
                                    customTerms: existingContract.terms?.customTerms || prev.terms.customTerms,
                                },
                                copyright: {
                                    ...prev.copyright,
                                    transferCopyright: existingContract.copyright?.transferCopyright ?? prev.copyright.transferCopyright,
                                    imagesDescription: existingContract.copyright?.imagesDescription || prev.copyright.imagesDescription,
                                    photoCredit: existingContract.copyright?.photoCredit || prev.copyright.photoCredit,
                                    licensingTerms: existingContract.copyright?.licensingTerms || prev.copyright.licensingTerms,
                                },
                                disclaimer: {
                                    ...prev.disclaimer,
                                    text: existingContract.disclaimer?.text || prev.disclaimer.text,
                                },
                                items: newItems,
                                deliverables: newDeliverables,
                                complimentary: newComplimentary,
                                paymentMilestones: existingContract.paymentMilestones?.length ? existingContract.paymentMilestones : prev.paymentMilestones,
                                status: existingContract.status || prev.status,
                                subtotal: existingContract.subtotal || prev.subtotal,
                                discountAmount: existingContract.discountAmount || prev.discountAmount,
                                taxAmount: existingContract.taxAmount || prev.taxAmount,
                                grandTotal: existingContract.grandTotal || prev.grandTotal
                            };
                        })
                    }
                } catch (contractErr) {
                    console.error('CreateContract: Error fetching existing contract (non-critical):', contractErr)
                }
            } catch (err) {
                console.error('CreateContract: Unexpected error in loadData:', err)
                setErrorMessage('Failed to load details: ' + (err?.message || 'Unknown error'))
            } finally {
                setLoading(false)
            }
        }

        if (leadId && user) loadData()
    }, [leadId, quotationId, user])

    const handleSaveDraft = async () => {
        try {
            setSavingDraft(true)
            setErrorMessage(null)

            // Calculate totals
            const subtotal = contractData.items.reduce((sum, item) => sum + (item.total || 0), 0)
            const taxAmount = quotationData?.taxRate ? (subtotal * quotationData.taxRate) / 100 : 0
            const discountAmount = quotationData?.discount?.enabled
                ? quotationData.discount.type === 'percentage'
                    ? (subtotal * quotationData.discount.value) / 100
                    : quotationData.discount.value
                : 0
            const grandTotal = subtotal + taxAmount - discountAmount

            // Auto-populate photographer fields from studio data if not already set
            const photographerName = contractData.agreement.photographerName || quotationData?.studio?.name || studio?.name || user?.name || ''
            const photographerAddress = contractData.agreement.photographerAddress || quotationData?.studio?.address || studio?.address || user?.address || ''

            const contractToSave = {
                ...contractData,
                agreement: {
                    ...contractData.agreement,
                    photographerName,
                    photographerAddress
                },
                leadId,
                quotationId: quotationId || undefined,
                subtotal,
                taxAmount,
                discountAmount,
                grandTotal
            }

            if (contractId) {
                // Update existing contract
                await updateContract(contractId, contractToSave)
                setSuccessMessage('Contract updated successfully!')
                setTimeout(() => {
                    setSuccessMessage(null)
                    navigate(`/leads/${leadId}`, { state: { fromContract: true } })
                }, 1500)
            } else {
                // Save new contract
                const saved = await saveContractDraft(contractToSave)
                const newId = saved.contractId || saved._id
                setContractId(newId)
                setSuccessMessage('Contract saved successfully!')
                setTimeout(() => {
                    setSuccessMessage(null)
                    navigate(`/leads/${leadId}`, { state: { fromContract: true } })
                }, 1500)
                return saved
            }
        } catch (error) {
            console.error('Error saving contract:', error)
            setErrorMessage(error.message || 'Failed to save contract')
            throw error // Re-throw to handle in caller
        } finally {
            setSavingDraft(false)
        }
    }

    const handleConvertToProject = async () => {
        try {
            setLoading(true)
            setErrorMessage(null)

            // Prevent duplicate project creation
            const existingProject = await checkProjectExists(leadId)
            if (existingProject) {
                setErrorMessage(`Project already exists for this lead. Redirecting...`)
                setTimeout(() => {
                    navigate(`/projects/${existingProject._id}`)
                }, 2000)
                return
            }

            // 1. Save or update contract first to ensure we have the latest state on the backend
            let currentContractId = contractId
            if (!currentContractId) {
                const saved = await handleSaveDraft()
                currentContractId = saved?.contractId || saved?._id
            }

            // Refetch contract ID if it was just created
            // Since setState is async, we'll try to find it or re-derive if needed.
            // For simplicity, let's assume handleSaveDraft worked.

            // 2. Prepare Project Data
            const itemsSummary = contractData.items.map(item => `- ${item.description} (Qty: ${item.quantity}, Rate: ${formatIndianCurrency(item.rate)})`).join('\n')

            const fullDescription = `
Contract Work Summary:
${itemsSummary}

Terms:
${contractData.terms.customTerms}

Copyright Info:
${contractData.copyright.transferCopyright ? 'Copyright will be transferred to client.' : 'Copyright remains with photographer.'}
${contractData.copyright.licensingTerms ? `Licensing: ${contractData.copyright.licensingTerms}` : ''}

Delivery Timeline: ${contractData.agreement.deliveryDays} days after event.
`.trim()

            const projectData = {
                projectTitle: `${lead?.name || 'Client'} - ${contractData.agreement.eventDescription || 'Photography Project'}`,
                projectDescription: fullDescription,
                startDate: contractData.agreement.agreementDate || new Date().toISOString(),
                endDate: quotationData?.event?.date || contractData.agreement.agreementDate,
                projectType: quotationData?.event?.type || 'Photography',
                clientName: lead?.name || 'Unnamed Client',
                clientEmail: lead?.email || '',
                clientPhone: lead?.contactNumber || lead?.whatsappNumber || '',
                budget: contractData.grandTotal.toString(),
                sourceLeadId: leadId,
                sourceQuotationId: quotationId || undefined,
                sourceContractId: currentContractId,
                contractUrl: contractData.pdfUrl || null,
                paymentMilestones: contractData.paymentMilestones.map(m => ({
                    description: m.description,
                    amount: m.amount,
                    dueDate: m.dueDate
                }))
            }

            // 3. Create the Project
            await createProject(projectData)

            // 4. Mark contract as converted/signed (status change) and update lead status
            if (contractId || currentContractId) {
                await updateContract(contractId || currentContractId, { status: 'signed' })
            }

            await updateLead(leadId, { status: 'Confirmed' })

            setSuccessMessage('Contract converted to project successfully!')

            // 5. Redirect back to lead detail page after a short delay
            setTimeout(() => {
                navigate(`/leads/${leadId}`)
            }, 2000)

        } catch (error) {
            console.error('Error converting to project:', error)
            setErrorMessage(error.message || 'Failed to convert contract to project')
        } finally {
            setLoading(false)
        }
    }

    const handleExportPDF = async () => {
        try {
            setExportingPdf(true)
            setErrorMessage(null)

            // Save/update contract first to ensure backend has latest data
            await handleSaveDraft()

            // Generate and download contract PDF from contract data
            const filename = `contract-${contractData.agreement.corporationName || 'contract'}-${new Date().getTime()}.pdf`
            const pdfUrl = await generateAndDownloadContractPdf(contractData, quotationData, filename)
            setSuccessMessage('Contract PDF generated and downloaded successfully!')
        } catch (error) {
            console.error('Error exporting contract PDF:', error)
            setErrorMessage(error.message || 'Failed to export contract PDF')
        } finally {
            setExportingPdf(false)
        }
    }


    if (loading) {
        return (
            <div className='h-screen bg-gray-50 flex flex-col overflow-hidden'>
                {/* Header with Breadcrumb */}
                <div className='shrink-0 bg-white border-b border-gray-200 px-6 py-4'>
                    <div className='max-w-[1920px] mx-auto'>
                        <LeadBreadcrumb
                            leadId={leadId}
                            leadName={leadName || contractData?.agreement?.corporationName || lead?.name}
                            currentPage="Contract"
                        />
                    </div>
                </div>

                <div className='flex-1 flex overflow-hidden'>
                    <div className='w-1/2 border-r border-gray-200 bg-white p-6'>
                        <div className='space-y-4'>
                            <Skeleton className='h-12 w-full' />
                            <Skeleton className='h-32 w-full' />
                            <Skeleton className='h-12 w-full' />
                            <Skeleton className='h-40 w-full' />
                        </div>
                    </div>

                    <div className='w-1/2 bg-gray-100 p-6'>
                        <div className='space-y-4'>
                            <Skeleton className='h-24 w-full' />
                            <Skeleton className='h-32 w-full' />
                            <Skeleton className='h-40 w-full' />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            {successMessage && (
                <Success
                    title="Success"
                    onClose={() => setSuccessMessage(null)}
                    autoClose={true}
                    autoCloseDelay={3000}
                >
                    {successMessage}
                </Success>
            )}

            {errorMessage && (
                <Error
                    title="Error"
                    onClose={() => setErrorMessage(null)}
                    autoClose={true}
                    autoCloseDelay={3000}
                >
                    {errorMessage}
                </Error>
            )}

            <div className='h-screen bg-gray-50 flex flex-col overflow-hidden'>
                {/* Header with Breadcrumb */}
                <div className='shrink-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4'>
                    <div className='max-w-[1920px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4'>
                        <LeadBreadcrumb
                            leadId={leadId}
                            leadName={leadName || contractData?.agreement?.corporationName || lead?.name}
                            currentPage="Contract"
                        />

                        {/* Mobile Tab Switcher */}
                        <div className='flex md:hidden bg-gray-100 p-1 rounded-lg'>
                            <button
                                onClick={() => setActiveTab('editor')}
                                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${activeTab === 'editor'
                                    ? 'bg-white text-primary-dark shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Editor
                            </button>
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${activeTab === 'preview'
                                    ? 'bg-white text-primary-dark shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Preview
                            </button>
                        </div>
                    </div>
                </div>

                {/* TWO PANEL WORKSPACE */}
                <div className='flex-1 flex overflow-hidden relative flex-col md:flex-row'>
                    <div className={`w-full md:w-1/2 border-r border-gray-200 bg-white overflow-y-auto ${activeTab === 'editor' ? 'block' : 'hidden md:block'
                        }`}>
                        <ContractEditor
                            contractData={contractData}
                            setContractData={setContractData}
                            onSaveDraft={handleSaveDraft}
                            onExportPDF={handleExportPDF}
                            savingDraft={savingDraft}
                            exportingPdf={exportingPdf}
                        />
                    </div>

                    <div className={`w-full md:w-1/2 bg-gray-100 overflow-y-auto ${activeTab === 'preview' ? 'block' : 'hidden md:block'
                        }`}>
                        <ContractPreview contractData={contractData} quotationData={quotationData} />
                    </div>
                </div>
            </div>
        </>
    )
}

