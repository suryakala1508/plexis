
import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for larger photo uploads/quotation emails
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Only redirect on 401 if we're not on login/signup/public pages and not fetching user data
      if (error.response.status === 401) {
        localStorage.removeItem('user');
        // Only redirect if we're accessing protected routes (not on auth pages)
        const isAuthPage = window.location.pathname.startsWith('/login') ||
          window.location.pathname.startsWith('/signup') ||
          window.location.pathname === '/' ||
          window.location.pathname.startsWith('/superadmin');

        const isSuperAdminPage = window.location.pathname.startsWith('/superadmin');

        if (
          !isAuthPage &&
          !error.config.url.includes("/user") &&
          !error.config.url.includes("/gallery/public/") &&
          !error.config.url.includes("/quotation/public/") &&
          !error.config.url.includes("/lead/") &&
          !window.location.pathname.includes("leadform") &&
          !window.location.pathname.startsWith("/sharedfolder/") &&
          !window.location.pathname.startsWith("/gallery/") &&
          !window.location.pathname.startsWith("/confirm-quotation") &&
          !window.location.pathname.startsWith("/quotation-confirmed") &&
          !window.location.pathname.startsWith("/quotation-rejected") &&
          !window.location.pathname.startsWith("/invite") &&
          !window.location.pathname.startsWith("/reset-password") &&
          !window.location.pathname.startsWith("/foundingStudioOnboard")
        ) {
          // SuperAdmin redirect to login with return URL
          if (isSuperAdminPage) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          } else {
            window.location.href = "/login";
          }
        }
      }

      const errorMessage = error.response.data?.message || `Error: ${error.response.status} `;
      const isUserBootstrapRequest = error.config?.url?.includes('/user');
      const isFeatureLockResponse = error.response.status === 402;
      if (!(error.response.status === 401 && isUserBootstrapRequest) && !isFeatureLockResponse) {
        console.error('API Error Response:', errorMessage);
      }
      // Preserve original error so errorHandler can access response
      error.message = errorMessage;
      throw error;
    } else if (error.request) {
      const requestUrl = `${error.config?.baseURL || API_URL}${error.config?.url || ''}`;
      const timeoutMs = error.config?.timeout;

      if (error.code === 'ECONNABORTED') {
        error.message = `Request timed out after ${Math.round((timeoutMs || 0) / 1000)}s at ${requestUrl}. Backend is reachable but processing took too long.`;
        console.error('API Timeout Error:', {
          url: requestUrl,
          method: error.config?.method?.toUpperCase(),
          timeout: timeoutMs,
          code: error.code
        });
        throw error;
      }

      console.error('API Error: No response received', {
        url: requestUrl,
        method: error.config?.method?.toUpperCase(),
        baseURL: API_URL,
        message: 'Backend server may not be running or is unreachable'
      });
      error.message = `Network error - cannot reach backend at ${requestUrl}. Make sure the server is running on ${API_URL}`;
      throw error;
    } else {
      console.error('API Error:', error.message);
      throw error;
    }
  }
);

/**
 * @param {string} endpoint
 * @param {object} config - Axios request config
 * @returns {Promise}
 */
export const apiRequest = async (endpoint, config = {}) => {
  return axiosInstance.request({
    url: endpoint,
    ...config,
  });
};

export const get = (endpoint, config = {}) => {
  return axiosInstance.get(endpoint, config);
};

export const post = (endpoint, body, config = {}) => {
  return axiosInstance.post(endpoint, body, config);
};

export const put = (endpoint, body, config = {}) => {
  return axiosInstance.put(endpoint, body, config);
};

export const patch = (endpoint, body, config = {}) => {
  return axiosInstance.patch(endpoint, body, config);
};

export const del = (endpoint, config = {}) => {
  return axiosInstance.delete(endpoint, config);
};

export default {
  get,
  post,
  put,
  patch,
  delete: del,
  apiRequest,
  axiosInstance,
};

