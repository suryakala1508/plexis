import { post } from './api';
import { getAuthToken } from './galleryService';


/**
 * Upload Header Banner images to FastAPI
 * @param {File[]} files - Array of image files
 * @returns {Promise<Object>} Expected response: { success: true, urls: string[] }
 */
export const uploadHeaderImages = async (files) => {
  const token = await getAuthToken();
  const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";
  
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  return await post(`${FASTAPI_URL}/upload-header`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * Upload Background images to FastAPI
 * @param {File[]} files - Array of image files
 * @returns {Promise<Object>} Expected response: { success: true, urls: string[] }
 */
export const uploadBackgroundImages = async (files) => {
  const token = await getAuthToken();
  const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";
  
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  return await post(`${FASTAPI_URL}/upload-background`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
