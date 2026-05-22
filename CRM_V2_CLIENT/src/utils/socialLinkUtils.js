export const SOCIAL_LINK_FIELDS = ['website', 'instagram', 'youtube', 'facebook']

export const SOCIAL_LINK_LABELS = {
    website: 'Website',
    instagram: 'Instagram',
    youtube: 'YouTube',
    facebook: 'Facebook',
}

const HANDLE_SUPPORTED_FIELDS = new Set(['instagram', 'youtube', 'facebook'])

const HANDLE_BASE_URLS = {
    instagram: 'https://www.instagram.com/',
    youtube: 'https://www.youtube.com/',
    facebook: 'https://www.facebook.com/',
}

export const isValidAbsoluteHttpUrl = (value) => {
    const url = typeof value === 'string' ? value.trim() : ''
    if (!url) return false

    try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

export const sanitizeAbsoluteHttpUrl = (value) => {
    const url = typeof value === 'string' ? value.trim() : ''
    return isValidAbsoluteHttpUrl(url) ? url : ''
}

const sanitizeHandle = (value) => {
    const normalized = typeof value === 'string' ? value.trim() : ''
    if (!normalized.startsWith('@')) return ''
    return /^@[A-Za-z0-9._-]+$/.test(normalized) ? normalized.slice(1) : ''
}

export const normalizeSocialLink = (field, value) => {
    const normalized = typeof value === 'string' ? value.trim() : ''
    if (!normalized) return ''

    if (isValidAbsoluteHttpUrl(normalized)) return normalized

    if (!HANDLE_SUPPORTED_FIELDS.has(field)) return ''

    const handle = sanitizeHandle(normalized)
    if (!handle) return ''

    const base = HANDLE_BASE_URLS[field]
    if (!base) return ''

    return field === 'instagram' ? `${base}${handle}/` : `${base}${handle}`
}

export const isValidSocialLinkValue = (field, value) => {
    const normalized = typeof value === 'string' ? value.trim() : ''
    if (!normalized) return true
    return Boolean(normalizeSocialLink(field, normalized))
}

export const getInvalidSocialLinkFields = (customization = {}) => {
    return SOCIAL_LINK_FIELDS.filter((field) => {
        const value = customization?.[field]
        const normalized = typeof value === 'string' ? value.trim() : ''
        return normalized && !normalizeSocialLink(field, normalized)
    })
}

export const getSocialValidationMessage = (fields = []) => {
    if (!fields.length) return ''
    const labels = fields.map((field) => SOCIAL_LINK_LABELS[field] || field)
    return `Enter valid links for: ${labels.join(', ')}. Use http(s) URL or @handle for Instagram/Facebook/YouTube.`
}