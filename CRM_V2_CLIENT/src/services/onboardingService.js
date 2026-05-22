// Onboarding Service
// Handles onboarding data submission with file upload
// Backend uses cookie-based authentication

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const onboardingAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/**
 * Submit complete onboarding data with logo upload
 * @param {FormData} onboardingData - FormData with onboarding information and logo
 * @returns {Promise} Response from server
 */
export const submitOnboarding = async (onboardingData) => {
  try {
    // Axios automatically sets correct Content-Type header for FormData
    const response = await onboardingAxios.post('/studio/onboard', onboardingData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Backend updates isOnboared flag automatically
    return response.data;
  } catch (error) {
    console.error('Onboarding submission error:', error);
    throw new Error(error.response?.data?.message || 'Onboarding submission failed');
  }
};

/**
 * Update onboarding data (partial update)
 * @param {Object} updateData - Data to update
 * @returns {Promise} Response from server
 */
export const updateOnboarding = async (updateData) => {
  try {
    const response = await onboardingAxios.put('/studio/onboard', updateData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Onboarding update error:', error);
    throw new Error(error.response?.data?.message || 'Onboarding update failed');
  }
};

/**
 * Format onboarding data for submission with logo file
 * @param {Object} formData - Raw form data from onboarding component
 * @returns {FormData} FormData object for multipart/form-data submission
 */
export const formatOnboardingData = (formData) => {
  const { user, studio, preferences, logo, portfolioImages = [] } = formData;
  
  const formDataObj = new FormData();
  
  // Add JSON data as a string field
  const jsonData = {
    // Step 1: Personal Information
    personalInfo: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone, // Already includes country code (e.g., "+919876543210")
    },
    
    // Step 2: Studio Details
    studioInfo: {
      name: studio.studioName,
      mainAddress: {
        addressLine1: studio.addressLine1,
        addressLine2: studio.addressLine2 || '',
        city: studio.city,
        state: studio.state,
        country: studio.country,
      },
      gstNumber: studio.gstNumber || '',
      // Format branches with full phone numbers
      branches: (studio.branches || []).map(branch => ({
        addressLine1: branch.addressLine1,
        addressLine2: branch.addressLine2 || '',
        city: branch.city,
        state: branch.state,
        country: branch.country,
        phone: `${branch.countryCode}${branch.phone}`, // Combine country code + phone
        countryCode: branch.countryCode,
      })),
    },
    
    // Step 3: Preferences & Integrations
    preferences: {
      businessType: preferences.businessType,
      integrations: preferences.integrations,
    },

    media: {
      hasLogo: Boolean(logo),
      portfolioCount: portfolioImages.length,
    },
    
    // Metadata
    completedAt: new Date().toISOString(),
    onboardingVersion: '1.0',
  };

  // Add JSON data
  formDataObj.append('data', JSON.stringify(jsonData));

  // Add logo file if uploaded
  if (logo) {
    formDataObj.append('logo', logo);
  }

  if (portfolioImages && Array.isArray(portfolioImages)) {
    portfolioImages.forEach((imageItem, index) => {
      // imageItem is an object with { id, file, preview }
      // We need to append the actual file, not the wrapper object
      const file = imageItem.file || imageItem;
      if (file && file instanceof File) {
        formDataObj.append('portfolioImages', file, file.name || `portfolio-${index}.jpg`);
      } else {
        console.warn(`⚠️ Skipping invalid portfolio image at index ${index}:`, imageItem);
      }
    });
  }

  return formDataObj;
};

export default {
  submitOnboarding,
  updateOnboarding,
  formatOnboardingData,
};
