// Inventory Service
import { getErrorMessage } from '../utils/errorHandler'
// Handles all inventory-related API calls

import { get, post, del } from './api';

/**
 * Get all inventory items for the current user
 * @returns {Promise} List of inventory items
 */
export const getInventoryItems = async () => {
  try {
    const response = await get('/inventory');
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    throw error;
  }
};

/**
 * Add a new inventory item
 * @param {Object} itemData - Item data
 * @param {string} itemData.itemName - Item name
 * @param {string} itemData.itemDescription - Item description
 * @param {string} itemData.category - Category
 * @param {number} itemData.quantity - Total quantity
 * @param {string} itemData.notes - Optional notes
 * @returns {Promise} Created item
 */
export const addInventoryItem = async (itemData) => {
  try {
    const response = await post('/inventory/add', itemData);
    return response.data;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
};

/**
 * Update an inventory item
 * @param {string} itemId - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Updated item
 */
export const updateInventoryItem = async (itemId, updates) => {
  try {
    const response = await post('/inventory/update', {
      itemId,
      ...updates
    });
    return response.data;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

/**
 * Assign inventory item to a project
 * @param {Object} assignmentData - Assignment data
 * @param {string} assignmentData.itemId - Item ID
 * @param {string} assignmentData.projectId - Project ID
 * @param {number} assignmentData.quantity - Quantity to assign
 * @param {Date} assignmentData.assignedFrom - Start date
 * @param {Date} assignmentData.assignedTo - End date
 * @returns {Promise} Updated item
 */
export const assignInventoryItem = async (assignmentData) => {
  try {
    const response = await post('/inventory/assign', assignmentData);
    return response.data;
  } catch (error) {
    console.error('Error assigning inventory item:', error);
    throw error;
  }
};

/**
 * Batch assign inventory items to a project
 * @param {Object} batchData - Batch assignment data
 * @param {Array} batchData.assignments - Array of {itemId, quantity}
 * @param {string} batchData.projectId - Project ID
 * @param {Date} batchData.assignedFrom - Start date
 * @param {Date} batchData.assignedTo - End date
 * @returns {Promise} List of results
 */
export const batchAssignInventory = async (batchData) => {
  try {
    const response = await post('/inventory/batch-assign', batchData);
    return response.data;
  } catch (error) {
    console.error('Error batch assigning inventory items:', error);
    throw error;
  }
};

/**
 * Delete an inventory item
 * @param {string} itemId - Item ID
 * @returns {Promise} Success message
 */
export const deleteInventoryItem = async (itemId) => {
  try {
    const response = await del(`/inventory/delete/${itemId}`);

    return response;
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

