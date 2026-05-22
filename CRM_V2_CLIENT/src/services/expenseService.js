import axios from 'axios';
import { getErrorMessage } from '../utils/errorHandler'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const expenseAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getExpenses = async () => {
  try {
    const response = await expenseAxios.get('/expenses');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch expenses'));
  }
}

export const getExpenseSummary = async () => {
  try {
    const response = await expenseAxios.get('/expenses/summary');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch expense summary'));
  }
}

export const getExpenseOptions = async () => {
  try {
    const response = await expenseAxios.get('/expenses/options');
    return response.data.data; // { projects: [...], crew: [...] }
  } catch (error) {
    console.error('Error fetching expense options:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch options'));
  }
}

export const addExpense = async (expenseData) => {
  try {
    const response = await expenseAxios.post('/expenses/addExpense', expenseData);
    return response.data.data;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw new Error(getErrorMessage(error, 'Failed to add expense'));
  }
}

export const updateExpense = async (expenseId, expenseData) => {
  try {
    const response = await expenseAxios.post(`/expenses/updateExpense/${expenseId}`, expenseData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw new Error(getErrorMessage(error, 'Failed to update expense'));
  }
}

export const uploadExpenseScreenshots = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('screenshots', file));
  const response = await expenseAxios.post('/expenses/upload-screenshots', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data.urls; // string[]
};

export const uploadPaymentScreenshots = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('screenshots', file));
  const response = await expenseAxios.post('/project/upload-screenshots', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data.urls; // string[]
};

export const deleteExpense = async (expenseId) => {
  try {
    // Backend uses POST for delete endpoint
    const response = await expenseAxios.post(`/expenses/deleteExpense/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw new Error(getErrorMessage(error, 'Failed to delete expense'));
  }
}





