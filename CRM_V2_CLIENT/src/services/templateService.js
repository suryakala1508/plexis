/**
 * Template Service - API-backed
 * Manages quotation templates stored in MongoDB
 */
import { get, post, put, del } from './api'
import { getErrorMessage } from '../utils/errorHandler'

const TEMPLATE_CACHE_KEY = 'crm_templates_cache_v1'
const DEFAULT_TEMPLATE_ID_KEY = 'crm_default_template_id_v1'

const readTemplateCache = () => {
    try {
        const raw = localStorage.getItem(TEMPLATE_CACHE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.map(normalize) : []
    } catch {
        return []
    }
}

const writeTemplateCache = (templates) => {
    try {
        localStorage.setItem(TEMPLATE_CACHE_KEY, JSON.stringify(Array.isArray(templates) ? templates : []))
    } catch {
        // Ignore storage failures; cache is only a fallback.
    }
}

const readLocalDefaultTemplateId = () => {
    try {
        return localStorage.getItem(DEFAULT_TEMPLATE_ID_KEY) || ''
    } catch {
        return ''
    }
}

const writeLocalDefaultTemplateId = (templateId) => {
    try {
        if (templateId) {
            localStorage.setItem(DEFAULT_TEMPLATE_ID_KEY, String(templateId))
        } else {
            localStorage.removeItem(DEFAULT_TEMPLATE_ID_KEY)
        }
    } catch {
        // Ignore storage failures.
    }
}

const rehydrateDefaultTemplateFlag = (templates) => {
    const localDefaultTemplateId = readLocalDefaultTemplateId()
    if (!localDefaultTemplateId || !Array.isArray(templates) || templates.length === 0) {
        return templates
    }

    const hasServerDefault = templates.some((template) => Boolean(template?.isDefault))
    if (hasServerDefault) {
        const serverDefault = templates.find((template) => Boolean(template?.isDefault))
        writeLocalDefaultTemplateId(serverDefault?.id || serverDefault?._id || '')
        return templates
    }

    return templates.map((template) => ({
        ...template,
        isDefault: template.id === localDefaultTemplateId || template._id === localDefaultTemplateId,
    }))
}

/**
 * Default template structure (used client-side for new template form defaults)
 */
export const DEFAULT_TEMPLATE = {
    name: '',
    background: {
        type: 'solid',
        color: '#ffffff',
        gradientFrom: '#ffffff',
        gradientTo: '#f3e8ff',
        gradientDirection: 'to bottom right',
        headerColor: '#22031f',
        accentColor: '#9916b1',
        imageUrl: '',
        imageOpacity: 0.15,
        imageSize: 'cover',
    },
    welcomeMessage: 'Thank you for trusting us with your special day. We would be honored to be a part of your celebrations and tell your story through our vision.',
    fields: {
        welcomeMessage: true,
        studioHeader: true,
        clientDetails: true,
        eventDetails: true,
        servicesTable: true,
        deliverablesTable: false,
        complimentaryTable: false,
        portfolio: true,
        termsAndConditions: true,
        notes: true,
        paymentTimeline: true,
    },
    serviceColumns: {
        date: true,
        location: true,
        crew: true,
        equipment: true,
        individualAmounts: true,
        subTotal: true,
        gst: true,
        discount: true,
        grandTotal: true,
    },
    customization: {
        primaryColor: '#9916b1',
        headerColor: '#22031f',
        sectionColor: '#F9FAFB',
        fontFamily: 'Poppins',
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
        website: '',
        instagram: '',
        facebook: '',
        youtube: '',
        contactPhone: '',
        contactEmail: '',
    }
}

/**
 * Normalize API response: map _id → id for frontend compatibility
 */
const normalize = (t) => ({ ...t, id: t._id || t.id })

/**
 * Get all templates for the current user
 */
export const getTemplates = async () => {
    try {
        const res = await get('/api/templates')
        const data = res?.data || res || []
        const templates = rehydrateDefaultTemplateFlag(Array.isArray(data) ? data.map(normalize) : [])
        writeTemplateCache(templates)
        return templates
    } catch (error) {
        const cachedTemplates = rehydrateDefaultTemplateFlag(readTemplateCache())
        return cachedTemplates
    }
}

/**
 * Get a single template by ID
 */
export const getTemplateById = async (id) => {
    try {
        const res = await get(`/api/templates`)
        const data = res?.data || res || []
        const templates = Array.isArray(data) ? data.map(normalize) : []
        writeTemplateCache(templates)
        return templates.find(t => t.id === id || t._id === id) || null
    } catch {
        const cachedTemplates = readTemplateCache()
        return cachedTemplates.find(t => t.id === id || t._id === id) || null
    }
}

/**
 * Save a new template
 */
export const saveTemplate = async (data) => {
    try {
        const res = await post('/api/templates', data)
        const template = normalize(res?.data || res)
        const cachedTemplates = readTemplateCache()
        writeTemplateCache([template, ...cachedTemplates.filter(t => t.id !== template.id)])
        return template
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to save template'))
    }
}

/**
 * Update an existing template
 */
export const updateTemplate = async (id, data) => {
    try {
        const res = await put(`/api/templates/${id}`, data)
        const template = normalize(res?.data || res)
        const cachedTemplates = readTemplateCache()
        writeTemplateCache([template, ...cachedTemplates.filter(t => t.id !== template.id)])
        if (typeof data?.isDefault === 'boolean') {
            writeLocalDefaultTemplateId(data.isDefault ? template.id : '')
        }
        return template
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update template'))
    }
}

/**
 * Delete a template
 */
export const deleteTemplate = async (id) => {
    try {
        await del(`/api/templates/${id}`)
        const cachedTemplates = readTemplateCache().filter(t => t.id !== id && t._id !== id)
        writeTemplateCache(cachedTemplates)
        if (readLocalDefaultTemplateId() === id) {
            writeLocalDefaultTemplateId('')
        }
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete template'))
    }
}

/**
 * Duplicate a template
 */
export const duplicateTemplate = async (id) => {
    try {
        const res = await post(`/api/templates/${id}/duplicate`, {})
        const template = normalize(res?.data || res)
        const cachedTemplates = readTemplateCache()
        writeTemplateCache([template, ...cachedTemplates.filter(t => t.id !== template.id)])
        return template
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to duplicate template'))
    }
}

/**
 * Set a template as the default template
 */
export const setDefaultTemplate = async (id) => {
    const applyDefaultToCache = (templateId) => {
        const cachedTemplates = readTemplateCache().map((item) => ({
            ...item,
            isDefault: (item.id === templateId || item._id === templateId),
        }))
        const nextTemplate = cachedTemplates.find(item => item.id === templateId || item._id === templateId) || null
        writeTemplateCache(cachedTemplates)
        writeLocalDefaultTemplateId(templateId)
        return nextTemplate
    }

    try {
        const res = await put(`/api/templates/${id}`, { isDefault: true })
        const template = normalize(res?.data || res)
        const cachedTemplates = readTemplateCache().map((item) => ({
            ...item,
            isDefault: (item.id === template.id || item._id === template._id) ? true : false,
        }))
        writeTemplateCache([template, ...cachedTemplates.filter(t => t.id !== template.id)])
        writeLocalDefaultTemplateId(template.id || template._id)
        return template
    } catch (error) {
        // Offline/server-unavailable fallback: still update local cache so the UI reflects the change.
        if (error?.response?.status === 503 || error?.code === 'ECONNABORTED' || error?.request) {
            const cachedTemplate = applyDefaultToCache(id)
            if (cachedTemplate) {
                return cachedTemplate
            }
        }

        throw new Error(getErrorMessage(error, 'Failed to set default template'))
    }
}
