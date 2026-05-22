import { post, get, put, del } from './api'

/**
 * Contract Service
 * Handles contract-related API calls
 */

/**
 * Save contract draft
 * @param {Object} contractData - Contract data to save
 * @returns {Promise<Object>} Saved contract data
 */
export const saveContractDraft = async (contractData) => {
  try {
    const response = await post('/contract/draft', contractData)
    return response.data || response
  } catch (error) {
    console.error('Error saving contract draft:', error)
    throw new Error(error.message || 'Failed to save contract draft')
  }
}

/**
 * Get contract by ID
 * @param {string} contractId - Contract ID
 * @returns {Promise<Object>} Contract data
 */
export const getContractById = async (contractId) => {
  try {
    const response = await get(`/contract/${contractId}`)
    return response.data || response
  } catch (error) {
    console.error('Error fetching contract:', error)
    throw new Error(error.message || 'Failed to fetch contract')
  }
}

/**
 * Get all contracts for a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<Array>} List of contracts
 */
export const getContractsByLead = async (leadId) => {
  try {
    const response = await get(`/contract/lead/${leadId}`)
    return response.data || response
  } catch (error) {
    console.error('Error fetching contracts by lead:', error)
    throw new Error(error.message || 'Failed to fetch contracts')
  }
}

/**
 * Update existing contract
 * @param {string} contractId - Contract ID
 * @param {Object} contractData - Updated contract data
 * @returns {Promise<Object>} Updated contract data
 */
export const updateContract = async (contractId, contractData) => {
  try {
    const response = await put(`/contract/${contractId}`, contractData)
    return response.data || response
  } catch (error) {
    console.error('Error updating contract:', error)
    throw new Error(error.message || 'Failed to update contract')
  }
}

/**
 * Delete contract
 * @param {string} contractId - Contract ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteContract = async (contractId) => {
  try {
    const response = await del(`/contract/${contractId}`)
    return response.data || response
  } catch (error) {
    console.error('Error deleting contract:', error)
    throw new Error(error.message || 'Failed to delete contract')
  }
}

/**
 * Export contract to PDF
 * @param {string} contractId - Contract ID
 * @returns {Promise<Object>} PDF URL
 */
export const exportContractPdf = async (contractId) => {
  try {
    const response = await post(`/contract/${contractId}/export-pdf`)
    return response.data || response
  } catch (error) {
    console.error('Error exporting contract PDF:', error)
    throw new Error(error.message || 'Failed to export contract PDF')
  }
}

/**
 * Create a contract from an accepted quotation
 * @param {string} quotationId - Quotation ID to convert to contract
 * @returns {Promise<Object>} Contract data with PDF URL
 */
export const createContractFromQuotation = async (quotationId) => {
  try {
    const response = await post(`/contract/from-quotation/${quotationId}`)
    // Backend returns { success: true, message: "...", data: { contractUrl } }
    return response.data || response
  } catch (error) {
    console.error('Error creating contract from quotation:', error)
    throw new Error(error.message || 'Failed to create contract from quotation')
  }
}

/**
 * Send contract to client via email
 * @param {string} contractId - Contract ID
 * @param {Object} emailData - Email data (recipientEmail, recipientName, subject, message)
 * @returns {Promise<Object>} Send confirmation
 */
export const sendContract = async (contractId, emailData) => {
  try {
    const response = await post(`/contract/${contractId}/send`, emailData)
    return response.data || response
  } catch (error) {
    console.error('Error sending contract:', error)
    throw new Error(error.message || 'Failed to send contract')
  }
}


