import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../../../contexts/UserContext'
import { Save, ArrowLeft, Palette, LayoutList, Upload, X, Info, MoreVertical } from 'lucide-react'
import { getTemplateById, saveTemplate, updateTemplate, DEFAULT_TEMPLATE } from '../../../services/templateService'
import { FieldSelector } from './components/FieldSelector'
import { TemplatePreview } from './components/TemplatePreview'
import { toast } from 'react-toastify'
import { uploadMultipleImages, getImages, deleteImage } from '../../../services/leadFormImageService'
import { DeleteConfirmationModal } from '../../../Components/DeleteConfirmationModal'
import { Check, Trash2, Image as ImageIcon } from 'lucide-react'
import { getInvalidSocialLinkFields, getSocialValidationMessage, isValidSocialLinkValue, SOCIAL_LINK_FIELDS } from '../../../utils/socialLinkUtils'

const GRADIENT_PRESETS = [
    { label: 'White', type: 'solid', color: '#ffffff' },
    { label: 'Soft Purple', type: 'gradient', gradientFrom: '#faf5ff', gradientTo: '#ede9fe', gradientDirection: 'to bottom right' },
    { label: 'Warm Gold', type: 'gradient', gradientFrom: '#fffbeb', gradientTo: '#fef3c7', gradientDirection: 'to bottom right' },
    { label: 'Blush Pink', type: 'gradient', gradientFrom: '#fff1f2', gradientTo: '#ffe4e6', gradientDirection: 'to bottom right' },
    { label: 'Mint', type: 'gradient', gradientFrom: '#f0fdf4', gradientTo: '#dcfce7', gradientDirection: 'to bottom right' },
    { label: 'Sky Blue', type: 'gradient', gradientFrom: '#f0f9ff', gradientTo: '#e0f2fe', gradientDirection: 'to bottom right' },
    { label: 'Charcoal', type: 'solid', color: '#1f2937' },
    { label: 'Cream', type: 'solid', color: '#fefce8' },
]


const ACCENT_PRESETS = ['#9916b1', '#22031f', '#D4AF37', '#1e3a8a', '#065f46', '#7c3aed', '#dc2626', '#0891b2', '#4d7c6f']

const MAX_BG_UPLOAD_SIZE_MB = 25
const MAX_BG_UPLOAD_FILES = 10
const BG_COMPRESSION_THRESHOLD_MB = 8
const BG_MAX_DIMENSION_PX = 2800
const BG_JPEG_QUALITY = 0.86
const BG_ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

const inputClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
const labelClasses = 'block text-xs font-medium text-gray-700 mb-1'

const normalizeTemplateCustomization = (customization) => {
    const base = {
        ...(DEFAULT_TEMPLATE.customization || {}),
        ...(customization || {}),
    }

    const rawIntro = customization?.introPageBackground
    const nestedIntro = rawIntro?.type && typeof rawIntro.type === 'object' ? rawIntro.type : null
    const intro = {
        ...(DEFAULT_TEMPLATE.customization?.introPageBackground || {}),
        ...(rawIntro || {}),
        ...(nestedIntro || {}),
    }

    return {
        ...base,
        coverDescription: customization?.coverDescription || '',
        introPageBackground: intro,
        portfolioPageBackgrounds: customization?.portfolioPageBackgrounds && typeof customization.portfolioPageBackgrounds === 'object'
            ? customization.portfolioPageBackgrounds
            : {},
    }
}

const getPortfolioPageCountFromImages = (images) => {
    const imageCount = images?.length || 0
    return Math.max(1, Math.ceil(imageCount / 6))
}

const normalizePortfolioPageBackgroundMap = (pageMap, pageCount) => {
    const source = pageMap && typeof pageMap === 'object' ? pageMap : {}
    const nextMap = {}

    for (let index = 1; index <= pageCount; index += 1) {
        const pageKey = `page${index}`
        if (source[pageKey] && typeof source[pageKey] === 'object') {
            nextMap[pageKey] = source[pageKey]
        }
    }

    return nextMap
}

const normalizePortfolioImages = (images, variantMap) => {
    const source = Array.isArray(images) ? images : []
    const map = variantMap && typeof variantMap === 'object' ? variantMap : {}
    return source.map((url) => map[url] || url)
}

export const TemplateEditor = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { studio } = useUser()
    const isEditing = Boolean(id)
    const fileInputRef = useRef(null)

    const [activeTab, setActiveTab] = useState('portfolio') // 'portfolio' | 'design' | 'fields' | 'defaults'
    const [activeBgTarget, setActiveBgTarget] = useState('background') // 'background' | 'quotationBackground'
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [imageUrlInput, setImageUrlInput] = useState('')
    const [quotationBackgrounds, setQuotationBackgrounds] = useState([])
    const [quotationPortfolioVariants, setQuotationPortfolioVariants] = useState({})
    const [uploadingBg, setUploadingBg] = useState(false)
    const [loadingImages, setLoadingImages] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [imageToDelete, setImageToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [socialErrors, setSocialErrors] = useState({})
    const [activeImageMenu, setActiveImageMenu] = useState(null)
    const [activeImageMenuSide, setActiveImageMenuSide] = useState('left')
    const [activeImageMenuPos, setActiveImageMenuPos] = useState({ top: 0, left: 0 })

    const [templateData, setTemplateData] = useState({
        ...DEFAULT_TEMPLATE,
        name: '',
    })

    const maxUploadBytes = MAX_BG_UPLOAD_SIZE_MB * 1024 * 1024
    const imageMenuWidth = 176
    const imageMenuGap = 4
    const imageMenuViewportPadding = 8

    const compressImageIfNeeded = (file) =>
        new Promise((resolve) => {
            const sizeMb = file.size / (1024 * 1024)
            const canCompress = /^image\/(jpeg|jpg|webp)$/i.test(file.type)

            if (!canCompress || sizeMb <= BG_COMPRESSION_THRESHOLD_MB) {
                resolve(file)
                return
            }

            const objectUrl = URL.createObjectURL(file)
            const image = new Image()

            image.onload = () => {
                const scale = Math.min(1, BG_MAX_DIMENSION_PX / Math.max(image.width, image.height))
                const width = Math.max(1, Math.round(image.width * scale))
                const height = Math.max(1, Math.round(image.height * scale))

                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    URL.revokeObjectURL(objectUrl)
                    resolve(file)
                    return
                }

                ctx.drawImage(image, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(objectUrl)
                        if (!blob || blob.size >= file.size) {
                            resolve(file)
                            return
                        }

                        resolve(new File([blob], file.name, { type: blob.type || file.type, lastModified: Date.now() }))
                    },
                    'image/jpeg',
                    BG_JPEG_QUALITY
                )
            }

            image.onerror = () => {
                URL.revokeObjectURL(objectUrl)
                resolve(file)
            }

            image.src = objectUrl
        })

    useEffect(() => {
        if (isEditing) {
            const load = async () => {
                const existing = await getTemplateById(id)
                if (existing) {
                    setTemplateData({
                        ...DEFAULT_TEMPLATE,
                        ...existing,
                        background: { ...(DEFAULT_TEMPLATE.background || {}), ...(existing.background || {}) },
                        quotationBackground: { ...(DEFAULT_TEMPLATE.quotationBackground || {}), ...(existing.quotationBackground || {}) },
                        customization: normalizeTemplateCustomization(existing.customization),
                    })
                    if (existing.background?.imageUrl) setImageUrlInput(existing.background.imageUrl)
                } else {
                    setError('Template not found')
                }
            }
            load()
        }

        const loadImages = async () => {
            try {
                setLoadingImages(true)
                const response = await getImages('quotationBackground')
                if (response.success && response.data.quotationBackground) {
                    setQuotationBackgrounds(response.data.quotationBackground.images || [])
                    setQuotationPortfolioVariants(response.data.quotationBackground.portfolioVariants || {})
                }
            } catch (err) {
                console.error("Failed to load background images", err)
            } finally {
                setLoadingImages(false)
            }
        }
        loadImages()
    }, [id, isEditing])

    useEffect(() => {
        if (!quotationPortfolioVariants || Object.keys(quotationPortfolioVariants).length === 0) return

        const current = templateData.customization?.portfolioImages || []
        if (!current.length) return

        const normalized = normalizePortfolioImages(current, quotationPortfolioVariants)
        if (JSON.stringify(current) !== JSON.stringify(normalized)) {
            updateCustomization('portfolioImages', normalized)
        }
    }, [quotationPortfolioVariants, templateData.customization?.portfolioImages])

    const updateBackground = (key, value) => {
        setTemplateData(prev => ({
            ...prev,
            [activeBgTarget]: { ...(prev[activeBgTarget] || {}), [key]: value }
        }))
    }

    const applyColorPreset = (preset) => {
        setTemplateData(prev => ({
            ...prev,
            [activeBgTarget]: { ...(prev[activeBgTarget] || {}), ...preset }
        }))
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleFileUpload = async (e) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const selectedFiles = Array.from(files)
        const cappedFiles = selectedFiles.slice(0, MAX_BG_UPLOAD_FILES)
        const skippedByCount = selectedFiles.length - cappedFiles.length

        const validFiles = []
        const skippedByType = []
        const skippedBySize = []

        cappedFiles.forEach((file) => {
            if (!BG_ALLOWED_TYPES.has(file.type)) {
                skippedByType.push(file.name)
                return
            }

            if (file.size > maxUploadBytes) {
                skippedBySize.push(file.name)
                return
            }

            validFiles.push(file)
        })

        if (!validFiles.length) {
            const reason = skippedBySize.length
                ? `Background image must be less than ${MAX_BG_UPLOAD_SIZE_MB} MB.`
                : 'Only JPG, PNG, or WEBP files are allowed.'
            toast.error(`No valid images to upload. ${reason}`)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        const totalSkipped = skippedByCount + skippedByType.length + skippedBySize.length
        if (totalSkipped > 0) {
            toast.warn(`Uploaded ${validFiles.length} valid file(s). Skipped ${totalSkipped} invalid file(s).`)
        }

        try {
            setUploadingBg(true)
            const optimizedFiles = await Promise.all(validFiles.map(compressImageIfNeeded))
            const existingImages = new Set(quotationBackgrounds)
            let anySuccess = false

            // Upload one by one sequentially to avoid payload size limits
            for (const file of optimizedFiles) {
                const response = await uploadMultipleImages([file], 'quotationBackground', { uploadPurpose: 'portfolio' })
                if (response.success) {
                    anySuccess = true
                } else {
                    toast.error(`Failed to upload: ${file.name}`)
                }
            }

            if (anySuccess) {
                toast.success(`${optimizedFiles.length} image(s) uploaded successfully`)

                // Refresh image list ONCE after all uploads done
                const imgsResponse = await getImages('quotationBackground')
                if (imgsResponse.success && imgsResponse.data.quotationBackground) {
                    const refreshedImages = imgsResponse.data.quotationBackground.images || []
                    setQuotationBackgrounds(refreshedImages)
                    setQuotationPortfolioVariants(imgsResponse.data.quotationBackground.portfolioVariants || {})

                    const newImageUrl = refreshedImages.find((url) => !existingImages.has(url)) || refreshedImages[0]
                    if (newImageUrl) {
                        selectBackgroundImage(newImageUrl)
                    }
                }
            }
        } catch (err) {
            toast.error(err.message || 'Failed to upload images')
        } finally {
            setUploadingBg(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const selectBackgroundImage = (url) => {
        setTemplateData(prev => {
            const currentBg = prev[activeBgTarget] || {}
            return {
                ...prev,
                [activeBgTarget]: {
                    ...currentBg,
                    type: 'image',
                    imageUrl: url,
                    imageOpacity: currentBg.imageOpacity ?? 0.15,
                    imageSize: currentBg.imageSize || 'cover',
                }
            }
        })
        setImageUrlInput(url)
    }

    const deleteBackgroundImage = (url) => {
        setImageToDelete(url);
        setDeleteModalOpen(true);
    }

    const confirmDeleteBackground = async () => {
        if (!imageToDelete) return;

        setIsDeleting(true);
        try {
            const response = await deleteImage(imageToDelete, 'quotationBackground')
            if (response.success) {
                toast.success('Image deleted')
                setQuotationBackgrounds(prev => prev.filter(img => img !== imageToDelete))
                setQuotationPortfolioVariants(prev => {
                    const next = { ...prev }
                    delete next[imageToDelete]
                    return next
                })
                if (templateData[activeBgTarget]?.imageUrl === imageToDelete) {
                    clearImage()
                }
                setDeleteModalOpen(false);
                setImageToDelete(null);
            }
        } catch (err) {
            toast.error('Failed to delete image')
        } finally {
            setIsDeleting(false);
        }
    }

    const clearImage = () => {
        setTemplateData(prev => ({
            ...prev,
            [activeBgTarget]: { ...(prev[activeBgTarget] || {}), type: 'solid', imageUrl: '' }
        }))
        setImageUrlInput('')
    }

    const updateField = (key, value) => {
        setTemplateData(prev => ({
            ...prev,
            fields: { ...prev.fields, [key]: value }
        }))
    }

    const updateServiceColumn = (key, value) => {
        setTemplateData(prev => ({
            ...prev,
            serviceColumns: { ...prev.serviceColumns, [key]: value }
        }))
    }

    const updateCustomization = (key, value) => {
        setTemplateData(prev => ({
            ...prev,
            customization: { ...prev.customization, [key]: value }
        }))
    }

    const portfolioPageCount = useMemo(
        () => getPortfolioPageCountFromImages(templateData.customization?.portfolioImages),
        [templateData.customization?.portfolioImages]
    )

    const portfolioPageOptions = useMemo(
        () => Array.from({ length: portfolioPageCount }, (_, index) => ({
            key: `page${index + 1}`,
            label: `Page ${index + 1}`,
        })),
        [portfolioPageCount]
    )

    const getPortfolioPageOptions = () => {
        return portfolioPageOptions
    }

    const backgroundAssignmentTargets = useMemo(
        () => ([
            { key: 'intro', label: 'Intro Page BG' },
            ...portfolioPageOptions.map((option) => ({ key: option.key, label: `${option.label} BG` })),
        ]),
        [portfolioPageOptions]
    )

    const getPortfolioPageBackground = (pageKey) => {
        const pageMap = templateData.customization?.portfolioPageBackgrounds || {}
        return pageMap[pageKey] || null
    }

    useEffect(() => {
        const currentMap = templateData.customization?.portfolioPageBackgrounds || {}
        const normalizedMap = normalizePortfolioPageBackgroundMap(currentMap, portfolioPageCount)

        const currentSerialized = JSON.stringify(currentMap)
        const normalizedSerialized = JSON.stringify(normalizedMap)
        if (currentSerialized !== normalizedSerialized) {
            updateCustomization('portfolioPageBackgrounds', normalizedMap)
        }
    }, [
        portfolioPageCount,
        templateData.customization?.portfolioPageBackgrounds,
    ])

    useEffect(() => {
        if (!activeImageMenu) return

        const closeMenu = () => setActiveImageMenu(null)
        document.addEventListener('click', closeMenu)
        return () => document.removeEventListener('click', closeMenu)
    }, [activeImageMenu])

    const updatePortfolioPageBackground = (pageKey, patch) => {
        const currentMap = templateData.customization?.portfolioPageBackgrounds || {}
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
        const currentMap = templateData.customization?.portfolioPageBackgrounds || {}
        const nextMap = { ...currentMap }
        delete nextMap[pageKey]
        updateCustomization('portfolioPageBackgrounds', nextMap)
    }

    const togglePortfolioImage = (url) => {
        const current = templateData.customization?.portfolioImages || []
        const variantUrl = quotationPortfolioVariants[url] || url
        const exists = current.includes(url) || current.includes(variantUrl)
        const next = exists
            ? current.filter(img => img !== url && img !== variantUrl)
            : [...current, variantUrl]
        updateCustomization('portfolioImages', next)
        updateCustomization('showPortfolio', next.length > 0)
    }

    const isPortfolioSelected = (url) => {
        const current = templateData.customization?.portfolioImages || []
        const variantUrl = quotationPortfolioVariants[url] || url
        return current.includes(url) || current.includes(variantUrl)
    }

    const getIntroPageBackground = () => {
        return templateData.customization?.introPageBackground || {}
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

    const assignImageToTarget = (url, targetKey) => {
        if (targetKey === 'intro') {
            const introBg = getIntroPageBackground()
            updateIntroPageBackground({
                type: 'image',
                imageUrl: url,
                imageOpacity: introBg?.imageOpacity ?? 0.15,
                imageSize: introBg?.imageSize || 'cover',
            })
            return
        }

        const selectedBg = getPortfolioPageBackground(targetKey)
        updatePortfolioPageBackground(targetKey, {
            type: 'image',
            imageUrl: url,
            imageOpacity: selectedBg?.imageOpacity ?? 0.15,
            imageSize: selectedBg?.imageSize || 'cover',
        })
    }

    const getImageAssignedTargets = (url) => {
        const targets = []
        const introBg = getIntroPageBackground()
        if (introBg?.type === 'image' && introBg?.imageUrl === url) {
            targets.push({ key: 'intro', label: 'Intro' })
        }

        const pageMap = templateData.customization?.portfolioPageBackgrounds || {}
        portfolioPageOptions.forEach((option, index) => {
            const pageBg = pageMap[option.key]
            if (pageBg?.type === 'image' && pageBg?.imageUrl === url) {
                targets.push({ key: option.key, label: `P${index + 1}` })
            }
        })

        return targets
    }

    const clearImageTarget = (targetKey) => {
        if (targetKey === 'intro') {
            clearIntroPageBackground()
            return
        }
        clearPortfolioPageBackground(targetKey)
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

    const handleSave = async () => {
        if (!templateData.name.trim()) {
            setError('Please enter a template name')
            return
        }

        const invalidSocialFields = getInvalidSocialLinkFields(templateData.customization)
        if (invalidSocialFields.length > 0) {
            const message = getSocialValidationMessage(invalidSocialFields)
            setSocialErrors(invalidSocialFields.reduce((acc, field) => {
                acc[field] = field === 'website'
                    ? 'Please use a full URL starting with http:// or https://'
                    : 'Use full URL or @handle'
                return acc
            }, {}))
            setError(message)
            toast.error(message)
            return
        }

        setSaving(true)
        try {
            const normalizedPortfolioImages = normalizePortfolioImages(
                templateData.customization?.portfolioImages,
                quotationPortfolioVariants
            )
            const payload = {
                ...templateData,
                customization: {
                    ...normalizeTemplateCustomization(templateData.customization),
                    portfolioImages: normalizedPortfolioImages,
                    portfolioPageBackgrounds: normalizePortfolioPageBackgroundMap(
                        templateData.customization?.portfolioPageBackgrounds,
                        getPortfolioPageCountFromImages(templateData.customization?.portfolioImages)
                    ),
                },
            }
            if (isEditing) {
                await updateTemplate(id, payload)
            } else {
                await saveTemplate(payload)
            }
            setSaving(false)
            toast.success('Template saved successfully')
            setTimeout(() => navigate('/templates'), 1000)
        } catch (err) {
            setError(err.message || 'Failed to save template')
            setSaving(false)
        }
    }

    const bg = templateData[activeBgTarget] || {}
    const bgPreviewStyle =
        bg.type === 'image' && bg.imageUrl
            ? {
                backgroundImage: `url(${bg.imageUrl})`,
                backgroundSize: bg.imageSize || 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: bg.imageSize === 'repeat' ? 'repeat' : 'no-repeat'
            }
            : bg.type === 'gradient'
                ? { background: `linear-gradient(${bg.gradientDirection || 'to bottom right'}, ${bg.gradientFrom || '#fff'}, ${bg.gradientTo || '#f3e8ff'})` }
                : { backgroundColor: bg.color || '#ffffff' }

    const tabs = [
        { key: 'portfolio', label: 'Portfolio', icon: LayoutList },
        { key: 'design', label: 'Design', icon: Palette },
        { key: 'fields', label: 'Fields', icon: LayoutList },
        { key: 'defaults', label: 'Defaults', icon: LayoutList },
    ]

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/templates')}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold text-gray-900">
                            {isEditing ? 'Edit Template' : 'Create New Template'}
                        </h1>
                        <p className="text-xs text-gray-500">Customize layout, background & fields</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                >
                    <Save size={15} />
                    {saving ? 'Saving…' : 'Save Template'}
                </button>
            </div>

            {error && (
                <div className="shrink-0 mx-6 mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
                    {error}
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                </div>
            )}

            {/* Two-panel workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Config panel */}
                <div className="w-full lg:w-105 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
                    {/* Template name */}
                    <div className="px-5 py-4 border-b border-gray-100">
                        <label className={labelClasses}>Template Name *</label>
                        <input
                            type="text"
                            value={templateData.name}
                            onChange={e => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                            className={inputClasses}
                            placeholder="e.g. Wedding Premium, Corporate Event…"
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 shrink-0">
                        {tabs.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 ${activeTab === key
                                    ? 'border-primary-dark text-primary-dark'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon size={14} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">

                        {/* ── DESIGN TAB (Colors + Image BG merged) ── */}
                        {activeTab === 'design' && (
                            <>
                                {/* Background Target Selector */}
                                <div className="mb-6">
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setActiveBgTarget('background')}
                                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeBgTarget === 'background' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Cover & Portfolio Focus
                                        </button>
                                        <button
                                            onClick={() => setActiveBgTarget('quotationBackground')}
                                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeBgTarget === 'quotationBackground' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Quotation Table Focus
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                                        {activeBgTarget === 'background' ? 'Changes apply to the first page and portfolio exhibits.' : 'Changes apply to the final page containing quotation tables.'}
                                    </p>
                                </div>

                                {/* ── Background Image section (TOP) ── */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Background Image</h4>

                                    {/* Gallery */}
                                    {loadingImages ? (
                                        <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-dark"></div></div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 mb-4 max-h-48 overflow-y-auto pr-1">
                                            {quotationBackgrounds.map((url, idx) => {
                                                const isSelected = bg.type === 'image' && bg.imageUrl === url
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer aspect-video ${isSelected ? 'border-primary-dark shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                                        onClick={() => selectBackgroundImage(url)}
                                                    >
                                                        <img src={url} alt={`Background ${idx + 1}`} className="w-full h-full object-cover" />

                                                        {isSelected && (
                                                            <div className="absolute top-1 left-1 bg-primary-dark text-white p-0.5 rounded shadow-sm">
                                                                <Check size={12} />
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteBackgroundImage(url); }}
                                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Upload trigger */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingBg}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all outline-none"
                                        >
                                            {uploadingBg ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                            ) : (
                                                <Upload size={16} />
                                            )}
                                            {uploadingBg ? 'Uploading...' : 'Upload New'}
                                        </button>

                                        {bg.type === 'image' && bg.imageUrl && (
                                            <button
                                                onClick={clearImage}
                                                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-all"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                                        <Info size={12} className="shrink-0" title={`Background image must be less than ${MAX_BG_UPLOAD_SIZE_MB} MB`} />
                                        <span>Background image must be less than {MAX_BG_UPLOAD_SIZE_MB} MB.</span>
                                    </div>

                                    {/* Opacity + fit — only when image is set */}
                                    {bg.type === 'image' && bg.imageUrl && (
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Overlay Opacity</h4>
                                                    <span className="text-xs font-bold text-primary">{Math.round((bg.imageOpacity ?? 0.15) * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="0.9"
                                                    step="0.05"
                                                    value={bg.imageOpacity ?? 0.15}
                                                    onChange={e => updateBackground('imageOpacity', parseFloat(e.target.value))}
                                                    className="w-full accent-primary"
                                                />
                                                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                                    <span>Full image</span>
                                                    <span>More readable</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Image Fit</h4>
                                                <div className="flex gap-2">
                                                    {[['cover', 'Fill'], ['contain', 'Fit'], ['repeat', 'Tile']].map(([val, label]) => (
                                                        <button
                                                            key={val}
                                                            onClick={() => updateBackground('imageSize', val)}
                                                            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${bg.imageSize === val ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Colors section (BOTTOM) ── */}
                                <div className="border-t border-gray-100 pt-5 space-y-5">
                                    {/* Background presets */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Background Color Presets</h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {GRADIENT_PRESETS.map((preset) => {
                                                const style =
                                                    preset.type === 'gradient'
                                                        ? { background: `linear-gradient(${preset.gradientDirection}, ${preset.gradientFrom}, ${preset.gradientTo})` }
                                                        : { backgroundColor: preset.color }
                                                const isActive =
                                                    bg.type === preset.type &&
                                                    (preset.type === 'solid' ? bg.color === preset.color : bg.gradientFrom === preset.gradientFrom)
                                                return (
                                                    <button
                                                        key={preset.label}
                                                        onClick={() => applyColorPreset(preset)}
                                                        className={`relative h-12 rounded-lg border-2 transition-all ${isActive ? 'border-primary-dark scale-105 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
                                                        style={style}
                                                        title={preset.label}
                                                    >
                                                        {isActive && (
                                                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-dark drop-shadow">✓</span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Custom background color */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Custom Background Color</h4>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="color"
                                                value={bg.color || '#ffffff'}
                                                onChange={e => applyColorPreset({ type: 'solid', color: e.target.value })}
                                                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={bg.color || '#ffffff'}
                                                onChange={e => applyColorPreset({ type: 'solid', color: e.target.value })}
                                                className={`${inputClasses} flex-1`}
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </div>

                                    {/* Header color */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Header Color</h4>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="color"
                                                value={bg.headerColor || '#22031f'}
                                                onChange={e => updateBackground('headerColor', e.target.value)}
                                                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={bg.headerColor || '#22031f'}
                                                onChange={e => updateBackground('headerColor', e.target.value)}
                                                className={`${inputClasses} flex-1`}
                                                placeholder="#22031f"
                                            />
                                        </div>
                                    </div>

                                    {/* Accent color */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Accent Color</h4>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {ACCENT_PRESETS.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => updateCustomization('primaryColor', color)}
                                                    className={`w-7 h-7 rounded-full border-2 transition-all ${templateData.customization?.primaryColor === color ? 'border-gray-800 scale-110 shadow' : 'border-transparent hover:scale-105'}`}
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="color"
                                                value={templateData.customization?.primaryColor || '#9916b1'}
                                                onChange={e => updateCustomization('primaryColor', e.target.value)}
                                                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={templateData.customization?.primaryColor || '#9916b1'}
                                                onChange={e => updateCustomization('primaryColor', e.target.value)}
                                                className={`${inputClasses} flex-1`}
                                                placeholder="#9916b1"
                                            />
                                        </div>
                                    </div>

                                    {/* Preview swatch */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color Preview</h4>
                                        <div className="h-16 rounded-xl border border-gray-200 overflow-hidden flex">
                                            <div className="w-1/3 flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: bg.headerColor || '#22031f' }}>
                                                Header
                                            </div>
                                            <div className="flex-1 flex items-center justify-center text-xs text-gray-500" style={bgPreviewStyle}>
                                                Body
                                            </div>
                                            <div className="w-8 flex items-center justify-center" style={{ backgroundColor: templateData.customization?.primaryColor || '#9916b1' }}>
                                                <span className="text-white text-xs">A</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table Cell Color */}
                                    <div className="pt-2 border-t border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Table Cell Background Color</h4>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="color"
                                                value={templateData.customization?.tableColumnColor || '#ffffff'}
                                                onChange={e => updateCustomization('tableColumnColor', e.target.value)}
                                                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={templateData.customization?.tableColumnColor || '#ffffff'}
                                                onChange={e => updateCustomization('tableColumnColor', e.target.value)}
                                                className={`${inputClasses} flex-1`}
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </div>

                                    {/* Table Cell Opacity */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Table Cell Opacity</h4>
                                            <span className="text-xs font-bold text-primary">
                                                {Math.round((templateData.customization?.tableColumnOpacity !== undefined ? templateData.customization.tableColumnOpacity : 1) * 100)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={templateData.customization?.tableColumnOpacity !== undefined ? templateData.customization.tableColumnOpacity : 1}
                                            onChange={e => updateCustomization('tableColumnOpacity', parseFloat(e.target.value))}
                                            className="w-full accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                            <span>Transparent</span>
                                            <span>Solid</span>
                                        </div>
                                    </div>

                                </div>
                            </>
                        )}

                        {/* ── FIELDS TAB ── */}

                        {/* ── PORTFOLIO TAB ── */}
                        {activeTab === 'portfolio' && (
                            <div className="space-y-4">
                                {/* Cover Page Social Links */}
                                <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-200">
                                     <h4 className="text-xs font-bold text-gray-700 mb-2">Cover Page Handles</h4>
                                 <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                     <table className="w-full text-left border-collapse">
                                         <thead>
                                             <tr className="bg-gray-50 border-b border-gray-200">
                                                 <th className="px-3 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider w-1/4">Platform</th>
                                                 <th className="px-3 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Handle / URL</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-100">
                                              {[ {id: 'website', label: 'Website'}, {id: 'instagram', label: 'Instagram'}, {id: 'youtube', label: 'YouTube'}, {id: 'facebook', label: 'Facebook'} ].map(social => (
                                                  <tr key={social.id} className="hover:bg-gray-50/50">
                                                      <td className="px-3 py-1.5 align-middle text-xs font-medium text-gray-600 bg-gray-50/30">{social.label}</td>
                                                      <td className="px-2 py-1.5 align-middle">
                                                          <input
                                                              type="text"
                                                              value={templateData.customization?.[social.id] || ''}
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
                                      <label className="block text-xs font-bold text-gray-700 mb-2">Intro Page Description </label>
                                      <textarea
                                          value={templateData.customization?.coverDescription || ''}
                                          onChange={e => updateCustomization('coverDescription', e.target.value)}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                                          rows={5}
                                          placeholder={"Hello,\nThank you for trusting... (Intro page text)"}
                                      />
                                 </div>

                                {/* Featured On */}
                                <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-200">
                                     <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1">
                                         <label className="block text-xs font-bold text-gray-700">Featured On (Publications/Press)</label>
                                         <button type="button" onClick={() => {
                                              const current = templateData.customization?.featuredOnItems || []
                                              updateCustomization('featuredOnItems', [...current, { name: '', url: '' }])
                                         }} className="text-xs text-primary-dark font-semibold hover:underline">+ Add Link</button>
                                     </div>
                                     {(templateData.customization?.featuredOnItems || []).length > 0 ? (
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
                                                     {(templateData.customization?.featuredOnItems || []).map((item, idx) => (
                                                         <tr key={idx} className="hover:bg-gray-50/50">
                                                             <td className="px-2 py-1.5 align-middle">
                                                                 <input
                                                                     type="text"
                                                                     value={item.name}
                                                                     onChange={e => {
                                                                         const current = [...(templateData.customization?.featuredOnItems || [])]
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
                                                                         const current = [...(templateData.customization?.featuredOnItems || [])]
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
                                                                         const current = (templateData.customization?.featuredOnItems || []).filter((_, i) => i !== idx)
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
                                        <h4 className="text-xs font-bold text-gray-700">All Photos</h4>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs font-medium bg-primary-dark text-white px-2 py-1 rounded hover:bg-primary-dark/90"
                                        >
                                            {uploadingBg ? 'Uploading...' : 'Upload'}
                                        </button>
                                    </div>

                                    {loadingImages ? (
                                        <div className="text-center py-4 text-gray-400 text-xs">Loading images...</div>
                                    ) : (
                                        <div className="max-h-120 overflow-y-auto pr-1">
                                            <div className="grid grid-cols-2 gap-3">
                                                {(quotationBackgrounds || []).map((url, i) => {
                                                    const isSelected = isPortfolioSelected(url)
                                                    const assignedTargets = getImageAssignedTargets(url)
                                                    return (
                                                        <div key={i} className="relative">
                                                            <div
                                                                className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer aspect-video ${isSelected ? 'border-primary-dark shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                                                onClick={() => togglePortfolioImage(url)}
                                                            >
                                                                <img src={url} alt={`Portfolio photo ${i + 1}`} className="w-full h-full object-cover" />
                                                                {isSelected && (
                                                                    <div className="absolute top-1 left-1 bg-primary-dark text-white p-0.5 rounded shadow-sm">
                                                                        <Check size={12} />
                                                                    </div>
                                                                )}
                                                                {assignedTargets.length > 0 && (
                                                                    <div className="absolute bottom-1 left-1 flex flex-wrap gap-1 max-w-[80%]">
                                                                        {assignedTargets.map((target) => (
                                                                            <span key={target.key} className="px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-semibold">
                                                                                {target.label}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    aria-label="Assign background target"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()

                                                                        if (activeImageMenu === url) {
                                                                            setActiveImageMenu(null)
                                                                            return
                                                                        }

                                                                        const triggerRect = e.currentTarget.getBoundingClientRect()
                                                                        const rightSpace = window.innerWidth - triggerRect.right - imageMenuViewportPadding
                                                                        const leftSpace = triggerRect.left - imageMenuViewportPadding
                                                                        const needsLeftOpen = rightSpace < imageMenuWidth + imageMenuGap && leftSpace > rightSpace
                                                                        setActiveImageMenuSide(needsLeftOpen ? 'left' : 'right')
                                                                        setActiveImageMenuPos({
                                                                            top: triggerRect.bottom + 4,
                                                                            left: needsLeftOpen ? triggerRect.left - imageMenuWidth - imageMenuGap : triggerRect.right + imageMenuGap
                                                                        })
                                                                        setActiveImageMenu(url)
                                                                    }}
                                                                    className="absolute top-1 right-1 bg-white/90 text-gray-700 p-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <MoreVertical size={12} />
                                                                </button>
                                                            </div>

                                                            {activeImageMenu === url && (
                                                                <div
                                                                    className="fixed z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
                                                                    style={{
                                                                        top: `${activeImageMenuPos.top}px`,
                                                                        left: `${activeImageMenuPos.left}px`
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {backgroundAssignmentTargets.map((target) => (
                                                                        <button
                                                                            key={`${url}-${target.key}`}
                                                                            type="button"
                                                                            className="w-full text-left px-3 py-1.5 text-[11px] leading-4 whitespace-normal text-gray-700 hover:bg-gray-50"
                                                                            onClick={() => {
                                                                                assignImageToTarget(url, target.key)
                                                                                setActiveImageMenu(null)
                                                                            }}
                                                                        >
                                                                            {target.label}
                                                                        </button>
                                                                    ))}
                                                                    <div className="my-1 border-t border-gray-100" />
                                                                    {getImageAssignedTargets(url).map((target) => (
                                                                        <button
                                                                            key={`clear-${url}-${target.key}`}
                                                                            type="button"
                                                                            className="w-full text-left px-3 py-1.5 text-[11px] leading-4 whitespace-normal text-red-600 hover:bg-red-50"
                                                                            onClick={() => {
                                                                                clearImageTarget(target.key)
                                                                                setActiveImageMenu(null)
                                                                            }}
                                                                        >
                                                                            Clear {target.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-gray-500 mt-2">
                                        First set focus backgrounds in Design. Then choose portfolio photos and use the 3-dot menu to assign Intro/Page backgrounds.
                                    </p>
                                </div>




                            </div>
                        )}

                        {activeTab === 'fields' && (
                            <>
                                {/* Welcome message text editor */}
                                {templateData.fields?.welcomeMessage && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Welcome Message Text</h4>
                                        <textarea
                                            value={templateData.welcomeMessage || ''}
                                            onChange={e => setTemplateData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                                            className={`${inputClasses} resize-none`}
                                            rows={4}
                                            placeholder="Enter a welcome message for your clients…"
                                        />
                                    </div>
                                )}
                                <FieldSelector
                                    fields={templateData.fields}
                                    serviceColumns={templateData.serviceColumns}
                                    onFieldChange={updateField}
                                    onServiceColumnChange={updateServiceColumn}
                                />
                            </>
                        )}

                        {/* ── DEFAULTS TAB ── */}
                        {activeTab === 'defaults' && (
                            <div className="space-y-6 pb-20">
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Default Terms & Conditions</h4>
                                    <textarea
                                        value={templateData.termsAndConditions || ''}
                                        onChange={e => setTemplateData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                                        className={`${inputClasses} resize-none mb-2`}
                                        rows={4}
                                        placeholder="e.g. 50% advance required..."
                                    />
                                    <p className="text-[10px] text-gray-400">This text will be auto-filled in the 'Terms & Conditions' section of your quotation.</p>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Default Notes / Payment Terms</h4>
                                    <textarea
                                        value={templateData.notes || ''}
                                        onChange={e => setTemplateData(prev => ({ ...prev, notes: e.target.value }))}
                                        className={`${inputClasses} resize-none mb-2`}
                                        rows={4}
                                        placeholder="e.g. Payment due within 7 days..."
                                    />
                                    <p className="text-[10px] text-gray-400">This text will be auto-filled in the 'Additional Notes' section of your quotation.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Live preview */}
                <div className="flex-1 overflow-y-auto bg-gray-100 relative isolate">
                    <div className="sticky top-0 z-50 bg-gray-100/95 backdrop-blur-sm px-6 py-2 border-b border-gray-200 flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">Note: photos and details are populated when applying to lead</span>
                        {bg.type === 'image' && bg.imageUrl && (
                            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Image BG active</span>
                        )}
                    </div>
                    <TemplatePreview template={templateData} studio={studio} />
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                disabled={uploadingBg}
            />
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteBackground}
                title="Delete Background Image"
                message="Are you sure you want to delete this background image? This action cannot be undone."
                loading={isDeleting}
            />
        </div>
    )
}
