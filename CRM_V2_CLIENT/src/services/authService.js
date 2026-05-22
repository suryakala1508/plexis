// Authentication Service

import { post, get } from './api';
import { getErrorMessage } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @param {boolean} rememberme
 * @returns {Promise} Response with success status
 */
export const login = async (email, password, rememberme = false) => {
  try {
    const response = await post('/auth/login', {
      email,
      password,
      rememberme,
    });
    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Invalid email or password'));
  }
};

// Alias for backward compatibility
export const loginWithEmail = login;

/**
 * Sign up with email and password
 * @param {object} userData - User registration data
 * @returns {Promise} Response with success status
 */
export const signup = async (userData) => {
  try {
    const response = await post('/auth/register', userData);
    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Signup failed. Please try again.'));
  }
};

// Alias for backward compatibility
export const signupWithEmail = signup;

/**
 * Login/Signup with Google
 * @param {string} credential - Google OAuth credential
 * @returns {Promise} Response with user data
 */
export const googleAuth = async (code) => {
  try {
    const response = await post('/auth/google/callback', { code });
    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Google authentication failed'));
  }
};

// Alias for backward compatibility
export const loginWithGoogle = googleAuth;

/**
 * Logout user
 * Calls backend to clear httpOnly cookie
 */
export const logout = async () => {
  try {
    await get('/auth/logout');
    // Clear any local storage data
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
  } catch (error) {
    console.error('Logout error:', error);
    // Clear local data anyway
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
  }
};

/**
 * Fetch user and studio data from backend (uses cookie authentication)
 * @returns {Promise} Object containing { user: {...}, studio: {...} } or null if not authenticated
 */
export const fetchUserData = async () => {
  try {
    const response = await get('/user');

    // Backend returns { success: true, data: { user: {...}, studio: {...} } }
    // Return the entire data object with both user and studio
    return response.data?.data || response.data;
  } catch (error) {
    // If 401 Unauthorized, user is not authenticated - return null instead of throwing
    if (error.message === 'Unauthorized' || error.response?.status === 401) {
      return null;
    }

    throw new Error(getErrorMessage(error, 'Failed to fetch user data'));
  }
};

/**
 * Request password reset link
 * @param {string} email - User email
 * @returns {Promise} Response
 */
export const forgotPassword = async (email) => {
  try {
    const response = await post('/auth/forgot-password', {
      email,
    });

    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to send reset link'));
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password
 * @returns {Promise} Response
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await post('/auth/reset-password', {
      token,
      newPassword,
    });

    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Password reset failed'));
  }
};

/**
 * Switch account helper
 * Logs out current session then logs in using either Google code or email/password.
 * @param {Object} params
 * @param {string} [params.googleCode] - Google OAuth authorization code
 * @param {string} [params.email] - Email for credential login
 * @param {string} [params.password] - Password for credential login
 * @param {boolean} [params.rememberme] - Remember me flag for email login
 * @returns {Promise<Object>} New account data (user, studio)
 */
export const switchAccount = async ({ googleCode, email, password, rememberme = false } = {}) => {
  // Ensure at least one auth method provided
  if (!googleCode && !(email && password)) {
    throw new Error('Provide googleCode or email & password to switch account');
  }

  // Logout current session (ignore errors)
  try { await logout(); } catch (_) { /* noop */ }

  // Perform new login
  let authResponse;
  if (googleCode) {
    authResponse = await googleAuth(googleCode);
  } else {
    authResponse = await login(email, password, rememberme);
  }

  // After login, fetch consolidated user data
  try {
    const data = await fetchUserData();
    return { auth: authResponse, ...data };
  } catch (e) {
    // If user data fetch fails, still return auth response
    return { auth: authResponse, error: e.message };
  }
};

/**
 * Fetch user from JWT token stored in httpOnly cookie
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
export const fetchUserFromJWT = async () => {
  try {
    const response = await get("/auth/verify"); // cookie auto sent

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return null;
    }

    console.error("❌ JWT fetch error:", error);
    throw new Error("Failed to verify session");
  }
};
