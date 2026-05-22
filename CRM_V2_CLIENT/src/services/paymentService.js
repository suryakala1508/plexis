
import axios from 'axios';
import { getErrorMessage } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const paymentAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getPaymentDues = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.crossedDue) params.append('crossedDue', filters.crossedDue);

    const response = await paymentAxios.get(`/payment/dues?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching payment dues:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch payment dues'));
  }
};


export const getProjectNames = async () => {
  try {
    const response = await paymentAxios.get('/payment/projectNames');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching project names:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch project names'));
  }
};