import { get, post, del } from './api';

const UPLOAD_TIMEOUT_MS = 120000;

const mapUploadErrorMessage = (error) => {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 413) {
        return 'You have uploaded more than 25 MB. Background image must be less than 25 MB.';
    }

    if (error?.code === 'ECONNABORTED') {
        return 'Upload timed out. Please try again or use a smaller image.';
    }

    if (error?.request && !error?.response) {
        return 'Network error while uploading. Please check your connection and try again.';
    }

    return serverMessage || error?.message || 'Failed to upload images';
};

/**
 * Upload multiple images for lead form (header or background) or quotation background
 * @param {File[]} files - Array of image files
 * @param {string} imageType - 'header', 'background', or 'quotationBackground'
 * @returns {Promise} Response with uploaded URLs and storage info
 */
export const uploadMultipleImages = async (files, imageType, options = {}) => {
    try {
        const formData = new FormData();
        formData.append('imageType', imageType);
        if (options.uploadPurpose) {
            formData.append('uploadPurpose', options.uploadPurpose);
        }

        files.forEach((file) => {
            formData.append('images', file);
        });

        const response = await post('/studio/upload-multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: UPLOAD_TIMEOUT_MS,
        });

        return response;
    } catch (error) {
        error.message = mapUploadErrorMessage(error);
        console.error('Upload multiple images error:', error);
        throw error;
    }
};

/**
 * Select which image to use as active
 * @param {string} imageUrl - URL of the image to select
 * @param {string} imageType - 'header', 'background', or 'quotationBackground'
 * @param {string} deviceType - 'desktop' or 'mobile'
 * @returns {Promise} Response with selected image
 */
export const selectImage = async (imageUrl, imageType, deviceType = 'desktop') => {
    try {
        const response = await post('/studio/select-image', {
            imageUrl,
            imageType,
            deviceType
        });

        return response;
    } catch (error) {
        console.error('Select image error:', error);
        throw error;
    }
};

/**
 * Delete an image from the collection
 * @param {string} imageUrl - URL of the image to delete
 * @param {string} imageType - 'header', 'background', or 'quotationBackground'
 * @returns {Promise} Response confirming deletion
 */
export const deleteImage = async (imageUrl, imageType) => {
    try {
        const response = await del('/studio/delete-image', {
            data: { imageUrl, imageType },
        });

        return response;
    } catch (error) {
        console.error('Delete image error:', error);
        throw error;
    }
};

/**
 * Get all studio images
 * @param {string} type - 'header', 'background', 'quotationBackground', or 'all'
 * @returns {Promise} Response with images and selected images
 */
export const getImages = async (type = 'all') => {
    try {
        const response = await get(`/studio/images?type=${type}`);
        return response;
    } catch (error) {
        console.error('Get images error:', error);
        throw error;
    }
};
