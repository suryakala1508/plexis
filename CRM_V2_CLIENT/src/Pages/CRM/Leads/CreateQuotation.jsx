import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../../../contexts/UserContext'
import { getLeadById } from '../../../services/leadService'
import { saveQuotationDraft, autoSaveQuotationDraft, getQuotationById, getQuotationByIdForEdit, updateQuotation, autoUpdateQuotation, sendQuotation } from '../../../services/quotationService'
import * as quotationService from '../../../services/quotationService'
import { exportQuotationToPdf, openPdfInNewTab } from '../../../services/pdfService'
import { SendQuotationModal } from './components/SendQuotationModal'
import { QuotationPreview } from './components/QuotationPreview'
import { QuotationEditor } from './components/QuotationEditor'
import { LeadBreadcrumb } from './components/LeadBreadcrumb'
import { Save, Send, Download, LayoutTemplate, ChevronDown } from 'lucide-react'
import { Success } from '../../../Components/Success'
import { Error } from '../../../Components/Error'
import { Skeleton } from '../../../Components/Skeleton'
import { getTemplates } from '../../../services/templateService'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

const normalizeTemplateId = (value) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value !== null) {
        return value._id ? String(value._id) : (value.id ? String(value.id) : String(value))
    }
    return String(value)
}

const getTemplateId = (template) => normalizeTemplateId(template?.id || template?._id)

export const CreateQuotation = () => {
    const { leadId, quotationId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user, studio } = useUser()

    // Get lead name from navigation state first, avoid unnecessary API call
    const [lead, setLead] = useState(null)
    const [leadName, setLeadName] = useState(location.state?.leadName || null)
    const [loading, setLoading] = useState(true)
    const [savingDraft, setSavingDraft] = useState(false)
    const [exportingPdf, setExportingPdf] = useState(false)
    const [successMessage, setSuccessMessage] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)
    const [showSendModal, setShowSendModal] = useState(false)
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
    const [activeQuotationId, setActiveQuotationId] = useState(quotationId || null)

    // Draft key based on leadId or activeQuotationId
    const draftKey = activeQuotationId ? `quotation_draft_q_${activeQuotationId}` : (leadId ? `quotation_draft_l_${leadId}` : null)

    // Template selector
    const [availableTemplates, setAvailableTemplates] = useState([])
    const availableTemplatesRef = useRef([])  // Always-current ref so loaders avoid stale closures
    const pendingDefaultApply = useRef(false)  // Set when data loads before templates are ready
    const [selectedTemplateId, setSelectedTemplateId] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [isQuotationDataReady, setIsQuotationDataReady] = useState(!quotationId)

    // Quotation data
    const [quotationData, setQuotationData] = useState({
        quotationNumber: '',
        quotationDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        studio: {
            name: '',
            address: '',
            gstNumber: '',
            phone: '',
            logo: '',
            banner: ''
        },
        clientId: null, // ObjectId of the Client document
        client: { // Display data for the client
            name: '',
            email: '',
            phone: '',
            address: ''
        },
        event: {
            type: '',
            date: '',
            time: '',
            location: '',
        },
        taxRate: '',
        discount: {
            enabled: false,
            type: 'percentage',
            value: ''
        },
        items: [],
        deliverables: [],
        complimentary: [],
        paymentMilestones: [],
        paymentMethods: {
            creditCards: false,
            stripe: false,
            wiseStripe: false,
            paypal: false,
            venmo: false,
            bankTransfer: false,
            cashOrCheck: false
        },
        notes: '',
        termsAndConditions: '',
        customization: {
            primaryColor: '#D4AF37',
            headerColor: '#1F2937',
            sectionColor: '#F9FAFB',
            fontFamily: 'Inter',
            showPortfolio: false,
            portfolioLayout: 'grid',
            introPageBackground: {
                type: 'solid',
                color: '',
                gradientFrom: '',
                gradientTo: '',
                gradientDirection: '',
                imageUrl: '',
                imageOpacity: 0.15,
                imageSize: 'cover',
            },
            portfolioPageBackgrounds: {},
        },
        background: {
            type: 'solid',
            color: '#ffffff',
            imageUrl: '',
            imageOpacity: 0.15,
            imageSize: 'cover'
        },
        quotationBackground: {
            type: 'solid',
            color: '#ffffff',
            imageUrl: '',
            imageOpacity: 0.15,
            imageSize: 'cover'
        },
        serviceColumns: {
            date: true,
            location: true,
            crew: true,
            equipment: true,
            individualAmounts: true,
            subTotal: true,
            gst: true,
            discount: false,
            grandTotal: true
        }
    })

    const effectiveSelectedTemplateId = normalizeTemplateId(selectedTemplateId || quotationData.templateId)
    const effectiveSelectedTemplate = selectedTemplate || availableTemplates.find(t => getTemplateId(t) === effectiveSelectedTemplateId) || null

    // Load templates once on mount; keep ref in sync so data loaders can always access fresh list.
    useEffect(() => {
        getTemplates().then(data => {
            const templates = data || []
            availableTemplatesRef.current = templates
            setAvailableTemplates(templates)
        })
    }, [])

    // applyTemplateFromList — always receives the template list explicitly so it NEVER uses a stale closure.
    const applyTemplateFromList = (templateId, templateList) => {
        const normalizedTemplateId = normalizeTemplateId(templateId)
        setSelectedTemplateId(normalizedTemplateId);
        if (!normalizedTemplateId) {
            setSelectedTemplate(null)
            setQuotationData(prev => ({
                ...prev,
                templateId: null,
                background: { type: 'solid', color: '#ffffff', imageUrl: '', imageOpacity: 0.15, imageSize: 'cover' },
                quotationBackground: { type: 'solid', color: '#ffffff', imageUrl: '', imageOpacity: 0.15, imageSize: 'cover' }
            }))
            return
        }

        const tpl = templateList.find(t => getTemplateId(t) === normalizedTemplateId)
        if (tpl) {
            setSelectedTemplate(tpl)
            setQuotationData(prev => {
                const existingDeliverables = prev.deliverables || []
                const mergedDeliverables = [...existingDeliverables]
                ;(tpl.deliverables || []).forEach(td => {
                    const desc = typeof td === 'string' ? td : (td.description || td.name)
                    const exists = mergedDeliverables.some(ed => (typeof ed === 'string' ? ed : (ed.description || ed.name)) === desc)
                    if (!exists && desc) mergedDeliverables.push(typeof td === 'string' ? { description: td, quantity: 1 } : td)
                })
                const existingComplimentary = prev.complimentary || []
                const mergedComplimentary = [...existingComplimentary]
                ;(tpl.complimentary || []).forEach(tc => {
                    const desc = typeof tc === 'string' ? tc : (tc.description || tc.name)
                    const exists = mergedComplimentary.some(ec => (typeof ec === 'string' ? ec : (ec.description || ec.name)) === desc)
                    if (!exists && desc) mergedComplimentary.push(typeof tc === 'string' ? { description: tc, quantity: 1 } : tc)
                })
                return {
                    ...prev,
                    templateId: getTemplateId(tpl),
                    notes: tpl.notes || prev.notes,
                    termsAndConditions: tpl.termsAndConditions || prev.termsAndConditions,
                    deliverables: mergedDeliverables,
                    complimentary: mergedComplimentary,
                    paymentMilestones: tpl.paymentTerms ? tpl.paymentTerms.map(pt => ({ description: pt.description || '', amount: pt.amount || 0, dueDate: pt.dueDate || null })) : prev.paymentMilestones,
                    customization: {
                        ...prev.customization,
                        ...(tpl.customization || {}),
                        primaryColor: tpl.customization?.primaryColor || prev.customization.primaryColor,
                        headerColor: tpl.background?.headerColor || tpl.customization?.headerColor || prev.customization.headerColor,
                        fontFamily: tpl.customization?.fontFamily || prev.customization.fontFamily,
                    },
                    background: tpl.background || prev.background,
                    quotationBackground: tpl.quotationBackground || tpl.background || prev.quotationBackground || prev.background,
                    serviceColumns: { ...(prev.serviceColumns), ...(tpl.serviceColumns || {}), equipment: true }
                }
            })
        }
    }

    // applyTemplate — convenience wrapper that uses the current state list (for dropdown changes)
    const applyTemplate = (templateId) => applyTemplateFromList(templateId, availableTemplates)

    useEffect(() => {
        if (studio || user) {
            // Construct address from studio mainAddress if available
            let studioAddress = '';
            if (studio?.mainAddress) {
                const addr = studio.mainAddress;
                studioAddress = [
                    addr.addressLine1,
                    addr.addressLine2,
                    addr.city,
                    addr.state,
                    addr.country
                ].filter(Boolean).join(', ');
            } else if (studio?.address) {
                studioAddress = studio.address;
            } else if (user?.address) {
                studioAddress = user.address;
            }

            setQuotationData(prev => ({
                ...prev,
                studio: {
                    name: studio?.name || user?.firstName + ' ' + (user?.lastName || '') || prev.studio.name || '',
                    address: studioAddress || prev.studio.address || '',
                    gstNumber: studio?.gstNumber || prev.studio.gstNumber || '',
                    phone: formatPhoneNumber(studio?.phone || user?.phone || prev.studio.phone || ''),
                    logo: studio?.logo || prev.studio.logo || '',
                    banner: studio?.bannerImage || prev.studio.banner || ''
                }
            }))
        }
    }, [studio, user])

    // Function to load quotation data by ID
    const loadQuotationData = async (quotationIdToLoad) => {
        try {
            setLoading(true)
            const quotationResponse = await getQuotationByIdForEdit(quotationIdToLoad)
            const quotation = quotationResponse.data || quotationResponse

            if (quotation) {
                // Handle studio - now it's an embedded object in the quotation
                let studioData = {
                    name: '',
                    address: '',
                    gstNumber: '',
                    phone: '',
                    logo: '',
                    banner: ''
                }

                            // First try to get current studio data
                            if (studio?.mainAddress) {
                                const addr = studio.mainAddress;
                                studioData = {
                                    name: studio.name || '',
                                    address: [
                                        addr.addressLine1,
                                        addr.addressLine2,
                                        addr.city,
                                        addr.state,
                                        addr.country
                                    ].filter(Boolean).join(', '),
                                    gstNumber: studio.gstNumber || '',
                                    phone: formatPhoneNumber(studio.phone || ''),
                                    logo: studio.logo || '',
                                    banner: studio.bannerImage || ''
                                }
                            } else if (studio?.address) {
                                studioData = {
                                    name: studio.name || '',
                                    address: studio.address,
                                    gstNumber: studio.gstNumber || '',
                                    phone: formatPhoneNumber(studio.phone || ''),
                                    logo: studio.logo || '',
                                    banner: studio.bannerImage || ''
                                }
                            } else if (user) {
                                studioData = {
                                    name: user.firstName + ' ' + (user.lastName || ''),
                                    address: user.address || '',
                                    gstNumber: '',
                                    phone: formatPhoneNumber(user.phone || ''),
                                    logo: '',
                                    banner: ''
                                }
                            }

                if (quotation.studio && typeof quotation.studio === 'object') {
                    // Use the embedded studio data from the quotation
                    studioData = {
                        name: quotation.studio.name || studioData.name,
                        address: quotation.studio.address || studioData.address,
                        gstNumber: quotation.studio.gstNumber || studioData.gstNumber,
                        phone: formatPhoneNumber(quotation.studio.phone || studioData.phone),
                        logo: quotation.studio.logo || studioData.logo,
                        banner: quotation.studio.banner || studioData.banner
                    }
                }

                // Handle client - check if it's a populated object (Lead) or just ObjectId
                let clientData = {
                    name: '',
                    email: '',
                    phone: '',
                    address: ''
                }

                if (quotation.client) {
                    if (typeof quotation.client === 'object' && (quotation.client.name || quotation.client.phone || quotation.client.address)) {
                        // Saved client (phone/address) or populated lead (contactNumber/Location)
                        clientData = {
                            name: quotation.client.name || '',
                            email: quotation.client.email || '',
                            phone: formatPhoneNumber(quotation.client.phone || quotation.client.contactNumber || quotation.client.whatsappNumber || ''),
                            address: quotation.client.address || quotation.client.Location || ''
                        }
                    } else {
                        // Just ObjectId, fetch lead data
                        if (quotation.leadId) {
                            const leadData = await getLeadById(quotation.leadId)
                            const leadResponseData = leadData.data || leadData
                            const leadDataObj = leadResponseData.lead || leadResponseData
                            clientData = {
                                name: leadDataObj.name || '',
                                email: leadDataObj.email || '',
                                phone: formatPhoneNumber(leadDataObj.contactNumber || leadDataObj.whatsappNumber || ''),
                                address: leadDataObj.Location || ''
                            }
                        }
                    }
                }

                // Ensure items have id fields and packages have normalized packageItems (name, quantity) for preview
                const itemsWithIds = (quotation.items || []).map((item, index) => {
                    const packages = (item.packages || []).map(pkg => ({
                        ...pkg,
                        packageItems: (pkg.packageItems || []).map(pi => ({
                            name: pi.name ?? pi.itemName ?? '',
                            quantity: pi.quantity ?? pi.qty ?? 1,
                            type: pi.type,
                            pricingId: pi.pricingId ?? pi._id ?? pi.id
                        }))
                    }))
                    return {
                        ...item,
                        packages,
                        id: item.id || item._id || `item-${index}-${Date.now()}`,
                        dueDate: item.dueDate
                            ? new Date(item.dueDate).toISOString().split('T')[0]
                            : ''
                    }
                })

                const milestonesWithIds = (quotation.paymentMilestones || []).map((milestone, index) => ({
                    ...milestone,
                    id: milestone.id || milestone._id || `milestone-${index}-${Date.now()}`,
                    dueDate: milestone.dueDate
                        ? new Date(milestone.dueDate).toISOString().split('T')[0]
                        : ''
                }))

                // Ensure deliverables and complimentary have id fields
                const deliverablesWithIds = (quotation.deliverables || []).map((d, i) => ({
                    ...d,
                    id: d.id || d._id || `del-${i}-${Date.now()}`
                }))
                const complimentaryWithIds = (quotation.complimentary || []).map((c, i) => ({
                    ...c,
                    id: c.id || c._id || `comp-${i}-${Date.now()}`
                }))

                setQuotationData(prev => ({
                    ...prev,
                    // Clear any saved templateId — the default template effect will re-apply
                    // the current default template fresh on every open.
                    templateId: null,
                    quotationNumber: quotation.quotationNumber || '',
                    quotationDate: quotation.quotationDate
                        ? new Date(quotation.quotationDate).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0],
                    dueDate: quotation.dueDate
                        ? new Date(quotation.dueDate).toISOString().split('T')[0]
                        : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                    studio: studioData,
                    clientId: quotation.client,
                    client: clientData,
                    event: quotation.event || prev.event,
                    welcomeMessage: quotation.welcomeMessage || '',
                    taxRate: quotation.taxRate || 0,
                    discount: quotation.discount ? {
                        enabled: quotation.discount.enabled || false,
                        type: quotation.discount.type || 'percentage',
                        value: quotation.discount.value || ''
                    } : prev.discount,
                    items: itemsWithIds,
                    deliverables: deliverablesWithIds,
                    complimentary: complimentaryWithIds,
                    paymentMilestones: milestonesWithIds,
                    paymentMethods: quotation.paymentMethods || prev.paymentMethods,
                    notes: quotation.notes || '',
                    termsAndConditions: quotation.termsAndConditions || '',
                    customization: quotation.customization || prev.customization,
                    background: quotation.background || prev.background,
                    quotationBackground: quotation.quotationBackground || quotation.background || prev.quotationBackground || prev.background,
                    serviceColumns: {
                        ...(prev.serviceColumns),
                        ...(quotation.serviceColumns || {}),
                        equipment: true // Force equipment visible since there is no UI to toggle it yet
                    }
                }))

                // After loading the quotation, apply the CURRENT default template.
                // We use availableTemplatesRef so we always have the fresh list, no stale closure.
                setSelectedTemplateId('')
                setSelectedTemplate(null)
                // Defer slightly so setQuotationData above has been committed
                setTimeout(() => {
                    const templates = availableTemplatesRef.current
                    const defaultTpl = templates.find(t => t.isDefault)
                    if (defaultTpl) {
                        applyTemplateFromList(getTemplateId(defaultTpl), templates)
                    }
                }, 0)

                // Set lead name from quotation if available
                if (quotation.leadId && !leadName) {
                    const leadData = await getLeadById(quotation.leadId)
                    const leadResponseData = leadData.data || leadData
                    const leadDataObj = leadResponseData.lead || leadResponseData
                    if (leadDataObj?.name) {
                        setLeadName(leadDataObj.name)
                    }
                }
            }
        } catch (err) {
            console.error('Error loading quotation:', err)
            setErrorMessage('Failed to load quotation data')
        } finally {
            setIsQuotationDataReady(true)
            setLoading(false)
        }
    }

    // Combined data loader (Quotation or Lead)
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)

                if (quotationId) {
                    // For existing quotations the server is always the source of truth.
                    // Clear any stale localStorage draft so it never overrides fresh server data.
                    const staleKey = `quotation_draft_q_${quotationId}`
                    localStorage.removeItem(staleKey)
                    await loadQuotationData(quotationId)
                    setLoading(false)
                    return
                }

                // Load lead data (for new quotations or if quotation load failed)
                const leadData = await getLeadById(leadId)
                const responseData = leadData.data || leadData
                const leadDataObj = responseData.lead || responseData

                setLead(leadDataObj)
                // Only set leadName if we don't already have it from navigation state
                if (!leadName && leadDataObj?.name) {
                    setLeadName(leadDataObj.name)
                }

                setQuotationData(prev => ({
                    ...prev,
                    dueDate: prev.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                    studio: {
                        name: studio?.name || user?.name || prev.studio.name || 'Your Studio',
                        address: studio?.address || user?.address || prev.studio.address || '',
                        gstNumber: studio?.gstNumber || prev.studio.gstNumber || '',
                        phone: formatPhoneNumber(studio?.phone || user?.phone || prev.studio.phone || ''),
                        logo: studio?.logo || prev.studio.logo || '',
                        banner: studio?.bannerImage || prev.studio.banner || ''
                    },
                    client: {
                        name: leadDataObj.name || '',
                        email: leadDataObj.email || '',
                        phone: formatPhoneNumber(leadDataObj.contactNumber || leadDataObj.whatsappNumber || ''),
                        address: leadDataObj.Location || ''
                    },
                    event: {
                        ...prev.event,
                        type: leadDataObj.EventType || leadDataObj.customEventType || '',
                        location: leadDataObj.Location || leadDataObj.venue || '',
                        date: leadDataObj.EventDate ?
                            (dayjs(leadDataObj.EventDate).format('MMM D, YYYY h:mm A') +
                                (leadDataObj.EventEndDate ? ' - ' + dayjs(leadDataObj.EventEndDate).format('MMM D, YYYY h:mm A') : ' - ' + dayjs(leadDataObj.EventDate).add(4, 'hour').format('MMM D, YYYY h:mm A')))
                            : ''
                    },
                    items: [],
                    paymentMilestones: []
                }))
                // Apply the current default template for new quotations.
                // Use ref so we have the fresh template list regardless of when this runs.
                setTimeout(() => {
                    const templates = availableTemplatesRef.current
                    const defaultTpl = templates.find(t => t.isDefault)
                    if (defaultTpl) {
                        applyTemplateFromList(getTemplateId(defaultTpl), templates)
                    }
                }, 0)
            } catch (err) {
                setErrorMessage('Failed to load information')
            } finally {
                setLoading(false)
            }
        }

        if (leadId && user) {
            loadData().then(() => {
                // Only restore localStorage draft for NEW quotations (no quotationId).
                // For existing quotations the stale draft was already cleared above and 
                // the server data is authoritative.
                if (!quotationId && draftKey) {
                    const savedDraftStr = localStorage.getItem(draftKey);
                    if (savedDraftStr) {
                        try {
                            const parsedDraft = JSON.parse(savedDraftStr);
                            if (parsedDraft && parsedDraft.items) {
                                setQuotationData({
                                    ...parsedDraft,
                                    templateId: null,  // Always clear — default template will be re-applied below
                                    serviceColumns: {
                                        ...(parsedDraft.serviceColumns || {}),
                                        equipment: true
                                    }
                                });
                                // Re-apply the current default template over the restored draft data.
                                setTimeout(() => {
                                    const templates = availableTemplatesRef.current
                                    const defaultTpl = templates.find(t => t.isDefault)
                                    if (defaultTpl) {
                                        applyTemplateFromList(getTemplateId(defaultTpl), templates)
                                    }
                                }, 0)
                            }
                        } catch (e) {
                            console.error("Failed to parse draft from localstorage", e);
                        }
                    }
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leadId, user, quotationId])

    // Auto save logic directly via useEffect
    // Only persist to localStorage for new (unsaved) quotations — never for existing ones.
    useEffect(() => {
        if (loading || !autoSaveEnabled || !draftKey || quotationId) return;

        // Save to localStorage immediately on change (debounced 1000ms)
        const localTimer = setTimeout(() => {
            localStorage.setItem(draftKey, JSON.stringify(quotationData));
        }, 1000);

        return () => {
            clearTimeout(localTimer);
        };
    }, [quotationData, autoSaveEnabled, loading, draftKey, quotationId]);

    const [showTemplateMenu, setShowTemplateMenu] = useState(false)

    // Calculate totals
    const calculateTotals = (data) => {
        const subtotal = data.items.reduce((sum, item) => {
            // Priority: item.amount (used in services) > item.total (used in older/generic items)
            const amt = item.amount === undefined || item.amount === null
                ? (item.total === '' || item.total === null ? 0 : Number(item.total))
                : Number(item.amount)
            return sum + (amt || 0)
        }, 0)

        const taxRate = data.taxRate === '' || data.taxRate === null ? 0 : Number(data.taxRate) || 0
        const taxAmount = (subtotal * taxRate) / 100

        const discountValue = data.discount.value === '' || data.discount.value === null ? 0 : Number(data.discount.value) || 0
        const discountAmount = data.discount.enabled
            ? data.discount.type === 'percentage'
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

    const handleSaveDraft = async (silent = false, createNewDraft = false) => {
        try {
            // Validate required fields
            if (!quotationData.quotationDate || !quotationData.dueDate) {
                setErrorMessage('Please fill in quotation date and due date')
                return
            }

            // Validate due date is not before quotation date
            if (new Date(quotationData.dueDate) < new Date(quotationData.quotationDate)) {
                setErrorMessage('Due date cannot be before quotation date')
                return
            }

            if (!quotationData.items || quotationData.items.length === 0) {
                setErrorMessage('Please add at least one item to the quotation')
                return
            }

            // Validate studio information
            if (!quotationData.studio.name || !quotationData.studio.name.trim()) {
                setErrorMessage('Studio name is required')
                return
            }

            if (!quotationData.studio.address || !quotationData.studio.address.trim()) {
                setErrorMessage('Studio address is required')
                return
            }

            if (!quotationData.studio.phone || !quotationData.studio.phone.trim()) {
                setErrorMessage('Studio phone number is required')
                return
            }

            // Calculate totals
            const totals = calculateTotals(quotationData)

            // Prepare data for API (remove id fields and sync total/amount)
            const itemsToSave = quotationData.items.map(item => {
                const amount = item.amount === undefined || item.amount === null
                    ? (item.total === '' || item.total === null ? 0 : Number(item.total))
                    : Number(item.amount)

                return {
                    event: item.event || item.description || '',
                    description: item.description || item.event || '',
                    date: item.date || undefined,
                    location: item.location || '',
                    crew: (item.crew || []).map(c => ({ name: c.name, cost: c.cost, pricingId: c.pricingId })),
                    equipment: (item.equipment || []).map(e => ({ name: e.name, cost: e.cost, pricingId: e.pricingId })),
                    packages: (item.packages || []).map(p => ({
                        name: p.name,
                        amount: p.amount,
                        pricingId: p.pricingId,
                        packageItems: p.packageItems || []
                    })),
                    amount: amount,
                    total: amount, // Keep total for backward compatibility
                    quantity: item.quantity || 1
                }
            })

            const paymentMilestonesToSave = quotationData.paymentMilestones.map(milestone => ({
                description: milestone.description,
                dueDate: milestone.dueDate,
                amount: milestone.amount === '' || milestone.amount === null ? 0 : Number(milestone.amount) || 0
            }))

            if (!leadId) {
                setErrorMessage('Lead not found. Please go back to the lead and try again.')
                setSavingDraft(false)
                return
            }

            const quotationToSave = {
                templateId: selectedTemplateId || (selectedTemplate?._id) || undefined,
                leadId: leadId,
                quotationDate: quotationData.quotationDate,
                dueDate: quotationData.dueDate,
                studio: {
                    name: quotationData.studio.name,
                    address: quotationData.studio.address,
                    gstNumber: quotationData.studio.gstNumber,
                    phone: quotationData.studio.phone,
                    logo: quotationData.studio.logo,
                    banner: quotationData.studio.banner
                }, // Send full studio object
                client: quotationData.client, // Send full client object for snapshot
                clientId: quotationData.clientId || leadId, // Keep for backward compatibility
                event: (quotationData.event.type || quotationData.event.date || quotationData.event.time || quotationData.event.location) ? {
                    type: quotationData.event.type || '',
                    date: quotationData.event.date || '',
                    time: quotationData.event.time || '',
                    location: quotationData.event.location || '',
                } : undefined,
                taxRate: quotationData.taxRate === '' || quotationData.taxRate === null ? 0 : Number(quotationData.taxRate) || 0,
                discount: {
                    enabled: quotationData.discount.enabled,
                    type: quotationData.discount.type,
                    value: quotationData.discount.value === '' || quotationData.discount.value === null ? 0 : Number(quotationData.discount.value) || 0
                },
                items: itemsToSave,
                paymentMilestones: paymentMilestonesToSave,
                paymentMethods: quotationData.paymentMethods,
                deliverables: quotationData.deliverables.map(d => ({ description: d.description, quantity: d.quantity })),
                complimentary: quotationData.complimentary.map(c => ({ description: c.description, quantity: c.quantity || 1 })),
                notes: quotationData.notes || '',
                termsAndConditions: quotationData.termsAndConditions || '',
                customization: quotationData.customization,
                background: quotationData.background,
                quotationBackground: quotationData.quotationBackground || quotationData.background,
                serviceColumns: quotationData.serviceColumns,
                ...totals
            }

            setSavingDraft(true)

            let response;
            if (activeQuotationId && !createNewDraft) {
                if (silent) {
                    const silentUpdateQuotation = quotationService.autoUpdateQuotation || updateQuotation
                    response = await silentUpdateQuotation(activeQuotationId, quotationToSave)
                } else {
                    response = await updateQuotation(activeQuotationId, quotationToSave)
                }
            } else {
                if (silent) {
                    const silentSaveQuotationDraft = quotationService.autoSaveQuotationDraft || saveQuotationDraft
                    response = await silentSaveQuotationDraft(quotationToSave)
                } else {
                    response = await saveQuotationDraft(quotationToSave)
                }
                const newId = response?.quotationId || response?.data?.quotationId || response?._id;
                if (newId) {
                    setActiveQuotationId(newId);
                    // Also update the URL silently so page reload keeps the context
                    window.history.replaceState({}, '', `/leads/${leadId}/quotation/${newId}`);
                    // Only perform a hard load during explicit user saves, not background auto-saves
                    if (!silent) {
                        await loadQuotationData(newId);
                    }
                }
            }

            // Auto-fill quotation number from backend response
            const responseData = response?.data || response;
            if (responseData?.quotationNumber && responseData.quotationNumber !== quotationData.quotationNumber) {
                setQuotationData(prev => ({
                    ...prev,
                    quotationNumber: responseData.quotationNumber
                }))
            }

            if (!silent) {
                // if (draftKey) {
                //     localStorage.removeItem(draftKey);
                // }
                setSuccessMessage('Draft saved successfully!')
                setTimeout(() => {
                    setSuccessMessage(null)
                }, 700)
            }
        } catch (error) {
            console.error('Error saving quotation:', error)
            if (!silent) {
                setErrorMessage(error.message || 'Failed to save quotation draft')
            }
        } finally {
            setSavingDraft(false)
        }
    }

    const latestQuotationRef = useRef(quotationData);
    const handleSaveDraftRef = useRef(handleSaveDraft);
    const lastSavedDataStr = useRef('');

    useEffect(() => {
        latestQuotationRef.current = quotationData;
        handleSaveDraftRef.current = handleSaveDraft;
    }, [quotationData, handleSaveDraft]);

    useEffect(() => {
        if (loading || !autoSaveEnabled) return;

        // Silent API save interval (exactly every 5000ms)
        const apiInterval = setInterval(() => {
            const currentData = latestQuotationRef.current;
            const currentStr = JSON.stringify(currentData);
            
            if (currentStr !== lastSavedDataStr.current) {
                if (currentData.quotationDate && currentData.dueDate && currentData.items && currentData.items.length > 0 && currentData.studio?.name) {
                    handleSaveDraftRef.current(true);
                    lastSavedDataStr.current = currentStr;
                }
            }
        }, 5000);

        return () => clearInterval(apiInterval);
    }, [autoSaveEnabled, loading]);

    const handleExportPDF = async () => {
        try {
            setExportingPdf(true)
            setErrorMessage(null)
            
            if (!quotationData.items || quotationData.items.length === 0) {
                setErrorMessage('Please add at least one item to the quotation before exporting')
                setExportingPdf(false)
                return
            }

            let currentQuotationId = quotationId || activeQuotationId

            // Calculate totals first
            const totals = calculateTotals(quotationData)

            // Prepare quotation data with totals
            const quotationToSave = {
                templateId: selectedTemplateId || (selectedTemplate?._id) || undefined,
                leadId: leadId,
                quotationDate: quotationData.quotationDate,
                dueDate: quotationData.dueDate,
                studio: {
                    name: quotationData.studio.name,
                    address: quotationData.studio.address,
                    gstNumber: quotationData.studio.gstNumber,
                    phone: quotationData.studio.phone,
                    logo: quotationData.studio.logo,
                    banner: quotationData.studio.banner
                },
                client: quotationData.client,
                clientId: quotationData.clientId || leadId,
                event: (quotationData.event.type || quotationData.event.date) ? {
                    type: quotationData.event.type || '',
                    date: quotationData.event.date || '',
                    time: quotationData.event.time || '',
                    location: quotationData.event.location || '',
                } : undefined,
                taxRate: quotationData.taxRate === '' || quotationData.taxRate === null ? 0 : Number(quotationData.taxRate) || 0,
                discount: {
                    enabled: quotationData.discount.enabled,
                    type: quotationData.discount.type,
                    value: quotationData.discount.value === '' || quotationData.discount.value === null ? 0 : Number(quotationData.discount.value) || 0
                },
                items: quotationData.items.map(item => {
                    const amount = item.amount === undefined || item.amount === null
                        ? (item.total === '' || item.total === null ? 0 : Number(item.total))
                        : Number(item.amount)
                    return {
                        event: item.event || item.description || '',
                        description: item.description || item.event || '',
                        date: item.date || undefined,
                        location: item.location || '',
                        crew: (item.crew || []).map(c => ({ name: c.name, cost: c.cost, pricingId: c.pricingId })),
                        equipment: (item.equipment || []).map(e => ({ name: e.name, cost: e.cost, pricingId: e.pricingId })),
                        packages: (item.packages || []).map(p => ({
                            name: p.name,
                            amount: p.amount,
                            pricingId: p.pricingId,
                            packageItems: p.packageItems || []
                        })),
                        amount: amount,
                        total: amount,
                        quantity: item.quantity || 1
                    }
                }),
                paymentMilestones: quotationData.paymentMilestones.map(milestone => ({
                    description: milestone.description,
                    dueDate: milestone.dueDate,
                    amount: milestone.amount === '' || milestone.amount === null ? 0 : Number(milestone.amount) || 0
                })),
                paymentMethods: quotationData.paymentMethods,
                deliverables: quotationData.deliverables.map(d => ({ description: d.description, quantity: d.quantity })),
                complimentary: quotationData.complimentary.map(c => ({ description: c.description, quantity: c.quantity || 1 })),
                notes: quotationData.notes || '',
                termsAndConditions: quotationData.termsAndConditions || '',
                customization: quotationData.customization,
                background: quotationData.background,
                quotationBackground: quotationData.quotationBackground || quotationData.background,
                serviceColumns: quotationData.serviceColumns,
                ...totals // Include calculated totals
            }

            // Save or update the quotation
            if (currentQuotationId) {
                await updateQuotation(currentQuotationId, quotationToSave)
            } else {
                const saved = await saveQuotationDraft(quotationToSave)
                currentQuotationId = saved?.quotationId || saved?.data?.quotationId || saved?._id || saved?.data?._id || currentQuotationId
            }

            if (!currentQuotationId) {
                throw new Error('Quotation id was not available for PDF export')
            }

            // Generate PDF and open preview in a new tab
            const pdfUrl = await exportQuotationToPdf(currentQuotationId, { force: true })
            if (!pdfUrl) {
                throw new Error('PDF URL not available')
            }
            openPdfInNewTab(pdfUrl)
            setSuccessMessage('PDF generated and opened in a new tab!')
        } catch (error) {
            console.error('Error exporting PDF:', error)
            setErrorMessage(error.message || 'Failed to export quotation PDF')
        } finally {
            setExportingPdf(false)
        }
    }

    const handleSendToClient = () => {
        setShowSendModal(true)
    }

    const handleSendQuotation = async (emailData) => {
        try {
            setLoading(true)
            setErrorMessage(null)

            // Validate required fields
            if (!quotationData.quotationDate || !quotationData.dueDate) {
                setErrorMessage('Please fill in quotation date and due date')
                setLoading(false)
                return
            }

            if (!quotationData.items || quotationData.items.length === 0) {
                setErrorMessage('Please add at least one item to the quotation')
                setLoading(false)
                return
            }

            // Validate studio information
            if (!quotationData.studio.name || !quotationData.studio.name.trim()) {
                setErrorMessage('Studio name is required')
                setLoading(false)
                return
            }

            if (!quotationData.studio.address || !quotationData.studio.address.trim()) {
                setErrorMessage('Studio address is required')
                setLoading(false)
                return
            }

            if (!quotationData.studio.phone || !quotationData.studio.phone.trim()) {
                setErrorMessage('Studio phone number is required')
                setLoading(false)
                return
            }

            let currentQuotationId = activeQuotationId || quotationId

            // Persist latest edits before sending without creating duplicate drafts.
            const quotationToSave = {
                templateId: selectedTemplateId || (selectedTemplate?._id) || undefined,
                leadId: leadId,
                quotationDate: quotationData.quotationDate,
                dueDate: quotationData.dueDate,
                studio: {
                    name: quotationData.studio.name,
                    address: quotationData.studio.address,
                    gstNumber: quotationData.studio.gstNumber,
                    phone: quotationData.studio.phone,
                    logo: quotationData.studio.logo,
                    banner: quotationData.studio.banner
                },
                client: quotationData.client,
                clientId: quotationData.clientId || leadId,
                event: (quotationData.event.type || quotationData.event.date || quotationData.event.time || quotationData.event.location) ? {
                    type: quotationData.event.type || '',
                    date: quotationData.event.date || '',
                    time: quotationData.event.time || '',
                    location: quotationData.event.location || '',
                } : undefined,
                taxRate: quotationData.taxRate === '' || quotationData.taxRate === null ? 0 : Number(quotationData.taxRate) || 0,
                discount: {
                    enabled: quotationData.discount.enabled,
                    type: quotationData.discount.type,
                    value: quotationData.discount.value === '' || quotationData.discount.value === null ? 0 : Number(quotationData.discount.value) || 0
                },
                items: quotationData.items.map(item => {
                    const amount = item.amount === undefined || item.amount === null
                        ? (item.total === '' || item.total === null ? 0 : Number(item.total))
                        : Number(item.amount)
                    return {
                        event: item.event || item.description || '',
                        description: item.description || item.event || '',
                        date: item.date || undefined,
                        location: item.location || '',
                        crew: (item.crew || []).map(c => ({ name: c.name, cost: c.cost, pricingId: c.pricingId })),
                        equipment: (item.equipment || []).map(e => ({ name: e.name, cost: e.cost, pricingId: e.pricingId })),
                        packages: (item.packages || []).map(p => ({
                            name: p.name,
                            amount: p.amount,
                            pricingId: p.pricingId,
                            packageItems: p.packageItems || []
                        })),
                        amount: amount,
                        total: amount,
                        quantity: item.quantity || 1
                    }
                }),
                paymentMilestones: quotationData.paymentMilestones.map(milestone => ({
                    description: milestone.description,
                    dueDate: milestone.dueDate,
                    amount: milestone.amount === '' || milestone.amount === null ? 0 : Number(milestone.amount) || 0
                })),
                paymentMethods: quotationData.paymentMethods,
                deliverables: quotationData.deliverables.map(d => ({ description: d.description, quantity: d.quantity })),
                complimentary: quotationData.complimentary.map(c => ({ description: c.description, quantity: c.quantity || 1 })),
                notes: quotationData.notes || '',
                termsAndConditions: quotationData.termsAndConditions || '',
                customization: quotationData.customization,
                background: quotationData.background,
                quotationBackground: quotationData.quotationBackground || quotationData.background,
                serviceColumns: quotationData.serviceColumns,
                ...calculateTotals(quotationData)
            }

            if (currentQuotationId) {
                await updateQuotation(currentQuotationId, quotationToSave)
            } else {
                const saved = await saveQuotationDraft(quotationToSave)
                currentQuotationId =
                    saved?.quotationId ||
                    saved?.data?.quotationId ||
                    saved?._id ||
                    saved?.data?._id ||
                    currentQuotationId

                if (currentQuotationId) {
                    setActiveQuotationId(currentQuotationId)
                }
            }

            if (!currentQuotationId) {
                throw new Error('Unable to send quotation because quotation id is missing')
            }

            // Send the quotation via email
            try {
                await sendQuotation(currentQuotationId, emailData)
            } catch (sendError) {
                // Log the error but don't fail the entire operation
                // The quotation draft is already saved and email might have been sent
                console.warn('Send quotation API error (email may have been sent successfully):', sendError)
                // Check if it's a network error after successful send
                if (sendError.message?.includes('Network Error') || sendError.code === 'ERR_NETWORK') {
                } else {
                    // Re-throw if it's a real error
                    throw sendError
                }
            }

            setSuccessMessage('Quotation sent to client successfully!')
            setTimeout(() => {
                navigate(`/leads/${leadId}`, { state: { fromQuotation: true } })
            }, 1500)
        } catch (error) {
            console.error('Error sending quotation:', error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Format phone number: +91 {space} {number}
    const formatPhoneNumber = (phone) => {
        if (!phone) return ''
        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, '')
        // If starts with 91, add + and space
        if (digits.startsWith('91') && digits.length > 2) {
            return `+91 ${digits.slice(2)}`
        }
        // If doesn't start with 91, add +91 and space
        if (digits.length > 0) {
            return `+91 ${digits}`
        }
        return phone
    }

    // Normalize phone number for storage (remove +91 and spaces)
    const normalizePhoneNumber = (phone) => {
        if (!phone) return ''
        return phone.replace(/\+91\s?/g, '').replace(/\s/g, '')
    }

    return (
        <>
            {successMessage && (
                <Success onClose={() => setSuccessMessage(null)} autoClose={true}>
                    {successMessage}
                </Success>
            )}

            {errorMessage && (
                <Error onClose={() => setErrorMessage(null)} autoClose={true}>
                    {errorMessage}
                </Error>
            )}

            <div className='h-dvh bg-gray-50 flex flex-col overflow-hidden'>
                {/* Header with Breadcrumb - Always visible */}
                <div className='shrink-0 bg-white border-b border-gray-200 px-6 py-4'>
                    <div className='max-w-480 mx-auto'>
                        <LeadBreadcrumb
                            leadId={leadId}
                            leadName={leadName || quotationData?.client?.name || lead?.name}
                            currentPage="Quotation"
                        />
                    </div>
                </div>

                {/* TWO PANEL WORKSPACE */}
                <div className='flex-1 flex flex-col lg:flex-row overflow-hidden relative min-h-0'>

                    {/* Left Panel: Editor */}
                    <div className='order-1 lg:order-0 w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white flex flex-col min-h-0'>
                        <div className='flex-1 min-h-0 overflow-y-auto'>
                            {loading ? (
                                <div className='p-6 space-y-4'>
                                    <Skeleton className='h-12 w-full' />
                                    <Skeleton className='h-32 w-full' />
                                    <Skeleton className='h-12 w-full' />
                                    <Skeleton className='h-40 w-full' />
                                </div>
                            ) : (
                                <QuotationEditor
                                    quotationData={quotationData}
                                    setQuotationData={setQuotationData}
                                    savingDraft={savingDraft}
                                    exportingPdf={exportingPdf}
                                    selectedTemplate={selectedTemplate}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Preview */}
                    <div className='order-2 lg:order-0 w-full lg:w-1/2 bg-gray-50 flex flex-col lg:border-t-0 border-t min-h-0'>
                        {/* Right Panel Header: Primary Actions */}
                        <div className='shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm z-30 sticky top-0'>
                            <div className='flex flex-wrap items-center gap-2'>
                                <button
                                    type='button'
                                    onClick={() => handleSaveDraft(false, false)}
                                    disabled={savingDraft || exportingPdf}
                                    className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm text-gray-700 disabled:opacity-50 hover:shadow-sm'
                                >
                                    {savingDraft ? <div className='animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent'></div> : <Save size={16} />}
                                    {savingDraft ? 'Saving...' : 'Save Draft'}
                                </button>
                                <button
                                    type='button'
                                    onClick={handleExportPDF}
                                    disabled={savingDraft || exportingPdf}
                                    className='flex items-center gap-2 px-4 py-2 border border-primary-dark text-primary-dark rounded-lg hover:bg-primary/5 transition-all font-medium text-sm disabled:opacity-50 hover:shadow-sm'
                                >
                                    {exportingPdf ? <div className='animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent'></div> : <Download size={16} />}
                                    {exportingPdf ? 'Exporting...' : 'Export PDF'}
                                </button>
                            </div>
                            <button
                                type='button'
                                onClick={handleSendToClient}
                                className='flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-medium text-sm shadow-sm'
                            >
                                <Send size={16} /> Send to Client
                            </button>
                        </div>

                        {/* Right Panel Header: Template & Auto-Save */}
                        <div className='shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 shadow-sm z-20 sticky top-27 sm:top-15.25'>
                            {/* Highlighted Template Selector */}
                            <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
                                <div className='flex items-center gap-1.5 mr-1 shrink-0'>
                                    <LayoutTemplate size={16} className='text-primary shrink-0' />
                                    <span className='text-xs font-bold text-gray-700 tracking-wide'>Template : </span>
                                </div>
                                <div className='relative'>
                                    <button
                                        onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                                        className='flex items-center gap-2 pl-3 pr-2 py-1.5 text-sm border-2 border-primary/40 rounded-lg bg-primary/5 text-primary-dark hover:border-primary/60 hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm font-medium'
                                    >

                                        <span>
                                            {effectiveSelectedTemplate?.name || 'Select a template'}
                                        </span>
                                        <ChevronDown size={14} className='text-primary' />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showTemplateMenu && (
                                        <>
                                            <div
                                                className='fixed inset-0 z-40'
                                                onClick={() => setShowTemplateMenu(false)}
                                            />
                                            <div className='absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 font-medium'>
                                                <div className='px-4 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center'>
                                                    <span className='text-xs text-gray-500 uppercase font-bold tracking-wider'>Available Templates</span>
                                                    <a href='/templates' target='_blank' rel='noreferrer' className='text-xs text-primary hover:underline flex items-center gap-1'>Manage</a>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        applyTemplate('')
                                                        setShowTemplateMenu(false)
                                                    }}
                                                    className='w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors border-b border-gray-100 flex items-center gap-2'
                                                >
                                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${!effectiveSelectedTemplateId ? 'border-primary' : 'border-gray-300'}`}>
                                                        {!effectiveSelectedTemplateId && <span className='w-2 h-2 rounded-full bg-primary'></span>}
                                                    </span>
                                                    Default (No Template)
                                                </button>
                                                {availableTemplates.map(t => (
                                                    <button
                                                        key={getTemplateId(t)}
                                                        onClick={() => {
                                                            applyTemplate(getTemplateId(t))
                                                            setShowTemplateMenu(false)
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${effectiveSelectedTemplateId === getTemplateId(t) ? 'text-primary bg-primary/5' : 'text-gray-700'
                                                            }`}
                                                    >
                                                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${effectiveSelectedTemplateId === getTemplateId(t) ? 'border-primary' : 'border-gray-300'}`}>
                                                            {effectiveSelectedTemplateId === getTemplateId(t) && <span className='w-2 h-2 rounded-full bg-primary'></span>}
                                                        </span>
                                                        <span className='truncate'>{t.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Auto Save Toggle */}
                            <label className='flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto'>
                                <span className='text-sm font-semibold text-gray-700'>Auto Save</span>
                                <div className='relative'>
                                    <input
                                        type='checkbox'
                                        className='sr-only'
                                        checked={autoSaveEnabled}
                                        onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-5 rounded-full transition-colors ${autoSaveEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${autoSaveEnabled ? 'transform translate-x-5' : ''}`}></div>
                                </div>
                            </label>
                        </div>

                        <div className='flex-1 min-h-0 overflow-y-auto'>
                            {loading ? (
                                <div className='p-6 space-y-4'>
                                    <Skeleton className='h-24 w-full' />
                                    <Skeleton className='h-32 w-full' />
                                    <Skeleton className='h-40 w-full' />
                                </div>
                            ) : (
                                <QuotationPreview quotationData={quotationData} selectedTemplate={effectiveSelectedTemplate} />
                            )}
                        </div>
                    </div>
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
