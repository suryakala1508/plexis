/**
 * Pricing Service - API-backed
 * Manages studio keyword pricing items stored in MongoDB
 */
import { get, post, put, del } from './api'
import { getErrorMessage } from '../utils/errorHandler'

const normalize = (item) => ({ ...item, id: item._id || item.id })

/**
 * Get all pricing items for the current user
 */
export const getPricingItems = async () => {
    try {
        const res = await get('/pricing')
        const data = res?.data || res || []
        return Array.isArray(data) ? data.map(normalize) : []
    } catch {
        return []
    }
}

/**
 * Create a new pricing item
 * @param {{ name: string, type: 'crew'|'equipment'|'other', amount: number }} item
 */
export const savePricingItem = async (item) => {
    try {
        const res = await post('/pricing', item)
        return normalize(res?.data || res)
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to save pricing item'))
    }
}

/**
 * Update a pricing item by ID
 */
export const updatePricingItem = async (id, data) => {
    try {
        const res = await put(`/pricing/${id}`, data)
        return normalize(res?.data || res)
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update pricing item'))
    }
}

/**
 * Delete a pricing item by ID
 */
export const deletePricingItem = async (id) => {
    try {
        await del(`/pricing/${id}`)
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete pricing item'))
    }
}

/**
 * Get pricing items filtered by type (for use in quotation editor)
 */
export const getPricingByType = async (type) => {
    const items = await getPricingItems()
    return items.filter(item => item.type === type)
}
