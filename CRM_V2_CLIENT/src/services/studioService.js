import { get, post, put } from "./api";


/**
 * Get studio configuration by studio name/subdomain
 * @param {string} studioName - Studio name or subdomain
 * @returns {Promise<StudioConfig>}
 */
export const getStudioConfig = async (studioName) => {
  try {
    const response = await get(`/lead/${studioName}/leadform`)
    return response.data;
  } catch (error) {
    console.error('Error fetching studio config:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch studio config')
  }
}

/**
 * Update studio configuration
 * @param {string} studioName - Studio name or subdomain
 * @param {StudioConfig} config - Updated configuration
 * @returns {Promise<StudioConfig>}
 */
export const updateLeadForm = async (studioId, updateData) => {
  try {
    const response = await post(`/studio/updateleadform/`, updateData)
    return response.data
  } catch (error) {
    console.error('Error updating studio config:', error)
    throw new Error(error.response?.data?.message || 'Failed to update studio config')
  }
}

/**
 * Submit lead form (public endpoint - no auth required)
 * @param {string} studioName - Studio name or subdomain
 * @param {LeadFormData} formData - Form submission data
 * @returns {Promise<any>}
 */
export const submitLeadForm = async (studioName, formData) => {
  try {
    const response = await post(
      `${API_URL}/studio/${studioName}/lead`,
      formData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data.data
  } catch (error) {
    console.error('Error submitting lead form:', error)
    throw new Error(error.response?.data?.message || 'Failed to submit lead form')
  }
}

/**
 * Update studio and personal info
 * @param {Object} data - { personalInfo, studioInfo }
 * @param {File[]} portfolioFiles - Optional portfolio files
 * @param {File} logoFile - Optional logo file
 * @returns {Promise<any>}
 */
export const updateStudioProfile = async (data, portfolioFiles = [], logoFile = null, brochureFiles = []) => {
  try {
    const formData = new FormData()
    formData.append('personalInfo', JSON.stringify(data.personalInfo))
    formData.append('studioInfo', JSON.stringify(data.studioInfo))

    if (logoFile) {
      formData.append('logo', logoFile)
    }

    if (portfolioFiles.length > 0) {
      portfolioFiles.forEach(file => {
        formData.append('portfolioImages', file)
      })
    }

    if (brochureFiles.length > 0) {
      brochureFiles.forEach(file => {
        formData.append('brochureFiles', file)
      })
    }

    const response = await post('/studio/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error updating studio profile:', error)
    throw new Error(error.response?.data?.message || 'Failed to update studio profile')
  }
}

/**
 * Upload image to studio (for logo, background, portfolio)
 * @param {File} file - Image file to upload
 * @param {string} type - Image type: 'logo' | 'background' | 'portfolio'
 * @returns {Promise<string>} - Uploaded image URL
 */
export const uploadStudioImage = async (file, type = 'portfolio') => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)

    const response = await post('/studio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.url
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error(error.response?.data?.message || 'Failed to upload image')
  }
}

/**
 * Mark tour as completed
 * @returns {Promise<any>}
 */
export const completeTour = async () => {
  try {
    const response = await put('/studio/tour-complete', {})
    return response.data
  } catch (error) {
    console.error('Error completing tour:', error)
    // Don't throw error to avoid disrupting user experience if just a flag update fails
    return null
  }
}

/**
 * Delete user account and all associated data
 * @param {string} reason - Reason for account deletion
 * @returns {Promise<any>}
 */
export const deleteAccount = async (reason) => {
  try {
    const response = await post('/user/delete-account', { reason })
    return response
  } catch (error) {
    console.error('Error deleting account:', error)
    throw new Error(error.message || error.response?.data?.message || 'Failed to delete account')
  }
}







