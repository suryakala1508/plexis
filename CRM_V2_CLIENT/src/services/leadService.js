import { get, post, put, del } from './api'
import { getErrorMessage } from '../utils/errorHandler'

/**
 * Get lead form configuration for a studio
 * @param {string} studioId - Studio ID
 * @returns {Promise<Object>} Studio form configuration
 */
export const getLeadForm = async (studioId) => {
  try {
    const response = await get(`/lead/${studioId}/leadform`)
    // Backend returns { success: true, data: {...} }
    // API interceptor already extracts response.data, so we get { success: true, data: {...} }
    return response.data || response
  } catch (error) {
    console.error('Error fetching lead form:', error)
    throw new Error(error.message || 'Failed to fetch lead form')
  }
}

/**
 * Submit a lead form (public endpoint - for external forms)
 * @param {Object} formData - Lead form data
 * @returns {Promise<Object>} Submission response
 */
export const submitLeadForm = async (formData) => {
  try {
    const response = await post('/lead/submit', formData)
    return response
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to submit lead form'))
  }
}

/**
 * Create a lead from CRM (authenticated endpoint)
 * @param {Object} formData - Lead form data
 * @returns {Promise<Object>} Created lead
 */
export const createLead = async (formData) => {
  try {
    const response = await post('/lead/create', formData)
    // Backend returns { success: true, message: "...", data: {...} }
    // API interceptor already extracts response.data, so we get { success: true, message: "...", data: {...} }
    return response.data || response
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create lead'))
  }
}

/**
 * Get all leads for the current user
 * @returns {Promise<Array>} Array of leads
 */
export const getLeads = async () => {
  try {
    // Add timestamp to bypass browser cache (304 Not Modified)
    const response = await get(`/lead?t=${Date.now()}`)
    return response.data || []
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch leads'))
  }
}

/**
 * Get a single lead by ID
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object>} Lead data with followUps, quotations, and contract
 */
export const getLeadById = async (leadId) => {
  try {
    const response = await get(`/lead/${leadId}`)
    // Backend returns { success: true, data: { lead, followUps, quotations, contract } }
    // API interceptor already extracts response.data, so we get { success: true, data: {...} }
    // Extract the nested data property - response.data contains { lead, followUps, quotations, contract }
    if (response && response.data && response.data.lead) {
      return response.data
    }
    // Fallback: if structure is different, return as-is
    return response
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch lead'))
  }
}

/**
 * Update a lead
 * @param {string} leadId - Lead ID
 * @param {Object} formData - Updated lead data
 * @returns {Promise<Object>} Updated lead
 */
export const updateLead = async (leadId, formData) => {
  try {
    const response = await put(`/lead/${leadId}`, formData)
    // Backend returns { success: true, data: {...} }
    // API interceptor already extracts response.data, so we get { success: true, data: {...} }
    return response.data || response
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update lead'))
  }
}

/**
 * Delete a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object>} Deletion response
 */
export const deleteLead = async (leadId) => {
  try {
    const response = await del(`/lead/${leadId}`)
    return response
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete lead'))
  }
}

/**
 * Get lead statistics by time range
 * @param {string} range - Time range (week, month, year)
 * @returns {Promise<Array>} Array of lead stats
 */
export const getLeadStats = async (range) => {
  try {
    const response = await get(`/lead/stats?range=${range}`)
    return response.data || []
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch lead stats'))
  }
}
