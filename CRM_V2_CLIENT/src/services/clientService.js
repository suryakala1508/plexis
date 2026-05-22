import { get, post, put, del } from './api';
import { getErrorMessage } from '../utils/errorHandler'

/**
 * Client Service
 * Handles all client-related API calls
 */

/**
 * Get all clients for the studio
 * @returns {Promise<Array>} Array of clients
 */
export const getAllClients = async () => {
  const response = await get('/api/clients');
  return response.data || [];
};

/**
 * Get a single client by ID
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} Client data
 */
export const getClientById = async (clientId) => {
  const response = await get(`/api/clients/${clientId}`);
  return response.data;
};

/**
 * Create a new client
 * @param {Object} clientData - Client data
 * @param {string} clientData.name - Company name
 * @param {string} clientData.relation - Contact person name
 * @param {string} clientData.email - Email address
 * @param {string} clientData.phone - Phone number
 * @param {string} clientData.status - Status (Ongoing/Completed)
 * @param {string} clientData.notes - Additional notes
 * @returns {Promise<Object>} Created client
 */
export const createClient = async (clientData) => {
  // Map frontend field names to backend field names
  const backendData = {
    clientName: clientData.name,
    relation: clientData.relation,
    email: clientData.email || '',
    phone: clientData.phone || '',
    status: clientData.status,
    notes: clientData.notes,
    projectId: clientData.projectId || undefined,
  };
  const response = await post('/api/clients', backendData);
  return response.data;
};

/**
 * Update an existing client
 * @param {string} clientId - Client ID
 * @param {Object} clientData - Updated client data
 * @returns {Promise<Object>} Updated client
 */
export const updateClient = async (clientId, clientData) => {
  // Map frontend field names to backend field names
  const backendData = {
    clientName: clientData.name,
    relation: clientData.relation,
    email: clientData.email,
    phone: clientData.phone,
    status: clientData.status,
    notes: clientData.notes,
  };
  const response = await put(`/api/clients/${clientId}`, backendData);
  return response.data;
};

/**
 * Delete a client
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} Success response
 */
export const deleteClient = async (clientId) => {
  const response = await del(`/api/clients/${clientId}`);
  return response;
};

/**
 * Get clients by status
 * @param {string} status - Client status (Ongoing/Completed)
 * @returns {Promise<Array>} Array of clients
 */
export const getClientsByStatus = async (status) => {
  const response = await get(`/api/clients?status=${status}`);
  return response.data || [];
};

/**
 * Find client by email
 * @param {string} email - Client email
 * @returns {Promise<Object|null>} Client data or null if not found
 */
export const findClientByEmail = async (email) => {
  if (!email) return null;
  try {
    const clients = await getAllClients();
    return clients.find(client => client.email?.toLowerCase() === email.toLowerCase()) || null;
  } catch (error) {
    console.error('Error finding client by email:', error);
    return null;
  }
};

// TODO: Add when backend is ready
// export const getClientProjects = async (clientId) => {...}
// export const getClientRevenue = async (clientId) => {...}
// export const updateClientStatus = async (clientId, status) => {...}

/**
 * Get client statistics by time range
 * @param {string} range - Time range (week, month, year)
 * @returns {Promise<Array>} Array of client stats
 */
export const getClientStats = async (range) => {
  try {
    const response = await get(`/api/clients/stats?range=${range}`)
    return response.data || []
  } catch (error) {
    console.error('Error fetching client stats:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch client stats'))
  }
}



