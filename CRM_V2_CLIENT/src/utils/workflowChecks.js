import { get } from '../services/api'
import { createProject } from '../services/projectService'

/**
 * Workflow Validation Utilities
 * Helper functions to validate workflow state transitions
 */

/**
 * Check if a project already exists for a given lead
 * @param {string} leadId - The lead ID to check
 * @returns {Promise<Object|null>} - Returns project object if exists, null otherwise
 */
export const checkProjectExists = async (leadId) => {
  try {
    const response = await get(`/project/by-lead/${leadId}`)
    const projects = response.data || response
    
    // Return the first project found for this lead
    if (Array.isArray(projects) && projects.length > 0) {
      return projects[0]
    }
    
    return null
  } catch (error) {
    // If 404 or no projects found, return null
    if (error.response?.status === 404) {
      return null
    }
    console.error('Error checking for existing project:', error)
    throw error
  }
}

/**
 * Validate that a quotation is in "accepted" status before contract generation
 * @param {Object} quotation - The quotation object to validate
 * @returns {boolean} - True if quotation can be converted to contract
 */
export const validateQuotationForContract = (quotation) => {
  if (!quotation) {
    throw new Error('Quotation not found')
  }
  
  const status = quotation.status?.toLowerCase()
  if (status !== 'accepted') {
    throw new Error(`Quotation must be accepted before generating contract. Current status: ${quotation.status}`)
  }
  
  return true
}

/**
 * Validate that a lead is ready for project conversion
 * @param {Object} lead - The lead object to validate
 * @param {Object} acceptedQuotation - The accepted quotation (optional)
 * @returns {boolean} - True if lead can be converted to project
 */
export const validateLeadForProject = (lead, acceptedQuotation = null) => {
  if (!lead) {
    throw new Error('Lead not found')
  }
  
  // Check lead status
  if (lead.status !== 'Confirmed') {
    throw new Error(`Lead must have "Confirmed" status. Current status: ${lead.status}`)
  }
  
  // Optionally verify accepted quotation exists
  if (acceptedQuotation === null) {
    console.warn('No accepted quotation provided for validation')
  }
  
  return true
}

/**
 * Safely extract monetary value from various formats
 * @param {*} value - Value to extract (could be number, string, or object)
 * @returns {number} - Numeric value
 */
export const extractMonetaryValue = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[₹$,]/g, '')
    return parseFloat(cleaned) || 0
  }
  return 0
}
