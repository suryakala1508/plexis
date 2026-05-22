import { get, post, put, patch, del, API_URL } from './api'

/**
 * Save a quotation draft
 * @param {Object} quotationData - Quotation data
 * @returns {Promise<Object>} Created quotation
 */
export const saveQuotationDraft = async (quotationData) => {
  try {
    const response = await post('/quotation/draft', quotationData)
    return response.data || response
  } catch (error) {
    console.error('Error saving quotation draft:', error)
    throw error
  }
}

/**
 * Silently save a quotation draft (bypass PDF generation)
 * @param {Object} quotationData - Quotation data
 * @returns {Promise<Object>} Created quotation
 */
export const autoSaveQuotationDraft = async (quotationData) => {
  try {
    const response = await post('/quotation/auto-draft', quotationData)
    return response.data || response
  } catch (error) {
    console.error('Error silently auto-saving quotation draft:', error)
    throw error
  }
}

/**
 * Get a quotation by ID (public endpoint - for shared/view links)
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<Object>} Quotation data
 */
export const getQuotationById = async (quotationId) => {
  try {
    const response = await get(`/quotation/public/${quotationId}`)
    return response.data || response
  } catch (error) {
    console.error('Error fetching quotation:', error)
    throw error
  }
}

/**
 * Get a quotation by ID for edit (authenticated - ensures user's own draft loads)
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<Object>} Quotation data
 */
export const getQuotationByIdForEdit = async (quotationId) => {
  try {
    const response = await get(`/quotation/${quotationId}`)
    return response.data || response
  } catch (error) {
    console.error('Error fetching quotation for edit:', error)
    throw error
  }
}

/**
 * Get all quotations for a lead
 * @param {string} leadId - Lead ID
 * @param {Object} options - Query options (status, limit, page)
 * @returns {Promise<Object>} Quotations with pagination
 */
export const getQuotationsByLead = async (leadId, options = {}) => {
  try {
    const { status, limit = 10, page = 1 } = options
    const queryParams = new URLSearchParams()
    if (status) queryParams.append('status', status)
    queryParams.append('limit', limit.toString())
    queryParams.append('page', page.toString())

    const response = await get(`/quotation/lead/${leadId}?${queryParams.toString()}`)
    // Backend returns { success: true, data: { quotations: [...], pagination: {...} } }
    // API interceptor already extracts response.data, so we get { success: true, data: {...} }
    return response.data || response
  } catch (error) {
    console.error('Error fetching quotations by lead:', error)
    throw error
  }
}

/**
 * Update a quotation
 * @param {string} quotationId - Quotation ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated quotation
 */
export const updateQuotation = async (quotationId, updateData) => {
  try {
    const response = await put(`/quotation/${quotationId}`, updateData)
    return response.data || response
  } catch (error) {
    console.error('Error updating quotation:', error)
    throw error
  }
}

/**
 * Silently update a quotation (bypass PDF generation)
 * @param {string} quotationId - Quotation ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated quotation
 */
export const autoUpdateQuotation = async (quotationId, updateData) => {
  try {
    const response = await put(`/quotation/${quotationId}/auto-update`, updateData)
    return response.data || response
  } catch (error) {
    console.error('Error silently updating quotation:', error)
    throw error
  }
}

/**
 * Update only the due date / valid until of a quotation (lightweight, no PDF regen)
 * @param {string} quotationId - Quotation ID
 * @param {string} dueDate - ISO date string
 * @returns {Promise<Object>}
 */
export const updateQuotationDueDate = async (quotationId, dueDate) => {
  try {
    const response = await patch(`/quotation/${quotationId}/due-date`, { dueDate })
    return response.data || response
  } catch (error) {
    console.error('Error updating quotation due date:', error)
    throw error
  }
}

/**
 * Delete a quotation
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<Object>} Deletion response
 */
export const deleteQuotation = async (quotationId) => {
  try {
    const response = await del(`/quotation/${quotationId}`)
    // Backend returns { success: true, message: "..." }
    // API interceptor already extracts response.data, so we get { success: true, message: "..." }
    return response
  } catch (error) {
    console.error('Error deleting quotation:', error)
    throw error
  }
}

/**
 * Export quotation to PDF
 * @param {string} quotationId - Quotation ID
 * @param {Object} options - Export options
 * @param {boolean} options.force - Force regeneration even if a cached PDF exists
 * @returns {Promise<Object>} PDF URL and expiry
 */
const pollPdfStatus = async (quotationId, intervalMs = 2000, timeoutMs = 120000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, intervalMs))
    const res = await get(`/quotation/${quotationId}/pdf-status`)
    const status = res?.data?.status || res?.status
    if (status === 'ready') return res?.data?.pdfUrl || res?.pdfUrl || null
    if (status !== 'generating') throw new Error('PDF generation failed')
  }
  throw new Error('PDF generation timed out')
}

export const exportQuotationToPdf = async (quotationId, options = {}) => {
  try {
    const query = options.force ? '?force=true' : ''
    const response = await post(`/quotation/${quotationId}/export-pdf${query}`, {}, { timeout: 30000 })
    if (typeof response === 'string') return response
    const pdfUrl = response?.data?.pdfUrl || response?.pdfUrl || response?.url || null
    if (pdfUrl) return pdfUrl
    // Server responded with 202 — PDF is generating in background, poll for result.
    const status = response?.data?.status || response?.status
    if (status === 'generating') return await pollPdfStatus(quotationId)
    return null
  } catch (error) {
    console.error('Error exporting quotation to PDF:', error)
    throw error
  }
}

/**
 * Send quotation via email
 * @param {string} quotationId - Quotation ID
 * @param {Object} emailData - Email data (recipientEmail, ccEmails, subject, message)
 * @returns {Promise<Object>} Send response
 */
export const sendQuotation = async (quotationId, emailData) => {
  try {
    const response = await post(`/quotation/${quotationId}/send`, emailData, { timeout: 120000 })
    // Backend returns { success: true, message: "...", data: {...} }
    // API interceptor already extracts response.data, so we get { success: true, message: "...", data: {...} }
    return response.data || response
  } catch (error) {
    console.error('Error sending quotation:', error)
    throw error
  }
}

/**
 * Mark quotation as seen
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<Object>} Response
 */
export const setQuotationSeen = async (quotationId) => {
  try {
    const response = await get(`/quotation/${quotationId}/seen`)
    // Backend returns { success: true, message: "..." }
    // API interceptor already extracts response.data, so we get { success: true, message: "..." }
    return response
  } catch (error) {
    console.error('Error marking quotation as seen:', error)
    throw error
  }
}

/**
 * Update quotation status (accepted/rejected)
 * @param {string} quotationId - Quotation ID
 * @param {string} status - Status ('accepted' or 'rejected')
 * @returns {Promise<Object>} Response
 */
export const setQuotationStatus = async (quotationId, status, paymentMethod = null) => {
  try {
    let url = `/quotation/${quotationId}/updatestatus?status=${status}`;
    if (paymentMethod) {
      url += `&paymentMethod=${paymentMethod}`;
    }
    console.log('🌐 Calling API:', url);
    const response = await get(url);
    console.log('✅ API Response:', response);
    return response;
  } catch (error) {
    console.error('❌ Error updating quotation status:', error);
    throw error;
  }
}

/**
 * Get the download URL for a quotation PDF
 * @param {string} quotationId - Quotation ID
 * @returns {string} Download URL
 */
export const getDownloadQuotationUrl = (quotationId) => {
  return `${API_URL}/quotation/${quotationId}/download`
}
