import { get, post, put, patch, del } from './api'

/**
 * Superadmin Service
 * Handles all superadmin-related API calls
 */

/**
 * Creates a new studio manually (Superadmin only)
 * @param {Object} studioData - { name, studioName, email, phone, storageLimit }
 * @returns {Promise<Object>} Created studio response
 */
export const createStudio = async (studioData) => {
  try {
    const response = await post('/superadmin/studios', studioData)
    return response.data || response
  } catch (error) {
    console.error('Failed to create studio:', error.message)
    throw error
  }
}

/**
 * Superadmin login
 * @param {Object} credentials - email and password
 * @returns {Promise<Object>} Login response
 */
export const loginSuperAdmin = async (credentials) => {
  try {
    // Note: Backend currently handles admin login via /auth/login as well,
    // but having a dedicated superadmin service is cleaner.
    const response = await post('/auth/login', credentials)
    return response.data || response
  } catch (error) {
    console.error('Failed to login superadmin:', error.message)
    throw error
  }
}

/**
 * Get admin dashboard data with all studios and aggregated stats
 * @returns {Promise<Object>} Dashboard data with studios array and stats
 */
export const getAdminDashboard = async () => {
  try {
    const response = await get('/superadmin/dashboard')
    return response.data || response
  } catch (error) {
    // If AdminVerify fails, it might return 401
    console.error('Failed to fetch admin dashboard:', error.message)
    throw error
  }
}

/**
 * Update user subscription (storage and validity)
 * @param {Object} data - { refNo, additionalStorage, extendDays }
 * @returns {Promise<Object>} Success message
 */
export const updateUserSubscription = async (data) => {
  try {
    // additionalStorage should be in MB as per backend example, but we might send GB and convert
    const response = await put('/superadmin/update-user-subscription', data)
    return response.data || response
  } catch (error) {
    console.error('Failed to update user subscription:', error.message)
    throw error
  }
}

/**
 * Update a studio's subscription plan (Super Admin only)
 * @param {Object} data - { refNo, planType }
 * @returns {Promise<Object>} Success message
 */
export const updateStudioPlanByAdmin = async (data) => {
  try {
    const response = await put('/superadmin/update-studio-plan', data)
    return response.data || response
  } catch (error) {
    console.error('Failed to update studio plan:', error.message)
    throw error
  }
}

/**
 * Updates a studio's individual feature overrides (Super Admin only)
 * @param {string} studioId - The studio's reference ID/MongoDB ID (or refNo depending on backend route setup)
 * @param {Object} features - Map of feature name to boolean
 * @returns {Promise<Object>} Success message
 */
export const updateStudioFeatureOverrides = async (studioId, featureOverrides) => {
  try {
    const response = await patch(`/superadmin/studios/${studioId}/subscription/features`, { featureOverrides })
    return response.data || response
  } catch (error) {
    console.error('Failed to update feature overrides:', error.message)
    throw error
  }
}

/**
 * Resets a studio's feature overrides back to plan defaults (Super Admin only)
 * @param {string} studioId - The studio's reference ID/MongoDB ID
 * @returns {Promise<Object>} Success message
 */
export const resetStudioFeatureOverrides = async (studioId) => {
  try {
    const response = await post(`/superadmin/studios/${studioId}/subscription/features/reset`)
    return response.data || response
  } catch (error) {
    console.error('Failed to reset feature overrides:', error.message)
    throw error
  }
}

/**
 * Superadmin deletion of a studio and all associated data
 * @param {string} studioId - The studio's reference ID/MongoDB ID
 * @returns {Promise<Object>} Success message
 */
export const deleteStudioByAdmin = async (studioId) => {
  try {
    const response = await del(`/superadmin/studios/${studioId}`)
    return response.data || response
  } catch (error) {
    console.error('Failed to delete studio:', error.message)
    throw error
  }
}

/**
 * Legacy support for components still using individual calls
 * @deprecated Use getAdminDashboard for better performance
 */
export const getAllStudios = async () => {
  const data = await getAdminDashboard()
  return data.studios || []
}

/**
 * Legacy support
 * @deprecated Data now included in dashboard
 */
export const getStudioStorageUsage = async () => {
  return { used: 0, limit: 0 } // Mocked as it's no longer needed individually
}

/**
 * Get detailed info for a single studio (clients, leads, projects)
 * @param {string} refNo - Studio reference number
 * @returns {Promise<Object>} Studio details with counts and recent records
 */
export const getStudioDetails = async (refNo) => {
  try {
    const response = await get(`/superadmin/studios/${refNo}/details`)
    return response.data || response
  } catch (error) {
    console.error('Failed to fetch studio details:', error.message)
    throw error
  }
}

/**
 * Export studio leads as CSV
 * @param {string} refNo
 */
export const exportStudioLeads = async (refNo) => {
  try {
    const response = await get(`/superadmin/studios/${refNo}/export/leads`, { responseType: 'blob' });
    return response;
  } catch (error) {
    console.error('Failed to export leads:', error);
    throw error;
  }
}

/**
 * Export studio clients as CSV
 * @param {string} refNo
 */
export const exportStudioClients = async (refNo) => {
  try {
    const response = await get(`/superadmin/studios/${refNo}/export/clients`, { responseType: 'blob' });
    return response;
  } catch (error) {
    console.error('Failed to export clients:', error);
    throw error;
  }
}

/**
 * Export studio gallery as ZIP
 * @param {string} refNo
 */
export const exportStudioGallery = async (refNo) => {
  try {
    const response = await get(`/superadmin/studios/${refNo}/export/gallery`, { responseType: 'blob' });
    return response;
  } catch (error) {
    console.error('Failed to export gallery:', error);
    throw error;
  }
}

/**
 * Get all upgrade requests (tickets with issueType "Plan Upgrade")
 * @returns {Promise<Object>} Upgrade requests with user and studio info
 */
export const getUpgradeRequests = async () => {
  try {
    const response = await get('/superadmin/upgrade-requests')
    return response.data || response
  } catch (error) {
    console.error('Failed to fetch upgrade requests:', error.message)
    throw error
  }
}

/**
 * Get all tickets raised by users
 * @returns {Promise<Object>} All tickets with user and studio info
 */
export const getAllTickets = async () => {
  try {
    const response = await get('/superadmin/tickets')
    // Response is already the data object from axios interceptor
    // Backend returns: { success: true, tickets: [...] }
    if (response && response.tickets) {
      return response
    }
    // Fallback if structure is different
    if (Array.isArray(response)) {
      return { success: true, tickets: response }
    }
    return { success: true, tickets: [] }
  } catch (error) {
    console.error('Failed to fetch tickets:', error)
    throw error
  }
}

/**
 * Get a single ticket by ID with full details including attachments
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Object>} Ticket with full details
 */
export const getTicketById = async (ticketId) => {
  try {
    const response = await get(`/superadmin/tickets/${ticketId}`)
    return response.data || response
  } catch (error) {
    console.error('Failed to fetch ticket:', error)
    throw error
  }
}

/**
 * Update ticket status, priority, or notes
 * @param {Object} data - { ticketId, status?, priority?, adminNotes? }
 * @returns {Promise<Object>} Updated ticket
 */
export const updateTicket = async (data) => {
  try {
    const response = await put('/superadmin/update-ticket', data)
    return response.data || response
  } catch (error) {
    console.error('Failed to update ticket:', error)
    throw error
  }
}

/**
 * Send email to ticket owner
 * @param {string} ticketId - Ticket ID
 * @param {Object} emailData - { subject?, message }
 * @returns {Promise<Object>} Success response
 */
export const sendTicketEmail = async (ticketId, emailData) => {
  try {
    const response = await post(`/superadmin/tickets/${ticketId}/send-email`, emailData)
    return response.data || response
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}
