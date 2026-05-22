import React from 'react'
import { X, Plus, Trash2, Calendar, Clock, MapPin, Users, IndianRupee, Info, PlusCircle, CheckCircle2, ChevronDown, ChevronUp, ChevronRight, Layout, LayoutTemplate, Edit, Save, Send, Eye, FileText, Settings, HelpCircle, Download, Share2, Copy, MoreHorizontal, Check, AlertCircle, Trash, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { DatePicker, TimePicker, ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)
import { LoadingSpinner } from '../../../../Components/Loading/LoadingSpinner'
import { getPricingItems } from '../../../../services/pricingService'
import { uploadMultipleImages, getImages } from '../../../../services/leadFormImageService'
import { toast } from 'react-toastify'
import { isValidSocialLinkValue, SOCIAL_LINK_FIELDS } from '../../../../utils/socialLinkUtils'

const noSpinButtonsStyle = `
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`

export const QuotationEditor = ({
    quotationData,
    setQuotationData,
    selectedTemplate
}) => {
    // Derive field visibility from active template (default: show when undefined)
    const tplFields = selectedTemplate?.fields || null
    const show = (key) => !tplFields || tplFields[key] !== false
    const tplColumns = quotationData.serviceColumns || selectedTemplate?.serviceColumns || {}
    const showCol = (key) => tplColumns[key] !== false
    const showPortfolioCoverSection = false

    const [expandedSections, setExpandedSections] = React.useState({
        studio: true,
        client: true,
        quotation: true,
        event: true,
        portfolio: false,
        welcome: true,
        items: true,
        deliverables: false,
        complimentary: false,
        payment: true,
        methods: false,
        additional: quotationData.notes || quotationData.termsAndConditions ? true : false,
    })

    const toggleSection = (section) =>
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))

    const [quotationBackgrounds, setQuotationBackgrounds] = React.useState([])
    const [loadingImages, setLoadingImages] = React.useState(false)
    const [uploadingBg, setUploadingBg] = React.useState(false)
    const fileInputRef = React.useRef(null)
    const [socialErrors, setSocialErrors] = React.useState({})
    const [selectedPortfolioBgPage, setSelectedPortfolioBgPage] = React.useState('page1')

    React.useEffect(() => {
        const loadImages = async () => {
            try {
                setLoadingImages(true)
                const response = await getImages('quotationBackground')
                if (response.success && response.data.quotationBackground) {
                    setQuotationBackgrounds(response.data.quotationBackground.images || [])
                }
            } catch (err) {
                console.error("Failed to load images", err)
            } finally {
                setLoadingImages(false)
            }
        }
        loadImages()
    }, [])

    const handleFileUpload = async (e) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        try {
            setUploadingBg(true)
            const response = await uploadMultipleImages(Array.from(files), 'quotationBackground')
            if (response.success) {
                toast?.success('Images uploaded successfully')
                const imgsResponse = await getImages('quotationBackground')
                if (imgsResponse.success && imgsResponse.data.quotationBackground) {
                    setQuotationBackgrounds(imgsResponse.data.quotationBackground.images || [])
                }
            }
        } catch (err) {
            toast?.error(err.message || 'Failed to upload images')
        } finally {
            setUploadingBg(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const updateCustomization = (field, value) => {
        setQuotationData(prev => ({
            ...prev,
            customization: { ...(prev.customization || {}), [field]: value }
        }))
    }

    const getPortfolioPageCount = () => {
        const imageCount = quotationData.customization?.portfolioImages?.length || 0
        return Math.max(1, Math.ceil(imageCount / 6))
    }

    const getPortfolioPageOptions = () => {
        return Array.from({ length: getPortfolioPageCount() }, (_, index) => ({
            key: `page${index + 1}`,
            label: `Page ${index + 1}`,
        }))
    }

    const getPortfolioPageBackground = (pageKey) => {
        const pageMap = quotationData.customization?.portfolioPageBackgrounds || {}
        return pageMap[pageKey] || null
    }

    const updatePortfolioPageBackground = (pageKey, patch) => {
        const currentMap = quotationData.customization?.portfolioPageBackgrounds || {}
        const currentPageBg = currentMap[pageKey] || {}
        updateCustomization('portfolioPageBackgrounds', {
            ...currentMap,
            [pageKey]: {
                ...currentPageBg,
                ...patch,
            },
        })
    }

    const clearPortfolioPageBackground = (pageKey) => {
        const currentMap = quotationData.customization?.portfolioPageBackgrounds || {}
        const nextMap = { ...currentMap }
        delete nextMap[pageKey]
        updateCustomization('portfolioPageBackgrounds', nextMap)
    }

    const togglePortfolioImage = (url) => {
        const current = quotationData.customization?.portfolioImages || []
        const exists = current.includes(url)
        const next = exists ? current.filter(img => img !== url) : [...current, url]
        updateCustomization('portfolioImages', next)
        updateCustomization('showPortfolio', next.length > 0)
    }

    const getIntroPageBackground = () => {
        return quotationData.customization?.introPageBackground || {}
    }

    const updateIntroPageBackground = (patch) => {
        const current = getIntroPageBackground()
        updateCustomization('introPageBackground', {
            ...current,
            ...patch,
        })
    }

    const clearIntroPageBackground = () => {
        updateCustomization('introPageBackground', {})
    }

    const handleSocialInputChange = (field, value) => {
        updateCustomization(field, value)

        const normalized = value.trim()
        if (!normalized || isValidSocialLinkValue(field, normalized)) {
            setSocialErrors(prev => {
                if (!prev[field]) return prev
                const next = { ...prev }
                delete next[field]
                return next
            })
        }
    }

    const handleSocialInputBlur = (field, value) => {
        const normalized = value.trim()
        if (!normalized) {
            setSocialErrors(prev => {
                if (!prev[field]) return prev
                const next = { ...prev }
                delete next[field]
                return next
            })
            return
        }

        if (!isValidSocialLinkValue(field, normalized)) {
            setSocialErrors(prev => ({
                ...prev,
                [field]: field === 'website'
                    ? 'Please use a full URL starting with http:// or https://'
                    : 'Use full URL or @handle',
            }))
        }
    }

    // Pricing Items
    const [pricingItems, setPricingItems] = React.useState([])
    React.useEffect(() => {
        getPricingItems().then(data => setPricingItems(data || []))
    }, [])

    const [activeDropdown, setActiveDropdown] = React.useState(null) // { type: 'deliverables'|'complimentary', index: number }
    const [dropdownSearch, setDropdownSearch] = React.useState('')
    
    // ── Data helpers ─────────────────────────────────────────────────────────
    const updateField = (section, field, value) =>
        setQuotationData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))

    const updateTop = (field, value) =>
        setQuotationData(prev => ({ ...prev, [field]: value }))

    const parseDateRange = (dateStr, timeStr) => {
        if (!dateStr) return null;
        if (dateStr.includes(' - ')) {
            const [start, end] = dateStr.split(' - ');
            const hasTime = start.includes(':');
            const hasComma = start.includes(',');

            let fmt = 'YYYY-MM-DD';
            if (hasComma && hasTime) fmt = 'MMM D, YYYY h:mm A';
            else if (hasComma) fmt = 'MMM D, YYYY';
            else if (hasTime) fmt = 'YYYY-MM-DD h:mm A';

            const s = dayjs(start, fmt, true);
            const e = dayjs(end, fmt, true);

            if (s.isValid() && e.isValid()) return [s, e];

            // Fallback to loose parsing if strict fails
            return [dayjs(start), dayjs(end)];
        }
        // Legacy separated
        const d = dayjs(dateStr);
        if (!timeStr) return d.isValid() ? [d, d] : null;
        const [tStart, tEnd] = timeStr.split(' - ');

        // Try various formats for legacy time
        const formats = ['h:mm A', 'h:mm a', 'H:mm'];
        let s = d, e = d;

        for (const f of formats) {
            const ts = dayjs(`${dateStr} ${tStart}`, `YYYY-MM-DD ${f}`, true);
            if (ts.isValid()) { s = ts; break; }
        }
        for (const f of formats) {
            const te = dayjs(`${dateStr} ${tEnd}`, `YYYY-MM-DD ${f}`, true);
            if (te.isValid()) { e = te; break; }
        }

        return [s, e];
    };

    // Phone formatting
    const formatPhone = (phone) => {
        if (!phone) return ''
        const digits = phone.replace(/\D/g, '')
        if (digits.startsWith('91') && digits.length > 2) return `+91 ${digits.slice(2)}`
        if (digits.length > 0) return `+91 ${digits}`
        return phone
    }
    const handlePhoneChange = (section, field, value) => {
        const norm = value.replace(/\+91\s?/g, '').replace(/\s/g, '')
        updateField(section, field, formatPhone(norm))
    }

    // Items (Services)
    const addItem = () => setQuotationData(prev => ({
        ...prev,
        items: [...prev.items, {
            id: Date.now().toString(),
            event: '',
            date: '',
            location: '',
            crew: [],
            equipment: [],
            amount: 0
        }]
    }))

    const updateItem = (id, field, value) => setQuotationData(prev => ({
        ...prev,
        items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }))

    const updateServiceItemSubList = (itemId, type, action, payload) => {
        setQuotationData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id !== itemId) return item

                let newSubList = [...(item[type] || [])]
                if (action === 'add') {
                    newSubList.push(payload)
                } else if (action === 'remove') {
                    newSubList = newSubList.filter((_, i) => i !== payload)
                }

                // Recalculate amount
                const currentCrew = type === 'crew' ? newSubList : (item.crew || [])
                const currentEquip = type === 'equipment' ? newSubList : (item.equipment || [])
                const currentPackages = type === 'packages' ? newSubList : (item.packages || [])

                const crewTotal = currentCrew.reduce((sum, x) => sum + (Number(x.cost) || 0), 0)
                const equipTotal = currentEquip.reduce((sum, x) => sum + (Number(x.cost) || 0), 0)
                const packageTotal = currentPackages.reduce((sum, x) => sum + (Number(x.amount) || 0), 0)

                return {
                    ...item,
                    [type]: newSubList,
                    amount: crewTotal + equipTotal + packageTotal
                }
            })
        }))
    }

    const removeItem = (id) => setQuotationData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))

    const moveItemUp = (id) => setQuotationData(prev => {
        const idx = prev.items.findIndex(i => i.id === id)
        if (idx <= 0) return prev
        const items = [...prev.items]
        ;[items[idx - 1], items[idx]] = [items[idx], items[idx - 1]]
        return { ...prev, items }
    })

    const moveItemDown = (id) => setQuotationData(prev => {
        const idx = prev.items.findIndex(i => i.id === id)
        if (idx < 0 || idx >= prev.items.length - 1) return prev
        const items = [...prev.items]
        ;[items[idx], items[idx + 1]] = [items[idx + 1], items[idx]]
        return { ...prev, items }
    })

    // Deliverables
    const addDeliverable = () => setQuotationData(prev => ({
        ...prev,
        deliverables: [...(prev.deliverables || []), { id: Date.now().toString(), description: '', quantity: 1 }]
    }))
    const updateDeliverable = (id, field, value) => setQuotationData(prev => ({
        ...prev,
        deliverables: (prev.deliverables || []).map(d => d.id === id ? { ...d, [field]: value } : d)
    }))
    const removeDeliverable = (id) => setQuotationData(prev => ({
        ...prev,
        deliverables: (prev.deliverables || []).filter(d => d.id !== id)
    }))

    // Complimentary
    const addComplimentary = () => setQuotationData(prev => ({
        ...prev,
        complimentary: [...(prev.complimentary || []), { id: Date.now().toString(), description: '', quantity: 1 }]
    }))
    const updateComplimentary = (id, field, value) => setQuotationData(prev => ({
        ...prev,
        complimentary: (prev.complimentary || []).map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
    const removeComplimentary = (id) => setQuotationData(prev => ({
        ...prev,
        complimentary: (prev.complimentary || []).filter(c => c.id !== id)
    }))

    // Milestones
    const addMilestone = () => setQuotationData(prev => ({
        ...prev,
        paymentMilestones: [...prev.paymentMilestones, { id: Date.now().toString(), description: '', dueDate: '', amount: '' }]
    }))
    const updateMilestone = (id, field, value) => setQuotationData(prev => ({
        ...prev,
        paymentMilestones: prev.paymentMilestones.map(m => m.id === id ? { ...m, [field]: value } : m)
    }))
    const removeMilestone = (id) => setQuotationData(prev => ({
        ...prev,
        paymentMilestones: prev.paymentMilestones.filter(m => m.id !== id)
    }))

    // ── UI helpers ────────────────────────────────────────────────────────────
    const ic = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent'
    const ic_lg = 'w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent'
    const lc = 'block text-xs font-medium text-gray-700 mb-1'

    const SectionHeader = ({ title, section, badge }) => (
        <button
            onClick={() => toggleSection(section)}
            className='w-full flex items-center justify-between p-4 bg-primary-dark text-white transition-colors border-b border-primary'
        >
            <div className='flex items-center gap-2'>
                <h3 className='text-sm font-semibold'>{title}</h3>
                {badge && <span className='text-xs bg-white/20 px-1.5 py-0.5 rounded-full'>{badge}</span>}
            </div>
            {expandedSections[section] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
    )

    const AddBtn = ({ onClick, label }) => (
        <button
            onClick={onClick}
            className='w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-primary-dark hover:text-primary-dark transition-colors'
        >
            <Plus size={16} /> {label}
        </button>
    )

    const RemoveBtn = ({ onClick }) => (
        <button onClick={onClick} className='text-red-500 hover:text-red-700 transition-colors'>
            <Trash2 size={15} />
        </button>
    )

    // Pre-populate from template when field is empty
    const tplNote = selectedTemplate?.fields?.notes !== false ? (quotationData.notes || selectedTemplate?.notes || '') : ''
    const tplTnC = selectedTemplate?.fields?.termsAndConditions !== false ? (quotationData.termsAndConditions || selectedTemplate?.termsAndConditions || '') : ''

    return (
        <div className='h-full quotation-editor'>
            <style>{noSpinButtonsStyle}</style>

            {/* ── Template Banner ──────────────────────────────────────────── */}
            {selectedTemplate && (
                <div className='mx-4 mt-3 mb-1 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2'>
                    <LayoutTemplate size={13} className='text-primary shrink-0' />
                    <span className='text-xs text-primary font-medium flex-1'>
                        Template: <span className='font-semibold'>{selectedTemplate.name}</span>
                    </span>
                    <span className='text-xs text-gray-400'>Sections controlled by template</span>
                </div>
            )}

            {/* ── STUDIO DETAILS ───────────────────────────────────────────── */}
            {show('studioHeader') && (
                <div className='border-b border-gray-200'>
                    <SectionHeader title='Studio Details' section='studio' />
                    {expandedSections.studio && (
                        <div className='p-4 space-y-3'>
                            <div>
                                <label className={lc}>Studio Name</label>
                                <input type='text' value={quotationData.studio?.name || ''} onChange={e => updateField('studio', 'name', e.target.value)} className={ic} placeholder='Your Studio Name' />
                            </div>
                            <div>
                                <label className={lc}>Address <span className='font-normal text-gray-400'>(override for this quotation)</span></label>
                                <input type='text' value={quotationData.studio?.address || ''} onChange={e => updateField('studio', 'address', e.target.value)} className={ic} placeholder='Studio Address' />
                                <p className='text-[10px] text-gray-400 mt-1'>Editing this address only affects this quotation — your profile address is unchanged.</p>
                            </div>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className={lc}>GST Number</label>
                                    <input
                                        type='text'
                                        value={quotationData.studio?.gstNumber || ''}
                                        onChange={e => { if (e.target.value.length <= 15 && /^[a-zA-Z0-9]*$/.test(e.target.value)) updateField('studio', 'gstNumber', e.target.value) }}
                                        className={ic}
                                        placeholder='GSTIN'
                                    />
                                </div>
                                <div>
                                    <label className={lc}>Phone</label>
                                    <input type='text' value={quotationData.studio?.phone || ''} onChange={e => handlePhoneChange('studio', 'phone', e.target.value)} className={ic} placeholder='+91 98765 43210' />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── CLIENT DETAILS ───────────────────────────────────────────── */}
            {show('clientDetails') && (
                <div className='border-b border-gray-200'>
                    <SectionHeader title='Client Details' section='client' />
                    {expandedSections.client && (
                        <div className='p-4 space-y-3'>
                            <div>
                                <label className={lc}>Client Name</label>
                                <input type='text' value={quotationData.client?.name || ''} onChange={e => updateField('client', 'name', e.target.value)} className={ic} placeholder='Client Name' />
                            </div>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className={lc}>Email</label>
                                    <input type='email' value={quotationData.client?.email || ''} onChange={e => updateField('client', 'email', e.target.value)} className={ic} placeholder='client@email.com' />
                                </div>
                                <div>
                                    <label className={lc}>Phone</label>
                                    <input type='text' value={quotationData.client?.phone || ''} onChange={e => handlePhoneChange('client', 'phone', e.target.value)} className={ic} placeholder='+91 98765 43210' />
                                </div>
                            </div>
                            <div>
                                <label className={lc}>Address</label>
                                <input type='text' value={quotationData.client?.address || ''} onChange={e => updateField('client', 'address', e.target.value)} className={ic} placeholder='Client Address' />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── QUOTATION DETAILS ────────────────────────────────────────── */}
            <div className='border-b border-gray-200'>
                <SectionHeader title='Quotation Details' section='quotation' />
                {expandedSections.quotation && (
                    <div className='p-4 space-y-3'>
                        <div>
                            <label className={lc}>Quotation Number</label>
                            <input
                                type='text'
                                value={quotationData.quotationNumber || ''}
                                disabled
                                placeholder='Auto-generated after saving'
                                className={`${ic} bg-gray-100 cursor-not-allowed`}
                            />
                            <p className='text-xs text-gray-500 mt-1'>{quotationData.quotationNumber ? 'Auto-generated' : 'Will be auto-generated after saving'}</p>
                        </div>
                        <div>
                            <label className={lc}>Event Name</label>
                            <input
                                type='text'
                                value={quotationData.eventName || ''}
                                onChange={e => updateTop('eventName', e.target.value)}
                                className={ic}
                                placeholder='e.g. Sarah & John Wedding'
                            />
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div>
                                <label className={lc}>Quotation Date</label>
                                <DatePicker
                                    value={quotationData.quotationDate ? dayjs(quotationData.quotationDate) : null}
                                    onChange={date => updateTop('quotationDate', date ? date.format('YYYY-MM-DD') : '')}
                                    format='DD/MM/YYYY' placeholder='dd/mm/yyyy' className='w-full' style={{ height: '38px' }}
                                    classNames={{ popup: { root: 'small-calendar' } }}
                                />
                            </div>
                            <div>
                                <label className={lc}>Valid Till</label>
                                <DatePicker
                                    value={quotationData.dueDate ? dayjs(quotationData.dueDate) : null}
                                    onChange={date => updateTop('dueDate', date ? date.format('YYYY-MM-DD') : '')}
                                    format='DD/MM/YYYY' placeholder='dd/mm/yyyy' className='w-full' style={{ height: '38px' }}
                                    classNames={{ popup: { root: 'small-calendar' } }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={lc}>Tax / GST Rate (%)</label>
                            <input
                                type='number'
                                value={quotationData.taxRate === 0 ? '' : quotationData.taxRate}
                                onChange={e => updateTop('taxRate', e.target.value)}
                                className={ic} min='0' max='100' placeholder='0'
                            />
                        </div>
                        <div>
                            <label className='flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={quotationData.discount?.enabled || false}
                                    onChange={e => setQuotationData(prev => ({ ...prev, discount: { ...prev.discount, enabled: e.target.checked } }))}
                                    className='rounded'
                                />
                                Apply Discount
                            </label>
                            {quotationData.discount?.enabled && (
                                <div className='grid grid-cols-2 gap-3 mt-2'>
                                    <select
                                        value={quotationData.discount?.type || 'percentage'}
                                        onChange={e => setQuotationData(prev => ({ ...prev, discount: { ...prev.discount, type: e.target.value } }))}
                                        className={ic}
                                    >
                                        <option value='percentage'>Percentage (%)</option>
                                        <option value='fixed'>Fixed Amount (₹)</option>
                                    </select>
                                    <input
                                        type='number'
                                        value={quotationData.discount?.value === 0 ? '' : quotationData.discount?.value}
                                        onChange={e => setQuotationData(prev => ({ ...prev, discount: { ...prev.discount, value: e.target.value } }))}
                                        className={ic} placeholder='0' min='0'
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── EVENT DETAILS ─────────────────────────────────────────────── */}
            {show('eventDetails') && (
                <div className='border-b border-gray-200'>
                    <SectionHeader title='Event Details' section='event' />
                    {expandedSections.event && (
                        <div className='p-4 space-y-3'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className={lc}>Event Type</label>
                                    <input type='text' value={quotationData.event?.type || ''} onChange={e => updateField('event', 'type', e.target.value)} className={ic} placeholder='e.g. Hindu Wedding, Engagement' />
                                </div>
                                <div>
                                    <label className={lc}>Venue / Location</label>
                                    <input type='text' value={quotationData.event?.location || ''} onChange={e => updateField('event', 'location', e.target.value)} className={ic} placeholder='e.g. Taj Falaknuma Palace' />
                                </div>
                            </div>
                            <div>
                                <label className={lc}>Event Date & Time</label>
                                <DatePicker.RangePicker
                                    showTime={{ format: 'h:mm A', use12Hours: true }}
                                    format='MMM D, YYYY h:mm A'
                                    value={parseDateRange(quotationData.event?.date, quotationData.event?.time)}
                                    onChange={(dates, dateStrings) => {
                                        if (dateStrings && dateStrings[0] && dateStrings[1]) {
                                            updateField('event', 'date', `${dateStrings[0]} - ${dateStrings[1]}`);
                                            updateField('event', 'time', ''); // clear legacy time
                                        } else {
                                            updateField('event', 'date', '');
                                            updateField('event', 'time', '');
                                        }
                                    }}
                                    className='w-full' style={{ height: '38px' }}
                                    placeholder={['Start Date & Time', 'End Date & Time']}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── PORTFOLIO / COVER PAGE ─────────────────────────────────── */}
            {showPortfolioCoverSection && (
            <div className='border-b border-gray-200'>
                <SectionHeader title='Portfolio / Cover Page' section='portfolio' />
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="absolute opacity-0 w-0 h-0 pointer-events-none" disabled={uploadingBg} />
                {expandedSections.portfolio && (
                    <div className='p-4 space-y-4'>
                        {/* Social links */}
                        <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-200">
                             <h4 className="text-xs font-bold text-gray-700 mb-2">Cover Page Handles</h4>
                                 <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mb-2">
                                     <table className="w-full text-left border-collapse">
                                         <thead>
                                             <tr className="bg-gray-50 border-b border-gray-200">
                                                 <th className="px-3 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider w-1/4">Platform</th>
                                                 <th className="px-3 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Handle / URL</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-100">
                                              {[ {id: 'website', l: 'Website'}, {id: 'instagram', l: 'Instagram'}, {id: 'youtube', l: 'YouTube'}, {id: 'facebook', l: 'Facebook'} ].map(social => (
                                                  <tr key={social.id} className="hover:bg-gray-50/50">
                                                      <td className="px-3 py-1.5 align-middle text-xs font-medium text-gray-600 bg-gray-50/30">{social.l}</td>
                                                      <td className="px-2 py-1.5 align-middle">
                                                          <input 
                                                              type="text" 
                                                              value={quotationData.customization?.[social.id] || ''} 
                                                              onChange={e => handleSocialInputChange(social.id, e.target.value)}
                                                              onBlur={e => handleSocialInputBlur(social.id, e.target.value)}
                                                              className={`w-full px-2 py-1 border rounded text-xs bg-transparent focus:bg-white outline-none ${socialErrors[social.id] ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                                                              placeholder={social.id === 'website' ? 'https://...' : '@handle or https://...'}
                                                          />
                                                          {socialErrors[social.id] && (
                                                              <p className="text-[10px] text-red-500 mt-1">{socialErrors[social.id]}</p>
                                                          )}
                                                      </td>
                                                  </tr>
                                              ))}
                                         </tbody>
                                     </table>
                                 </div>
                                 {SOCIAL_LINK_FIELDS.some((field) => socialErrors[field]) && (
                                     <p className="text-[11px] text-red-500 mt-2">Use http(s) links, or @handle for Instagram/Facebook/YouTube.</p>
                                 )}
                        </div>

                        {/* Description */}
                        <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-200">
                             <label className="block text-xs font-bold text-gray-700 mb-1">Intro Page Description</label>
                             <textarea 
                                 value={quotationData.customization?.coverDescription || ''} 
                                 onChange={e => updateCustomization('coverDescription', e.target.value)} 
                                 className={`${ic_lg} resize-none`} 
                                 rows={5} 
                                 placeholder="Hello,\nThank you for trusting... (Intro page text)" 
                             />
                        </div>

                        {/* Featured On */}
                        <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-200">
                             <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1">
                                 <label className="block text-xs font-bold text-gray-700">Featured On (Publications/Press)</label>
                                 <button type="button" onClick={() => {
                                      const current = quotationData.customization?.featuredOnItems || []
                                      updateCustomization('featuredOnItems', [...current, { name: '', url: '' }])
                                 }} className="text-xs text-primary-dark font-semibold hover:underline">+ Add Link</button>
                             </div>
                             {(quotationData.customization?.featuredOnItems || []).length > 0 ? (
                                 <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                     <table className="w-full text-left border-collapse">
                                         <thead>
                                             <tr className="bg-gray-50 border-b border-gray-200">
                                                 <th className="px-3 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Source Name</th>
                                                 <th className="px-3 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">URL</th>
                                                 <th className="px-3 py-2 w-8"></th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-100">
                                             {(quotationData.customization?.featuredOnItems || []).map((item, idx) => (
                                                 <tr key={idx} className="hover:bg-gray-50/50">
                                                     <td className="px-2 py-1.5 align-middle">
                                                         <input 
                                                             type="text" 
                                                             value={item.name} 
                                                             onChange={e => {
                                                                 const current = [...(quotationData.customization?.featuredOnItems || [])]
                                                                 current[idx].name = e.target.value
                                                                 updateCustomization('featuredOnItems', current)
                                                             }} 
                                                             className="w-full px-2 py-1 border border-transparent rounded text-xs bg-transparent focus:bg-white focus:border-gray-200 outline-none" 
                                                             placeholder="Vogue" 
                                                         />
                                                     </td>
                                                     <td className="px-2 py-1.5 align-middle">
                                                         <input 
                                                             type="text" 
                                                             value={item.url} 
                                                             onChange={e => {
                                                                 const current = [...(quotationData.customization?.featuredOnItems || [])]
                                                                 current[idx].url = e.target.value
                                                                 updateCustomization('featuredOnItems', current)
                                                             }} 
                                                             className="w-full px-2 py-1 border border-transparent rounded text-xs bg-transparent focus:bg-white focus:border-gray-200 outline-none" 
                                                             placeholder="https://..." 
                                                         />
                                                     </td>
                                                     <td className="px-2 py-1.5 text-center align-middle">
                                                         <button 
                                                             type="button" 
                                                             onClick={() => {
                                                                 const current = (quotationData.customization?.featuredOnItems || []).filter((_, i) => i !== idx)
                                                                 updateCustomization('featuredOnItems', current)
                                                             }} 
                                                             className="text-red-400 hover:text-red-600 font-bold"
                                                         >✕</button>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             ) : (
                                 <div className="text-center py-4 bg-white rounded-lg border border-gray-100 border-dashed text-gray-400 text-xs">No publication features added</div>
                             )}
                        </div>

                        {/* Portfolio Photos */}
                        <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1">
                                <h4 className="text-xs font-bold text-gray-700">Portfolio Photos</h4>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[10px] bg-primary-dark text-white px-2 py-0.5 rounded-lg hover:bg-primary-dark/90 shadow-sm"
                                >
                                    {uploadingBg ? 'Uploading...' : 'Upload New'}
                                </button>
                            </div>
                            {loadingImages ? (
                                <div className="text-center py-4 text-gray-400 text-xs">Loading images...</div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 pr-1 max-h-48 overflow-y-auto">
                                    {(quotationBackgrounds || []).map((url, i) => {
                                        const isSelected = (quotationData.customization?.portfolioImages || []).includes(url)
                                        return (
                                            <div
                                                key={i}
                                                className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer aspect-video ${isSelected ? 'border-primary-dark shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                                onClick={() => togglePortfolioImage(url)}
                                            >
                                                <img src={url} alt={`Portfolio photo ${i + 1}`} className="w-full h-full object-cover" />
                                                {isSelected && (
                                                    <div className="absolute top-1 left-1 bg-primary-dark text-white p-0.5 rounded shadow-sm">
                                                        <Check size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            <p className="text-[10px] text-gray-500 mt-2">
                                Selected photos are auto-grouped into pages of 6 for preview and PDF.
                            </p>
                        </div>

                        {/* Portfolio Backgrounds */}
                        <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1">
                                <h4 className="text-xs font-bold text-gray-700">Portfolio Backgrounds</h4>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[10px] bg-primary-dark text-white px-2 py-0.5 rounded-lg hover:bg-primary-dark/90 shadow-sm"
                                >
                                    {uploadingBg ? 'Uploading...' : 'Upload New'}
                                </button>
                            </div>

                            <div className="mb-4 p-2 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500">Intro Page Background</label>
                                    <button
                                        type="button"
                                        onClick={clearIntroPageBackground}
                                        className="px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] font-medium hover:bg-red-100 transition-all"
                                    >
                                        Clear Intro
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3 max-h-32 overflow-y-auto">
                                    {(quotationBackgrounds || []).map((url, i) => {
                                        const introBg = getIntroPageBackground()
                                        const isSelected = introBg?.type === 'image' && introBg?.imageUrl === url
                                        return (
                                            <div
                                                key={`intro-${i}`}
                                                className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer aspect-video ${isSelected ? 'border-primary-dark shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                                onClick={() => updateIntroPageBackground({
                                                    type: 'image',
                                                    imageUrl: url,
                                                })}
                                            >
                                                <img src={url} alt={`Intro background ${i + 1}`} className="w-full h-full object-cover" />
                                                {isSelected && <div className="absolute top-1 left-1 bg-primary-dark text-white p-0.5 rounded shadow-sm"><Check size={12} /></div>}
                                            </div>
                                        )
                                    })}
                                </div>

                            </div>

                            <div className="mb-3">
                                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Portfolio Page</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {getPortfolioPageOptions().map((option) => (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setSelectedPortfolioBgPage(option.key)}
                                            className={`py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${selectedPortfolioBgPage === option.key
                                                ? 'bg-primary-dark text-white border-primary-dark'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loadingImages ? (
                                <div className="text-center py-4 text-gray-400 text-xs">Loading images...</div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 pr-1 max-h-48 overflow-y-auto">
                                    {(quotationBackgrounds || []).map((url, i) => {
                                        const selectedBg = getPortfolioPageBackground(selectedPortfolioBgPage)
                                        const isSelected = selectedBg?.type === 'image' && selectedBg?.imageUrl === url
                                        return (
                                            <div
                                                key={i}
                                                className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer aspect-video ${isSelected ? 'border-primary-dark shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                                onClick={() => updatePortfolioPageBackground(selectedPortfolioBgPage, {
                                                    type: 'image',
                                                    imageUrl: url,
                                                })}
                                            >
                                                <img src={url} alt={`Portfolio background ${i + 1}`} className="w-full h-full object-cover" />
                                                {isSelected && (
                                                    <div className="absolute top-1 left-1 bg-primary-dark text-white p-0.5 rounded shadow-sm">
                                                        <Check size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {getPortfolioPageBackground(selectedPortfolioBgPage)?.type === 'image' && getPortfolioPageBackground(selectedPortfolioBgPage)?.imageUrl && (
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => clearPortfolioPageBackground(selectedPortfolioBgPage)}
                                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-all"
                                    >
                                        Clear Page Background
                                    </button>
                                </div>
                            )}

                            <p className="text-[10px] text-gray-500 mt-2">
                                Intro page uses Intro Page Background. Portfolio image pages use per-page backgrounds with fallback to Cover & Portfolio Focus.
                            </p>
                        </div>



                    </div>
                )}
            </div>
            )}


            {/* ── SERVICES / ITEMS ──────────────────────────────────────────── */}
            {show('servicesTable') && (
                <div className='border-b border-gray-200'>
                    <SectionHeader title='Services' section='items' badge={quotationData.items.length > 0 ? `${quotationData.items.length}` : null} />
                    {expandedSections.items && (
                        <div className='p-4 space-y-4'>
                            {quotationData.items.map((item, index) => (
                                <div key={item.id || `item-${index}`} className='p-4 bg-primary-light/10 rounded-lg border border-primary-light/30 space-y-4 relative'>
                                    <div className='flex items-center justify-between mb-1'>
                                        <span className='text-xs font-semibold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200'>
                                            Service {index + 1}
                                        </span>
                                        <div className='flex items-center gap-1'>
                                            <button
                                                onClick={() => moveItemUp(item.id)}
                                                disabled={index === 0}
                                                className='flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-white border border-gray-300 text-gray-600 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm'
                                                title='Move up'
                                            >
                                                <ArrowUp size={13} strokeWidth={2} />
                        
                                            </button>
                                            <button
                                                onClick={() => moveItemDown(item.id)}
                                                disabled={index === quotationData.items.length - 1}
                                                className='flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-white border border-gray-300 text-gray-600 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm'
                                                title='Move down'
                                            >
                                                <ArrowDown size={13} strokeWidth={2} />
                                            </button>
                                            <RemoveBtn onClick={() => removeItem(item.id)} />
                                        </div>
                                    </div>

                                    {/* Package Selection - Compact UI */}
                                    <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 flex flex-col sm:flex-row gap-3 items-center relative">
                                        <div className="flex-1 w-full sm:w-auto flex items-center gap-3">
                                            <div className="flex-shrink-0 bg-purple-100 text-[10px] font-bold text-purple-600 px-2 py-0.5 rounded uppercase tracking-wider">
                                                Package
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <select
                                                    className={`${ic} !py-1 !px-2 border-purple-200 focus:ring-purple-500 text-xs`}
                                                    onChange={(e) => {
                                                        if (!e.target.value) return
                                                        const selected = pricingItems.find(p => p.id === e.target.value)
                                                        if (selected) {
                                                            // Normalize packageItems
                                                            const packageItems = (selected.packageItems || []).map(pi => ({
                                                                name: pi.name ?? (pi.itemName || ''),
                                                                quantity: pi.quantity ?? pi.qty ?? 1,
                                                                type: pi.type,
                                                                pricingId: pi.pricingId || pi._id || pi.id
                                                            }))

                                                            // Resolve package amount: use top-level amount; if 0, sum sub-item amounts
                                                            const pkgItemsAmountSum = (selected.packageItems || []).reduce((s, pi) => s + (Number(pi.amount) || 0), 0)
                                                            const resolvedPkgAmount = Number(selected.amount) > 0 ? Number(selected.amount) : pkgItemsAmountSum

                                                            // Auto-fill event name if blank
                                                            if (!item.event && !item.description) {
                                                                updateItem(item.id, 'event', selected.name)
                                                            }

                                                            // Expand packageItems into crew/equipment arrays (with real costs)
                                                            // so the user can see and edit them individually.
                                                            // packageItems list is NOT rendered under the package chip in preview/PDF
                                                            // — items appear through the grouped crew/equipment section instead.
                                                            const crewFromPkg = packageItems
                                                                .filter(pi => pi.type === 'crew')
                                                                .map(pi => ({ name: pi.name, cost: Number(pi.amount) || 0, pricingId: pi.pricingId }))
                                                            const equipFromPkg = packageItems
                                                                .filter(pi => pi.type === 'equipment')
                                                                .map(pi => ({ name: pi.name, cost: Number(pi.amount) || 0, pricingId: pi.pricingId }))

                                                            setQuotationData(prev => ({
                                                                ...prev,
                                                                items: prev.items.map(it => {
                                                                    if ((it.id || it._id?.toString()) !== item.id) return it
                                                                    const newPackages = [...(it.packages || []), { pricingId: selected.id, name: selected.name, amount: resolvedPkgAmount, packageItems }]
                                                                    const newCrew = [...(it.crew || []), ...crewFromPkg]
                                                                    const newEquip = [...(it.equipment || []), ...equipFromPkg]
                                                                    const pkgTotal = newPackages.reduce((s, x) => s + (Number(x.amount) || 0), 0)
                                                                    const crewTotal = newCrew.reduce((s, x) => s + (Number(x.cost) || 0), 0)
                                                                    const equipTotal = newEquip.reduce((s, x) => s + (Number(x.cost) || 0), 0)
                                                                    return { ...it, packages: newPackages, crew: newCrew, equipment: newEquip, amount: pkgTotal + crewTotal + equipTotal }
                                                                })
                                                            }))
                                                            e.target.value = ''
                                                        }
                                                    }}
                                                >
                                                    <option value="">Select Package...</option>
                                                    {pricingItems.filter(p => p.type === 'package').map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}{Number(p.amount) > 0 ? ` (₹${Number(p.amount).toLocaleString('en-IN')})` : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="w-full sm:w-auto h-px sm:h-8 sm:w-px bg-purple-200/50 hidden sm:block"></div>

                                        <div className="flex-1 w-full sm:w-auto flex flex-wrap gap-2 items-center">
                                            {(item.packages || []).map((pkg, i) => (
                                                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-purple-200 shadow-sm animate-in fade-in zoom-in duration-200">
                                                    <div>
                                                        <div className="text-[11px] font-bold text-purple-700 leading-none">{pkg.name}</div>
                                                        {Number(pkg.amount) > 0 && <div className="text-[9px] text-gray-400">₹{Number(pkg.amount).toLocaleString('en-IN')}</div>}
                                                    </div>
                                                    <button
                                                        onClick={() => updateServiceItemSubList(item.id, 'packages', 'remove', i)}
                                                        className="p-0.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(item.packages || []).length === 0 && (
                                                <div className="text-[11px] text-purple-400/60 italic">
                                                    No package applied
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Event Details Row */}
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                        <div>
                                            <label className={lc}>Event Name</label>
                                            <input
                                                type='text'
                                                value={item.event !== undefined ? item.event : (item.description || '')}
                                                onChange={e => updateItem(item.id, 'event', e.target.value)}
                                                className={ic}
                                                placeholder='e.g. Wedding'
                                            />
                                        </div>
                                        <div>
                                            <label className={lc}>Date</label>
                                            <DatePicker
                                                value={item.date && dayjs(item.date.split(' - ')[0]).isValid() ? dayjs(item.date.split(' - ')[0]) : null}
                                                onChange={date => updateItem(item.id, 'date', date ? date.format('YYYY-MM-DD') : '')}
                                                format='DD/MM/YYYY' placeholder='dd/mm/yyyy' className='w-full' style={{ height: '38px' }}
                                                classNames={{ popup: { root: 'small-calendar' } }}
                                            />
                                        </div>
                                        <div>
                                            <label className={lc}>Location</label>
                                            <input
                                                type='text'
                                                value={item.location || ''}
                                                onChange={e => updateItem(item.id, 'location', e.target.value)}
                                                className={ic}
                                                placeholder='e.g. Main Hall'
                                            />
                                        </div>
                                    </div>

                                    {/* Crew & Equipment Row */}
                                    {(showCol('crew') || showCol('equipment')) && (
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                            {/* Crew Selection */}
                                            {showCol('crew') && (
                                                <div className="bg-white p-3 rounded border border-gray-200">
                                                    <label className={`${lc} mb-2`} >Add Supplementary Crew</label>
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            <select
                                                                className={`${ic} flex-1`}
                                                                onChange={(e) => {
                                                                    if (!e.target.value) return
                                                                    const selected = pricingItems.find(p => p.id === e.target.value)
                                                                    if (selected) {
                                                                        updateServiceItemSubList(item.id, 'crew', 'add', {
                                                                            pricingId: selected.id,
                                                                            name: selected.name,
                                                                            cost: selected.amount
                                                                        })
                                                                        e.target.value = ''
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">select crew</option>
                                                                {pricingItems.filter(p => p.type === 'crew').map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}{Number(p.amount) > 0 ? ` (₹${p.amount})` : ''}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                                                            {(item.crew || []).map((c, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                                                                    {c.name} {c.cost > 0 && `(₹${c.cost})`}
                                                                    <button onClick={() => updateServiceItemSubList(item.id, 'crew', 'remove', i)} className="text-blue-400 hover:text-blue-600">
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Equipment Selection */}
                                            {showCol('equipment') && (
                                                <div className="bg-white p-3 rounded border border-gray-200">
                                                    <label className={`${lc} mb-2`}>Add Supplementary Equipment</label>
                                                    <div className="space-y-2">
                                                        <select
                                                            className={ic}
                                                            onChange={(e) => {
                                                                if (!e.target.value) return
                                                                const selected = pricingItems.find(p => p.id === e.target.value)
                                                                if (selected) {
                                                                    updateServiceItemSubList(item.id, 'equipment', 'add', {
                                                                        pricingId: selected.id,
                                                                        name: selected.name,
                                                                        cost: selected.amount
                                                                    })
                                                                    e.target.value = ''
                                                                }
                                                            }}
                                                        >
                                                            <option value="">+ Add Equipment</option>
                                                            {pricingItems.filter(p => p.type === 'equipment').map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}{Number(p.amount) > 0 ? ` (₹${p.amount})` : ''}</option>
                                                            ))}
                                                        </select>
                                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                                                            {(item.equipment || []).map((e, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded border border-amber-100">
                                                                    {e.name} {e.cost > 0 && `(₹${e.cost})`}
                                                                    <button onClick={() => updateServiceItemSubList(item.id, 'equipment', 'remove', i)} className="text-amber-400 hover:text-amber-600">
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Amount Row */}
                                    <div className='flex justify-end items-center gap-3 pt-2 border-t border-gray-200 border-dashed'>
                                        <span className="text-sm text-gray-500">Service Total:</span>
                                        <div className="w-40 relative">
                                            <span className="absolute left-3 top-2 text-gray-400">₹</span>
                                            <input
                                                type='text'
                                                value={item.amount ? Number(item.amount).toLocaleString('en-IN') : (item.total ? Number(item.total).toLocaleString('en-IN') : '')}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/,/g, '');
                                                    if (!isNaN(val) || val === '') updateItem(item.id, 'amount', val);
                                                }}
                                                className={`${ic} pl-7 text-right font-semibold text-gray-900`}
                                                placeholder='0.00'
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <AddBtn onClick={addItem} label='Add Service / Event' />
                        </div>
                    )}
                </div>
            )}

            {/* ── DELIVERABLES ──────────────────────────────────────────────── */}
            {show('deliverablesTable') && (
                <div className='border-b border-gray-200'>
                    <SectionHeader title='Deliverables' section='deliverables' badge={(quotationData.deliverables || []).length > 0 ? `${(quotationData.deliverables || []).length}` : null} />
                    {expandedSections.deliverables && (
                        <div className='p-4 space-y-3'>
                            {(quotationData.deliverables || []).map((d, index) => (
                                <div key={d.id || `del-${index}`} className='flex flex-col gap-1 relative'>
                                    <div className='flex items-center gap-2'>
                                        <span className='text-xs text-gray-400 w-5 shrink-0'>{index + 1}.</span>
                                        <div className="flex-1 relative">
                                            <input 
                                                type='text' 
                                                value={d.description} 
                                                onChange={e => {
                                                    updateDeliverable(d.id, 'description', e.target.value);
                                                    setDropdownSearch(e.target.value);
                                                    setActiveDropdown({ type: 'deliverables', index });
                                                }} 
                                                onFocus={() => {
                                                    setDropdownSearch(d.description);
                                                    setActiveDropdown({ type: 'deliverables', index });
                                                }}
                                                className={`${ic} flex-1`} 
                                                placeholder='e.g. Edited Photos (500+), Wedding Film (10–15 min)' 
                                            />
                                            {activeDropdown?.type === 'deliverables' && activeDropdown?.index === index && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                                    <div className="p-2 border-b border-gray-50 bg-gray-50 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Standard Item</span>
                                                        <button onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                                                    </div>
                                                    {pricingItems
                                                        .filter(p => p.type === 'deliverable' && (!dropdownSearch || p.name.toLowerCase().includes(dropdownSearch.toLowerCase())))
                                                        .map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => {
                                                                    updateDeliverable(d.id, 'description', p.name);
                                                                    updateDeliverable(d.id, 'quantity', p.quantity || 1);
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-none"
                                                            >
                                                                <div className="font-medium text-gray-900">{p.name}</div>
                                                                <div className="text-[10px] text-gray-400">Qty: {p.quantity || 1}</div>
                                                            </button>
                                                        ))
                                                    }
                                                    {pricingItems.filter(p => p.type === 'deliverable').length === 0 && (
                                                        <div className="p-3 text-xs text-center text-gray-400 italic">No standard deliverables found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className='w-20 font-medium'>
                                            <input type='number' value={d.quantity} onChange={e => updateDeliverable(d.id, 'quantity', e.target.value)} className={ic} min='1' placeholder='Qty' />
                                        </div>
                                        <RemoveBtn onClick={() => removeDeliverable(d.id)} />
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <AddBtn onClick={addDeliverable} label='Add Deliverable' />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── COMPLIMENTARY ─────────────────────────────────────────────── */}
            {show('complimentaryTable') && (
                <div className='border-b border-gray-200'>
                    <SectionHeader title='Complimentary' section='complimentary' badge={(quotationData.complimentary || []).length > 0 ? `${(quotationData.complimentary || []).length}` : null} />
                    {expandedSections.complimentary && (
                        <div className='p-4 space-y-3'>
                            {(quotationData.complimentary || []).map((c, index) => (
                                <div key={c.id || `comp-${index}`} className='flex flex-col gap-1 relative'>
                                    <div className='flex items-center gap-2'>
                                        <span className='text-xs text-gray-400 w-5 shrink-0'>{index + 1}.</span>
                                        <div className="flex-1 relative">
                                            <input 
                                                type='text' 
                                                value={c.description} 
                                                onChange={e => {
                                                    updateComplimentary(c.id, 'description', e.target.value);
                                                    setDropdownSearch(e.target.value);
                                                    setActiveDropdown({ type: 'complimentary', index });
                                                }} 
                                                onFocus={() => {
                                                    setDropdownSearch(c.description);
                                                    setActiveDropdown({ type: 'complimentary', index });
                                                }}
                                                className={`${ic} flex-1`} 
                                                placeholder='e.g. Engagement Shoot (1 hr), Same-Day Teaser' 
                                            />
                                            {activeDropdown?.type === 'complimentary' && activeDropdown?.index === index && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                                    <div className="p-2 border-b border-gray-50 bg-gray-50 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Standard Item</span>
                                                        <button onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                                                    </div>
                                                    {pricingItems
                                                        .filter(p => p.type === 'complimentary' && (!dropdownSearch || p.name.toLowerCase().includes(dropdownSearch.toLowerCase())))
                                                        .map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => {
                                                                    updateComplimentary(c.id, 'description', p.name);
                                                                    updateComplimentary(c.id, 'quantity', p.quantity || 1);
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-none"
                                                            >
                                                                <div className="font-medium text-gray-900">{p.name}</div>
                                                                <div className="text-[10px] text-gray-400">Qty: {p.quantity || 1}</div>
                                                            </button>
                                                        ))
                                                    }
                                                    {pricingItems.filter(p => p.type === 'complimentary').length === 0 && (
                                                        <div className="p-3 text-xs text-center text-gray-400 italic">No standard items found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className='w-20 font-medium'>
                                            <input type='number' value={c.quantity} onChange={e => updateComplimentary(c.id, 'quantity', e.target.value)} className={ic} min='1' placeholder='Qty' />
                                        </div>
                                        <RemoveBtn onClick={() => removeComplimentary(c.id)} />
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <AddBtn onClick={addComplimentary} label='Add Complimentary' />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── PAYMENT TIMELINE ──────────────────────────────────────────── */}
            {show('paymentTimeline') && (
                <div className='border-b border-gray-200'>
                    <SectionHeader title='Payment Timeline' section='payment' badge={quotationData.paymentMilestones.length > 0 ? `${quotationData.paymentMilestones.length}` : null} />
                    {expandedSections.payment && (
                        <div className='p-4 space-y-3'>
                            {quotationData.paymentMilestones.map((milestone, index) => (
                                <div key={milestone.id || `ms-${index}`} className='p-3 bg-primary-light/10 rounded-lg border border-primary-light/30 space-y-2'>
                                    <div className='flex items-center justify-between mb-1'>
                                        <span className='text-xs font-medium text-gray-600'>Milestone {index + 1}</span>
                                        <RemoveBtn onClick={() => removeMilestone(milestone.id)} />
                                    </div>
                                    <input type='text' value={milestone.description} onChange={e => updateMilestone(milestone.id, 'description', e.target.value)} className={ic} placeholder='e.g. Advance (50%), Pre-event (25%)' />
                                    <div className='grid grid-cols-2 gap-2'>
                                        <div>
                                            <label className={lc}>Due Date</label>
                                            <DatePicker
                                                value={milestone.dueDate ? dayjs(milestone.dueDate) : null}
                                                onChange={date => updateMilestone(milestone.id, 'dueDate', date ? date.format('YYYY-MM-DD') : '')}
                                                format='DD/MM/YYYY' placeholder='dd/mm/yyyy' className='w-full' style={{ height: '38px' }}
                                                classNames={{ popup: { root: 'small-calendar' } }}
                                            />
                                        </div>
                                        <div>
                                            <label className={lc}>Amount (₹)</label>
                                            <input
                                                type='text'
                                                value={milestone.amount ? Number(milestone.amount).toLocaleString('en-IN') : ''}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/,/g, '');
                                                    if (!isNaN(val) || val === '') updateMilestone(milestone.id, 'amount', val);
                                                }}
                                                className={ic} placeholder='0.00'
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <AddBtn onClick={addMilestone} label='Add Milestone' />
                        </div>
                    )}
                </div>
            )}

            {/* ── PAYMENT METHODS ───────────────────────────────────────────── */}
            <div className='border-b border-gray-200'>
                <SectionHeader title='Payment Methods' section='methods' />
                {expandedSections.methods && (
                    <div className='p-4 space-y-2'>
                        {['creditCards', 'bankTransfer', 'cashOrCheck'].map(method => (
                            <label key={method} className='flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded'>
                                <input
                                    type='checkbox'
                                    checked={quotationData.paymentMethods?.[method] || false}
                                    onChange={e => setQuotationData(prev => ({ ...prev, paymentMethods: { ...prev.paymentMethods, [method]: e.target.checked } }))}
                                    className='rounded'
                                />
                                <span className='capitalize'>{method.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* ── ADDITIONAL INFORMATION ────────────────────────────────────── */}
            <div className='border-b border-gray-200'>
                <SectionHeader title='Additional Information' section='additional' />
                {expandedSections.additional && (
                    <div className='p-4 space-y-4'>
                        <div>
                            <label className={lc}>Notes</label>
                            <textarea
                                value={tplNote}
                                onChange={e => updateTop('notes', e.target.value)}
                                className={ic}
                                rows={3}
                                placeholder='Additional notes for the client...'
                            />
                        </div>
                        <div>
                            <label className={lc}>Terms &amp; Conditions</label>
                            <textarea
                                value={tplTnC}
                                onChange={e => updateTop('termsAndConditions', e.target.value)}
                                className={ic}
                                rows={5}
                                placeholder='1. 50% advance required to confirm booking.&#10;2. Cancellation within 30 days forfeits deposit...'
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}