import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const formAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFormConfig = async (studioId) => {
  try {
    const response = await formAxios.get(`/forms/config/${studioId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching form config:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch form config');
  }
}

export const saveFormConfig = async (formConfig) => {
  try {
    const response = await formAxios.post('/forms/config', formConfig);
    return response.data.data;
  } catch (error) {
    console.error('Error saving form config:', error);
    throw new Error(error.response?.data?.message || 'Failed to save form config');
  }
}

export const submitPublicInquiry = async (studioId, formData) => {
  try {
    // Note: This endpoint doesn't need withCredentials since it's a public form
    const response = await axios.post(`${API_URL}/forms/submit/${studioId}`, formData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    throw new Error(error.response?.data?.message || 'Failed to submit inquiry');
  }
}





