// services/galleryService.js

import axios from "axios";
import { get, post, put, del, API_URL } from "./api";


const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "https://fastapi.plexis.in";
const UPLOAD_TIMEOUT_MS = 60000;

const isImageFile = (file) => {
  return !!file && typeof file.type === "string" && file.type.startsWith("image/");
};

const normalizeUploadFiles = (files) => {
  const normalizedFiles = Array.isArray(files) ? files : Array.from(files || []);

  if (normalizedFiles.length === 0) {
    throw new Error("No files provided for upload");
  }

  const invalidFiles = normalizedFiles.filter((file) => !isImageFile(file));
  if (invalidFiles.length > 0) {
    const rejectedNames = invalidFiles
      .map((file) => file?.name || "Unnamed file")
      .slice(0, 5)
      .join(", ");

    throw new Error(`Only image files are allowed. Rejected: ${rejectedNames}`);
  }

  return normalizedFiles;
};

const getFastApiUploadUrl = () => {
  const baseUrl = (FASTAPI_URL || "").trim();
  if (!baseUrl) {
    throw new Error(
      "Image upload service URL is not configured. Please set VITE_FASTAPI_URL and retry."
    );
  }

  return `${baseUrl}/upload-image`;
};

const formatUploadError = (error, fallbackMessage = "Failed to upload images") => {
  if (error?.response) {
    const status = error.response.status;
    const detail = error.response?.data?.detail;
    const message = error.response?.data?.message;

    if (status === 401) {
      return "Authentication failed. Please refresh and try again.";
    }

    if (status === 413) {
      return "One or more images are too large for upload. Please compress and retry.";
    }

    if (status >= 500) {
      return "Upload service is temporarily unavailable. Please try again in a moment.";
    }

    return detail || message || fallbackMessage;
  }

  if (error?.code === "ECONNABORTED") {
    return "Image upload timed out. Please check your connection and retry.";
  }

  if (error?.code === "ERR_NETWORK" || error?.request) {
    return "Unable to reach image upload service. Please check that the FastAPI upload server is running and reachable.";
  }

  return error?.message || fallbackMessage;
};
// services/galleryService.js

/**
 * Helper to extract clean folder name from full path
 * @param {string} folderPath - Full path like "6953f893ca41c26f76889730/Reception"
 * @returns {string} Clean name like "Reception"
 */
export const getCleanFolderName = (folderPath) => {
  if (!folderPath) return "AllPhotos";

  // Split by "/" and get the last part
  const parts = folderPath.split("/");
  return parts[parts.length - 1] || folderPath;
};

/**
 * Helper to get folder name for upload (without projectId, as FastAPI server adds it)
 * @param {string} projectTitle - Project title (not used, but kept for compatibility)
 * @param {string} folderName - Clean folder name
 * @returns {string} Folder name like "Reception" (without projectId prefix)
 */
export const getFullFolderPath = (projectTitle, folderName) => {
  if (!folderName || folderName === "AllPhotos") {
    return "AllPhotos";
  }
  // Remove projectId prefix if it exists (for consistency)
  const parts = folderName.split("/");
  return parts[parts.length - 1] || folderName;
};

/**
 * Helper to construct folder path with projectId (for storage in DB)
 * @param {string} projectId - Project ID
 * @param {string} folderName - Clean folder name
 * @returns {string} Folder path like "projectId/Reception"
 */
export const getFolderPathWithProjectId = (projectId, folderName) => {
  if (!folderName || folderName === "AllPhotos") {
    return "AllPhotos";
  }
  // If already has projectId prefix, return as is
  if (folderName.startsWith(`${projectId}/`)) {
    return folderName;
  }
  return `${projectId}/${folderName}`;
};

export const getAuthToken = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await get("/auth/getauth");
      const token = response?.token;

      if (!token) {
        throw new Error("No token received from server");
      }

      return token;
    } catch (error) {
      if (i === retries - 1) {
        if (error.response?.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(
          "Failed to get authentication token. Please try again."
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

/**
 * Upload images with proper folder handling
 */
export const uploadImages = async (
  files,
  eventName,
  eventDate,
  folderName = "AllPhotos", // DEFAULT TO "AllPhotos"
  tags = [],
  token = null // Accept optional token for batch uploads
) => {
  try {
    const normalizedFiles = normalizeUploadFiles(files);

    if (!eventName || !String(eventName).trim()) {
      throw new Error("Event name is required");
    }

    const activeToken = token || await getAuthToken();
    const uploadUrl = getFastApiUploadUrl();


    // CRITICAL FIX: Use "AllPhotos" if no folder selected
    const finalFolderName = folderName?.trim() || "AllPhotos";


    const formData = new FormData();
    formData.append("event_name", eventName);
    formData.append("event_date", eventDate);
    formData.append("folderName", finalFolderName); // Use final folder name
    formData.append("tags", JSON.stringify(tags)); // Add tags support

    // Append all files
    normalizedFiles.forEach((file) => {
      formData.append("files", file);
    });

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
        "Content-Type": "multipart/form-data",
      },
      timeout: UPLOAD_TIMEOUT_MS,
    });

    
    // Calculate total size for storage tracking
    const totalBytes = normalizedFiles.reduce((acc, file) => acc + file.size, 0);
    
    // Increment storage on backend
    try {
      await incrementStorage(eventName, totalBytes);
    } catch (storageErr) {
      console.error("Failed to increment storage usage:", storageErr);
    }

    return response.data;

  } catch (error) {
    console.error("❌ Error uploading images:", error);

    throw new Error(formatUploadError(error));
  }
};

/**
 * Get images with optional folder filtering and pagination
 */
export const getEventImages = async (eventId, folderName = null, page = 1, limit = 0) => {
  try {
    let url = `/gallery/${eventId}`;
    const params = new URLSearchParams();

    if (folderName && folderName !== "AllPhotos") {
      params.append("folder", folderName);
    }
    
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await get(url);
    
    // If we're paginating, return the whole object { images, hasMore, total, page }
    if (limit > 0) {
      return {
        images: response.data || response.images || [],
        hasMore: response.hasMore,
        total: response.total,
        page: response.page
      };
    }
    // Backward compatibility for calls that don't paginate
    return response.data || response.images || [];
  } catch (error) {
    console.error("Error fetching event images:", error);
    throw new Error(error.message || "Failed to fetch event images");
  }
};

/**
 * Create a new folder in project
 */
export const createFolder = async (projectId, folderData) => {
  try {
    const response = await post(`/gallery/${projectId}/folders`, folderData);
    return response;
  } catch (error) {
    console.error("Error creating folder:", error);
    throw new Error(
      error.message || "Failed to create folder"
    );
  }
};

/**
 * Get all folders for a project
 */
export const getFolders = async (projectId) => {
  try {
    const response = await get(`/gallery/${projectId}/folders`);
    return response.folders || [];
  } catch (error) {
    console.error("Error fetching folders:", error);
    throw new Error(error.message || "Failed to fetch folders");
  }
};

/**
 * Update folder settings
 */
export const updateFolder = async (projectId, folderId, updates) => {
  try {
    const response = await put(
      `/gallery/${projectId}/folders/${folderId}`,
      updates
    );
    return response;
  } catch (error) {
    console.error("Error updating folder:", error);
    throw new Error(
      error.message || "Failed to update folder"
    );
  }
};

/**
 * Delete a folder
 */
export const deleteFolder = async (projectId, folderId) => {
  try {
    const response = await del(`/gallery/${projectId}/folders/${folderId}`);
    return response;
  } catch (error) {
    console.error("Error deleting folder:", error);
    throw new Error(
      error.message || "Failed to delete folder"
    );
  }
};

/**
 * Generate shareable link for gallery
 */
export const generateShareableLink = async (projectId, options = {}) => {
  try {
    const response = await post(`/gallery/${projectId}/share`, options);
    return response;
  } catch (error) {
    console.error("Error generating shareable link:", error);
    throw new Error(
      error.message || "Failed to generate shareable link"
    );
  }
};

/**
 * Verify PIN for gallery access
 */
export const verifyGalleryAccess = async (projectId, pin) => {
  try {
    const response = await post(`/gallery/${projectId}/verify`, { pin });
    return response;
  } catch (error) {
    console.error("Error verifying gallery access:", error);
    throw new Error(
      error.message || "Failed to verify access"
    );
  }
};

/**
 * Toggle favorite for folder or image
 * @param {string} projectId - Project ID
 * @param {string} itemId - Folder ID or Image ID
 * @param {string} type - "folder" or "image"
 */
export const toggleFavorite = async (projectId, itemId, type = "image") => {
  try {
    const response = await post(`/gallery/${projectId}/favorite`, {
      itemId,
      type
    });
    return response;
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw new Error(
      error.message || "Failed to toggle favorite"
    );
  }
};

/**
 * Move image to different folder
 */
export const moveImageToFolder = async (eventId, imageId, targetFolder) => {
  try {
    const response = await post(
      `/gallery/${eventId}/images/${imageId}/move`,
      { targetFolder }
    );
    return response;
  } catch (error) {
    console.error("Error moving image:", error);
    throw new Error(error.message || "Failed to move image");
  }
};

/**
 * Delete image permanently, or remove from folder if image is in other folders.
 * @param {string} eventId - Project ID
 * @param {string} imageId - Image ID
 * @param {string} [fromFolder] - Optional. When provided: remove from this folder only.
 *   If image is in other folders → just remove ref. If only here → delete doc + DO.
 */
export const deleteImagePermanently = async (eventId, imageId, fromFolder) => {
  try {
    const url = `/gallery/${eventId}/images/${imageId}`;
    const config = fromFolder
      ? { params: { fromFolder } }
      : {};
    const response = await del(url, config);
    return response;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw new Error(error.message || "Failed to delete image");
  }
};

/**
 * Move all images from folder to AllPhotos
 */
export const moveFolderImagesToAllPhotos = async (projectId, folderId) => {
  try {
    const response = await post(
      `/gallery/${projectId}/folders/${folderId}/move-images`
    );
    return response;
  } catch (error) {
    console.error("Error moving folder images:", error);
    throw new Error(error.message || "Failed to move folder images");
  }
};

/**
 * Duplicate images to a different folder
 */
export const duplicateImagesToFolder = async (projectId, imageIds, targetFolder) => {
  try {
    const response = await post(
      `/gallery/${projectId}/images/duplicate`,
      { imageIds, targetFolder }
    );
    return response;
  } catch (error) {
    console.error("Error duplicating images:", error);
    throw new Error(error.message || "Failed to duplicate images");
  }
};


/**
 * Search images by text query
 */
export const searchImages = async (projectId, queryText) => {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${FASTAPI_URL}/search-images`,
      {
        event_name: projectId, // This is the MongoDB ObjectId
        query_text: queryText,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.results || [];
  } catch (error) {
    console.error("Error searching images:", error);
    console.error("Error response:", error.response?.data);

    // Handle different error scenarios
    if (error.response) {
      const detail = error.response.data?.detail;

      // Check if detail contains specific error messages
      if (typeof detail === 'string') {
        if (detail.includes('No images found')) {
          throw new Error("No images found for this project. Please upload images first.");
        } else if (detail.includes('No embeddings found')) {
          throw new Error("Images are being processed. Please try again in a moment.");
        } else if (detail.includes('404:') || detail.includes('404')) {
          throw new Error("No images found for this project.");
        } else {
          throw new Error(detail);
        }
      } else {
        throw new Error("Failed to search images. Please try again.");
      }
    } else if (error.request) {
      throw new Error("Cannot reach search server. Please check your connection.");
    } else {
      throw new Error(error.message || "Failed to search images");
    }
  }
};

/**
 * Public search images by text query (uses auth token like all other endpoints)
 */
export const publicSearchImages = async (projectId, queryText) => {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${FASTAPI_URL}/search-images`,
      {
        event_name: projectId,
        query_text: queryText,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.results || [];
  } catch (error) {
    console.error("Error searching public images:", error);

    if (error.response) {
      if (error.response.status === 401) {
        const expErr = new Error("Your session has expired. Please re-enter your PIN.");
        expErr.code = "SESSION_EXPIRED";
        throw expErr;
      }

      const detail = error.response.data?.detail;
      if (typeof detail === 'string') {
        if (detail.includes('No images found')) {
          throw new Error("No images found for this search.");
        } else if (detail.includes('404:') || detail.includes('404')) {
          throw new Error("No images found.");
        } else {
          throw new Error(detail);
        }
      }
    }
    throw new Error("Failed to search images. Please try again.");
  }
};

/**
 * Batch upload for 100+ images
 */
export const batchUploadImages = async (
  files,
  eventName,
  eventDate,
  folderName = "AllPhotos",
  chunkSize = 20,
  onProgress,
  tags = []
) => {
  try {
    const normalizedFiles = normalizeUploadFiles(files);
    if (!eventName || !String(eventName).trim()) {
      throw new Error("Event name is required");
    }

    const token = await getAuthToken();
    const uploadUrl = getFastApiUploadUrl();
    const results = [];
    const total = normalizedFiles.length;
    const finalFolderName = folderName?.trim() || "AllPhotos";

    for (let i = 0; i < normalizedFiles.length; i += chunkSize) {
      const chunk = normalizedFiles.slice(i, i + chunkSize);

      const formData = new FormData();
      formData.append("event_name", eventName);
      formData.append("event_date", eventDate);
      formData.append("folderName", finalFolderName);
      formData.append("tags", JSON.stringify(tags));

      chunk.forEach((file) => {
        formData.append("files", file);
      });

      try {
        const response = await axios.post(
          uploadUrl,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            timeout: UPLOAD_TIMEOUT_MS,
          }
        );

        // Calculate total size of uploaded files in this chunk
        const chunkTotalBYTES = chunk.reduce((acc, file) => acc + file.size, 0);
        
        // Increment storage on our backend (fail-safe: don't block if this fails)
        try {
          await incrementStorage(eventName, chunkTotalBYTES);
        } catch (storageErr) {
          console.error("Failed to increment storage usage:", storageErr);
        }

        results.push({
          success: true,
          count: chunk.length,
          message: response.data.message,
        });

        if (onProgress) {
          onProgress(Math.min(i + chunkSize, total), total);
        }
      } catch (error) {
        results.push({
          success: false,
          count: chunk.length,
          error: formatUploadError(error, "Upload failed"),
        });
      }
    }

    const totalUploaded = results
      .filter((r) => r.success)
      .reduce((sum, r) => sum + r.count, 0);

    const totalFailed = results
      .filter((r) => !r.success)
      .reduce((sum, r) => sum + r.count, 0);

    if (totalUploaded === 0 && totalFailed > 0) {
      const firstError = results.find((r) => !r.success)?.error || "Upload failed";
      throw new Error(firstError);
    }

    return {
      success: true,
      totalUploaded,
      totalFailed,
      results,
    };
  } catch (error) {
    console.error("Error in batch upload:", error);
    throw new Error(formatUploadError(error, "Failed to batch upload images"));
  }
};


/**
 * Download single image
 * @param {string} projectId - Project ID
 * @param {string} imageUrl - Image URL
 * @param {string} filename - Optional filename
 */
export const downloadSingleImage = async (projectId, imageUrl, filename, quality = 'high', slug = null) => {
  try {
    const imageUrlOrId = imageUrl;
    const isUrl =
      typeof imageUrlOrId === "string" &&
      /^https?:\/\//i.test(imageUrlOrId);

    const body = isUrl
      ? { imageUrl: imageUrlOrId, filename, quality }
      : { imageId: imageUrlOrId, filename, quality };

    if (slug) {
      body.slug = slug;
    }

    const response = await post(
      `/download/single`,
      body,
      { responseType: 'blob' }
    );

    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(response);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Error downloading single image:", error);
    throw new Error(error.message || "Failed to download image");
  }
};

/**
 * Download multiple images as ZIP
 * @param {string} projectId - Project ID
 * @param {Array} imageIds - Array of image IDs
 * @param {Array} allImages - All images array to map IDs to URLs
 * @param {string} quality - 'high' or 'web'
 */
export const downloadImagesAsZip = async (imageIds, allImages, quality = 'high', slug = null) => {
  try {
    // Ensure imageIds is an array
    if (!Array.isArray(imageIds)) {
      throw new Error("imageIds must be an array");
    }

    if (!Array.isArray(allImages)) {
      throw new Error("allImages must be an array");
    }

    // Map imageIds to download items.
    // - If we have a URL, use it (existing behavior for logged-in CRM flows).
    // - Otherwise fall back to `imageId` so the server can resolve the original URL securely.
    const images = imageIds
      .map((id) => {
        const image = allImages.find(
          (img) =>
            img._id === id ||
            img._id?.toString() === id?.toString() ||
            img.id === id ||
            img.id?.toString() === id?.toString()
        );

        const url = image?.image_url || image?.url || image?.src;
        const filename =
          image?.filename || image?.alt || image?.title || `image-${id}.jpg`;

        return url ? { url, filename } : { imageId: id, filename };
      })
      .filter((item) => item && (item.url || item.imageId));

    if (images.length === 0) throw new Error("No valid images found to download");


    const payload = { images, quality };
    if (slug) {
      payload.slug = slug;
    }

    const response = await post(
      `/download/batch`,
      payload,
      { responseType: 'blob' }
    );

    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(response);
    const link = document.createElement("a");
    link.href = url;
    link.download = `images-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, count: images.length };
  } catch (error) {
    console.error('Error downloading images:', error);
    throw new Error(error.message || "Failed to download images");
  }
};



export const getRandomPlaceholder = () => {
  const placeholders = [
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400",
    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400",
    "https://images.unsplash.com/photo-1452457807411-4979b707c5be?w=400",
  ];
  return placeholders[Math.floor(Math.random() * placeholders.length)];
};



// ADD THESE TO YOUR galleryService.js FILE

/**
 * Copy image to additional folder (keeps original location)
 */
export const copyImageToFolder = async (eventId, imageId, targetFolder) => {
  try {
    const response = await post(
      `/gallery/${eventId}/images/${imageId}/copy`,
      { targetFolder }
    );
    return response;
  } catch (error) {
    console.error("Error copying image:", error);
    throw new Error(error.message || "Failed to copy image");
  }
};

/**
 * Rename image filename
 */
export const renameImage = async (eventId, imageId, newFilename) => {
  try {
    const response = await put(
      `/gallery/${eventId}/images/${imageId}/rename`,
      { newFilename }
    );
    return response;
  } catch (error) {
    console.error("Error renaming image:", error);
    throw new Error(error.message || "Failed to rename image");
  }
};

/**
 * Update folder cover image
 */
export const updateFolderCoverImage = async (projectId, folderId, coverImage) => {
  try {
    const response = await post(
      `/gallery/${projectId}/folders/${folderId}/cover`,
      { coverImage }
    );
    return response;
  } catch (error) {
    console.error("Error updating cover image:", error);
    throw new Error(error.message || "Failed to update cover image");
  }
};

/**
 * Update project cover image (Hero Image)
 * @param {string} projectId - The project ID
 * @param {string} coverImage - The cover image URL
 * @param {string} deviceType - Optional device type ('mobile' or 'desktop'). If not provided, updates both.
 */
export const updateProjectCoverImage = async (projectId, coverImage, deviceType) => {
  try {
    const payload = { coverImage };
    if (deviceType) {
      payload.deviceType = deviceType;
    }
    const response = await put(
      `/gallery/${projectId}/cover-image`,
      payload
    );
    return response;
  } catch (error) {
    console.error("Error updating project cover image:", error);
    throw new Error(error.message || "Failed to update project cover image");
  }
};

/**
 * Toggle favorite for folder or image
 * @param {string} projectId - Project ID
 * @param {string} itemId - Folder ID or Image ID
 * @param {string} type - "folder" or "image"
 */
export const toggleFavoriteItem = async (projectId, itemId, type) => {
  try {
    const response = await post(`/gallery/${projectId}/favorites/toggle`, {
      itemId,
      type, // "folder" or "image"
    });
    return response;
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw new Error(error.message || "Failed to toggle favorite");
  }
};

/**
 * Move folder images to AllPhotos (called before deleting folder)
 */
export const moveFolderImages = async (projectId, folderId) => {
  try {
    const response = await post(
      `/gallery/${projectId}/folders/${folderId}/move-images`
    );
    return response;
  } catch (error) {
    console.error("Error moving folder images:", error);
    throw new Error(error.message || "Failed to move folder images");
  }
};

/**
 * Get folders with sorting and filtering options
 * @param {string} projectId - Project ID
 * @param {Object} options - { sortBy, sortOrder, favoritesOnly }
 */
export const getFoldersWithOptions = async (projectId, options = {}) => {
  try {
    const {
      sortBy = "createdAt",
      sortOrder = "desc",
      favoritesOnly = false
    } = options;

    let url = `/gallery/${projectId}/folders?sortBy=${sortBy}&sortOrder=${sortOrder}`;

    if (favoritesOnly) {
      url += "&favoritesOnly=true";
    }

    const response = await get(url);
    return response.folders || response.data || [];
  } catch (error) {
    console.error("Error fetching folders with options:", error);
    throw new Error(error.message || "Failed to fetch folders");
  }
};

/**
 * Get images with sorting and filtering options
 * @param {string} eventId - Event/Project ID
 * @param {Object} options - { folder, sortBy, sortOrder, favoritesOnly }
 */
export const getImagesWithOptions = async (eventId, options = {}) => {
  try {
    const {
      folder = null,
      sortBy = "createdAt",
      sortOrder = "desc",
      favoritesOnly = false
    } = options;

    let url = `/gallery/${eventId}`;
    const params = new URLSearchParams();

    if (folder && folder !== "AllPhotos") {
      params.append("folder", folder);
    }

    if (sortBy) params.append("sortBy", sortBy);
    if (sortOrder) params.append("sortOrder", sortOrder);
    if (favoritesOnly) params.append("favoritesOnly", "true");

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await get(url);
    return response.data || response.images || [];
  } catch (error) {
    console.error("Error fetching images with options:", error);
    throw new Error(error.message || "Failed to fetch images");
  }
};

/**
 * Verify gallery access with PIN (for shared galleries)
 */
export const verifyGalleryAccessWithPin = async (projectId, pin) => {
  try {
    const response = await post(`/gallery/${projectId}/verify-access`, { pin });
    return response;
  } catch (error) {
    console.error("Error verifying gallery access:", error);
    throw new Error(error.message || "Failed to verify access");
  }
};


/**
 * Batch download images as ZIP via backend
 */
export const batchDownloadImages = async (images) => {
  try {
    const response = await fetch('/gallery/download/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images }),
    });

    if (!response.ok) {
      throw new Error('Batch download failed');
    }

    // Create blob from response
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `images-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, count: images.length };
  } catch (error) {
    console.error('Error batch downloading images:', error);
    throw new Error('Failed to download images');
  }
};
/**
 * Get folder details by ID
 */
export const getFolderById = async (projectId, folderId) => {
  try {
    const folders = await getFolders(projectId);
    const folder = folders.find(f => f._id === folderId || f.id === folderId);

    if (!folder) {
      throw new Error("Folder not found");
    }

    return folder;
  } catch (error) {
    console.error("Error getting folder by ID:", error);
    throw new Error(error.message || "Failed to get folder");
  }
};

/**
 * Check if folder is empty
 */
export const checkFolderEmpty = async (projectId, folderPath) => {
  try {
    const images = await getEventImages(projectId, folderPath);
    return images.length === 0;
  } catch (error) {
    console.error("Error checking folder:", error);
    return false;
  }
};

/**
 * Trigger storage recalculation on backend
 */
export const recalculateStorage = async (projectId) => {
  try {
    const response = await post(`/gallery/${projectId}/storage/recalculate`);
    return response;
  } catch (error) {
    console.error("Error recalculating storage:", error);
    throw new Error(error.message || "Failed to recalculate storage");
  }
};

/**
 * Increment storage usage for project
 */
export const incrementStorage = async (projectId, bytes) => {
  try {
    const response = await post(`/gallery/${projectId}/storage/increment`, { bytes });
    return response;
  } catch (error) {
    console.error("Error incrementing storage:", error);
    // Don't throw, just log
    return null;
  }
};


/**
 * Update tags associated with a single image
 * @param {string} projectId
 * @param {string} imageId
 * @param {string[]} tags
 */
export const updateImageTags = async (projectId, imageId, tags) => {
  try {
    const response = await put(`/gallery/${projectId}/images/${imageId}/tags`, {
      tags,
    });
    return response;
  } catch (error) {
    console.error("Error updating image tags:", error);
    throw new Error(error.message || "Failed to update image tags");
  }
};

/**
 * Get image count for folder
 */
export const getFolderImageCount = async (projectId, folderPath) => {
  try {
    const images = await getEventImages(projectId, folderPath);
    return images.length;
  } catch (error) {
    console.error("Error getting image count:", error);
    return 0;
  }
};


/**
 * Get or create the permanent share link for a project
 */
export const getShareLink = async (projectId) => {
  try {
    const response = await get(`/gallery/${projectId}/share-link`);
    return response;
  } catch (error) {
    console.error("Error getting share link:", error);
    throw new Error(error.message || "Failed to get share link");
  }
};

/**
 * Update share link settings (expiry, folders, active status)
 */
export const updateShareLink = async (projectId, settings) => {
  try {
    const response = await put(`/gallery/${projectId}/share-link`, settings);
    return response;
  } catch (error) {
    console.error("Error updating share link:", error);
    throw new Error(error.message || "Failed to update share link");
  }
};

/**
 * Toggle folder visibility (public/hidden)
 */
export const updateFolderVisibility = async (projectId, folderId, visibility) => {
  try {
    const response = await put(`/gallery/${projectId}/folders/${folderId}/visibility`, { visibility });
    return response;
  } catch (error) {
    console.error("Error updating folder visibility:", error);
    throw new Error(error.message || "Failed to update folder visibility");
  }
};

/**
 * Send share email (simplified - no longer generates new links)
 */
export const sendShareEmail = async (projectId, emailData) => {
  try {
    const response = await post(`/gallery/${projectId}/share-email`, emailData);
    return response;
  } catch (error) {
    console.error("Error sending share email:", error);
    throw new Error(error.message || "Failed to send share email");
  }
};

/**
 * Access shared gallery via public slug (no auth).
 * Page 1 returns full metadata + first batch of images.
 */
export const accessSharedGallery = async (slug, page = 1, limit = 50, fetchAll = false) => {
  try {
    // Backward-compatible params, but public gallery backend is folder-aware (limit defaults to 15).
    const effectivePage = typeof page === 'number' ? page : 1;
    const effectiveLimit = typeof limit === 'number' ? limit : 15;
    const response = await get(
      `/gallery/public/${slug}?page=${effectivePage}&limit=${effectiveLimit}&fetchAll=${fetchAll ? "true" : "false"}`
    );
    return response;
  } catch (error) {
    console.error("Error accessing shared gallery:", error);
    throw new Error(error.message || "Failed to access gallery");
  }
};

/**
 * Fetch a subsequent page of images for infinite scroll (no metadata).
 * Returns: { success, images, page, total, totalPages, hasMore }
 */
export const fetchGalleryImagePage = async (
  slug,
  folderName,
  folderPage = 1,
  limit = 15,
  fetchAll = false
) => {
  try {
    const response = await get(
      `/gallery/public/${slug}?folderName=${encodeURIComponent(folderName || "")}&page=${folderPage}&limit=${limit}&fetchAll=${fetchAll ? "true" : "false"}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching gallery page:", error);
    throw new Error(error.message || "Failed to fetch images");
  }
};

/**
 * Verify client password for gallery access
 */
export const verifyClientPassword = async (slug, password) => {
  try {
    const response = await post(`/gallery/public/${slug}/verify-password`, { password });
    return response;
  } catch (error) {
    console.error("Error verifying client password:", error);
    throw new Error(error.message || "Failed to verify password");
  }
};

/**
 * Toggle client favorite (requires email)
 */
export const toggleClientFavorite = async (slug, imageId, email) => {
  try {
    const response = await post(`/gallery/public/${slug}/client-favorite`, {
      imageId,
      email,
    });
    return response;
  } catch (error) {
    console.error("Error toggling client favorite:", error);
    throw new Error(error.message || "Failed to toggle favorite");
  }
};

/**
 * Get client favorites
 */
export const getClientFavorites = async (slug, email = null) => {
  try {
    const url = email
      ? `/gallery/public/${slug}/client-favorites?email=${encodeURIComponent(email)}`
      : `/gallery/public/${slug}/client-favorites`;
    const response = await get(url);
    return response;
  } catch (error) {
    console.error("Error getting client favorites:", error);
    throw new Error(error.message || "Failed to get client favorites");
  }
};

// REMOVE these old functions:
// generateShareableLink
// verifyGalleryAccess

/**
 * Add a new media link (Film or Reels) to project
 */
export const addMediaLink = async (projectId, linkData) => {
  try {
    const response = await post(`/gallery/${projectId}/links`, linkData);
    return response;
  } catch (error) {
    console.error("Error adding media link:", error);
    throw new Error(error.message || "Failed to add media link");
  }
};

/**
 * Update an existing media link
 */
export const updateMediaLink = async (projectId, linkId, updates) => {
  try {
    const response = await put(`/gallery/${projectId}/links/${linkId}`, updates);
    return response;
  } catch (error) {
    console.error("Error updating media link:", error);
    throw new Error(error.message || "Failed to update media link");
  }
};

/**
 * Delete a media link
 */
export const deleteMediaLink = async (projectId, linkId) => {
  try {
    const response = await del(`/gallery/${projectId}/links/${linkId}`);
    return response;
  } catch (error) {
    console.error("Error deleting media link:", error);
    throw new Error(error.message || "Failed to delete media link");
  }
};

/**
 * Get all media links for a project
 */
export const getMediaLinks = async (projectId) => {
  try {
    const response = await get(`/gallery/${projectId}/links`);
    return response.mediaLinks || [];
  } catch (error) {
    console.error("Error fetching media links:", error);
    throw new Error(error.message || "Failed to fetch media links");
  }
};

/**
 * Export filenames to Lightroom format
 */
export const exportFilenamesToLightroom = async (projectId, imageIds) => {
  try {
    const response = await post(`/gallery/${projectId}/export-filenames`, { imageIds });
    return response;
  } catch (error) {
    console.error("Error exporting filenames:", error);
    throw new Error(error.message || "Failed to export filenames to Lightroom");
  }
};