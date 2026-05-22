import { get, post, put, del } from './api';

/**
 * Follow-Up Service
 * Handles all follow-up related API calls
 */

/**
 * Get all follow-ups for a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<Array>} Array of follow-ups
 */
export const getFollowUps = async (leadId) => {
  try {
    const response = await get(`/followup/lead/${leadId}`);
    // Backend returns { success: true, data: [...] }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    throw new Error(error.message || 'Failed to fetch follow-ups');
  }
};

/**
 * Get all follow-ups for a client
 * @param {string} clientId - Client ID
 * @returns {Promise<Array>} Array of follow-ups
 */
export const getClientFollowUps = async (clientId) => {
  try {
    const response = await get(`/followup/client/${clientId}`);
    // Backend returns { success: true, data: [...] }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching client follow-ups:', error);
    throw new Error(error.message || 'Failed to fetch client follow-ups');
  }
};

/**
 * Add a new follow-up for a lead
 * @param {string} leadId - Lead ID
 * @param {Object} followUpData - Follow-up data
 * @param {Date|string} followUpData.date - Follow-up date
 * @param {string} followUpData.notes - Follow-up notes
 * @param {string} followUpData.type - Follow-up type (call, email, meeting, whatsapp)
 * @param {string} followUpData.reason - Follow-up reason
 * @returns {Promise<Object>} Created follow-up
 */
export const addFollowUp = async (leadId, followUpData) => {
  try {
    const response = await post(`/followup/lead/${leadId}`, followUpData);
    // Backend returns { success: true, data: {...} }
    return response.data || response;
  } catch (error) {
    console.error('Error adding follow-up:', error);
    throw new Error(error.message || 'Failed to add follow-up');
  }
};

/**
 * Add a new follow-up for a client
 * @param {string} clientId - Client ID
 * @param {Object} followUpData - Follow-up data
 * @returns {Promise<Object>} Created follow-up
 */
export const addClientFollowUp = async (clientId, followUpData) => {
  try {
    const response = await post(`/followup/client/${clientId}`, followUpData);
    // Backend returns { success: true, data: {...} }
    return response.data || response;
  } catch (error) {
    console.error('Error adding client follow-up:', error);
    throw new Error(error.message || 'Failed to add client follow-up');
  }
};

/**
 * Update a follow-up
 * @param {string} followUpId - Follow-up ID
 * @param {Object} updateData - Updated follow-up data
 * @param {Date|string} updateData.date - Follow-up date
 * @param {string} updateData.notes - Follow-up notes
 * @param {string} updateData.type - Follow-up type
 * @param {string} updateData.reason - Follow-up reason
 * @returns {Promise<Object>} Updated follow-up
 */
export const updateFollowUp = async (followUpId, updateData) => {
  try {
    const response = await put(`/followup/${followUpId}`, updateData);
    // Backend returns { success: true, data: {...} }
    return response.data || response;
  } catch (error) {
    console.error('Error updating follow-up:', error);
    throw new Error(error.message || 'Failed to update follow-up');
  }
};

/**
 * Delete a follow-up
 * @param {string} followUpId - Follow-up ID
 * @returns {Promise<Object>} Success response
 */
export const deleteFollowUp = async (followUpId) => {
  try {
    const response = await del(`/followup/${followUpId}`);
    // Backend returns { success: true, message: "..." }
    return response;
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    throw new Error(error.message || 'Failed to delete follow-up');
  }
};

/**
 * Mark a follow-up as completed or pending
 * @param {string} followUpId - Follow-up ID
 * @param {boolean} status - true for completed, false for pending
 * @returns {Promise<Object>} Updated follow-up
 */
export const markFollowUpCompleted = async (followUpId, status) => {
  try {
    const response = await post(`/followup/${followUpId}/mark`, { status });
    // Backend returns { success: true, data: {...} }
    return response.data || response;
  } catch (error) {
    console.error('Error marking follow-up:', error);
    throw new Error(error.message || 'Failed to mark follow-up');
  }
};














