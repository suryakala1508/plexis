import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Submit founding studio onboard form
 * @param {object} formData - Form data containing studio details
 * @returns {Promise} Response from backend
 */
export const submitFoundingStudioForm = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/api/foundingStudio/submit`, formData)
    return response.data
  } catch (error) {
    throw error
  }
}
