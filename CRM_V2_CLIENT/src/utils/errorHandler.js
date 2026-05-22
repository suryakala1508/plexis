/**
 * Error Handler Utility
 * Extracts user-friendly error messages from API errors
 */

/**
 * Extract user-friendly error message from API error
 * @param {Error} error - The error object from API call
 * @param {string} fallback - Fallback message if no specific message found
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, fallback = 'An error occurred') => {
  // Network error (no response from server)
  if (!error.response) {
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection and try again.'
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.'
    }
    return error.message || 'Unable to connect to server. Please try again.'
  }

  // Extract message from response
  const response = error.response
  const data = response.data

  // Priority order for error messages:
  // 1. Backend message field
  if (data?.message) return data.message
  
  // 2. Backend error field
  if (data?.error) return data.error
  
  // 3. Validation errors (array of field errors)
  if (data?.errors && Array.isArray(data.errors)) {
    return data.errors.map(err => err.message || err).join(', ')
  }

  // 4. Validation errors (object with field keys)
  if (data?.validation && typeof data.validation === 'object') {
    const messages = Object.values(data.validation).filter(Boolean)
    if (messages.length > 0) {
      return messages.join(', ')
    }
  }
  
  // 5. HTTP status specific messages
  switch (response.status) {
    case 400:
      return 'Invalid request. Please check your input.'
    case 401:
      return 'Session expired. Please log in again.'
    case 403:
      return data?.message || 'Access denied. You don\'t have permission for this action.'
    case 404:
      return 'Resource not found.'
    case 409:
      return data?.message || 'This item already exists.'
    case 413:
      return 'File too large. Please upload a smaller file.'
    case 422:
      return 'Validation failed. Please check your input.'
    case 429:
      return 'Too many requests. Please try again later.'
    case 500:
      return 'Server error. Please try again or contact support.'
    case 502:
      return 'Server is temporarily unavailable. Please try again.'
    case 503:
      return 'Service unavailable. Please try again later.'
    default:
      return fallback
  }
}

/**
 * Check if error is due to expired subscription
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isSubscriptionExpired = (error) => {
  return error.response?.status === 403 && 
         error.response?.data?.message?.toLowerCase().includes('subscription expired')
}

/**
 * Check if error is due to validation
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  return error.response?.status === 400 || 
         error.response?.status === 422 ||
         error.response?.data?.errors || 
         error.response?.data?.validation
}

/**
 * Extract field-level validation errors
 * @param {Error} error - The error object
 * @returns {Object} Object with field names as keys and error messages as values
 */
export const getValidationErrors = (error) => {
  const data = error.response?.data
  
  // If validation object exists, return it directly
  if (data?.validation && typeof data.validation === 'object') {
    return data.validation
  }
  
  // If errors array exists, convert to object
  if (data?.errors && Array.isArray(data.errors)) {
    const fieldErrors = {}
    data.errors.forEach(err => {
      if (err.field && err.message) {
        fieldErrors[err.field] = err.message
      }
    })
    return fieldErrors
  }
  
  return {}
}

/**
 * Check if error is authentication related
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  return error.response?.status === 401
}

/**
 * Check if error is permission related
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isPermissionError = (error) => {
  return error.response?.status === 403
}
