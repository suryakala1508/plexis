import { get, post, put, del } from './api'
import { getErrorMessage } from '../utils/errorHandler'

/**
 * Get all projects for the current user
 * @returns {Promise<Array>} Array of projects
 */
export const getProjects = async () => {
  try {
    const response = await get('/project')
    // Backend returns { success: true, data: [...] }
    // API interceptor already extracts response.data, so we get { success: true, data: [...] }
    return response.data || response || []
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch projects'))
  }
}

/**
 * Get a single project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project data
 */
export const getProjectById = async (projectId) => {
  try {
    const response = await get(`/project/${projectId}`)
    // Backend returns { success: true, data: {...} }
    // API interceptor already extracts response.data, so we get { success: true, data: {...} }
    return response.data || response
  } catch (error) {
    console.error('Error fetching project:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch project'))
  }
}

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Created project
 */
export const createProject = async (projectData) => {
  try {
    const response = await post('/project/add', projectData)
    // Backend returns { success: true, data: {...} }
    // API interceptor already extracts response.data, so we get { success: true, data: {...} }
    return response.data || response
  } catch (error) {
    console.error('Error creating project:', error)
    throw new Error(getErrorMessage(error, 'Failed to create project'))
  }
}

/**
 * Update a project
 * @param {string} projectId - Project ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated project
 */
export const updateProject = async (projectId, updateData) => {
  try {
    const response = await post(`/project/update/${projectId}`, updateData)
    // Backend returns { success: true, data: {...} }
    // API interceptor already extracts response.data, so we get { success: true, data: {...} }
    return response.data || response
  } catch (error) {
    console.error('Error updating project:', error)
    throw new Error(getErrorMessage(error, 'Failed to update project'))
  }
}

/**
 * Delete a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Deletion response
 */
export const deleteProject = async (projectId) => {
  try {
    const response = await post(`/project/delete/${projectId}`)
    return response
  } catch (error) {
    console.error('Error deleting project:', error)
    throw new Error(getErrorMessage(error, 'Failed to delete project'))
  }
}

/**
 * Add timeline entry to a project
 * @param {string} projectId - Project ID
 * @param {Object} timelineData - Timeline entry data
 * @returns {Promise<Object>} Updated project
 */
export const addTimelineEntry = async (projectId, timelineData) => {
  try {
    const response = await post(`/project/addTimeline/${projectId}`, timelineData)
    // Backend returns { success: true, data: {...} }
    // API interceptor already extracts response.data, so we get { success: true, data: {...} }
    return response.data || response
  } catch (error) {
    console.error('Error adding timeline entry:', error)
    throw new Error(getErrorMessage(error, 'Failed to add timeline entry'))
  }
}

/**
 * Update timeline entry in a project
 * @param {string} projectId - Project ID
 * @param {number} entryIndex - Index of the timeline entry to update
 * @param {Object} timelineData - Updated timeline entry data
 * @returns {Promise<Object>} Updated project
 */
export const updateTimelineEntry = async (projectId, entryIndex, timelineData) => {
  try {
    const response = await put(`/project/${projectId}/timeline/${entryIndex}`, timelineData)
    return response.data || response
  } catch (error) {
    console.error('Error updating timeline entry:', error)
    throw new Error(getErrorMessage(error, 'Failed to update timeline entry'))
  }
}

/**
 * Get project stats for dashboard
 * @param {string} range - Time range (week, month, year)
 * @returns {Promise<Array>} Array of stats { name: string, value: number }
 */
export const getProjectStats = async (range) => {
  try {
    const response = await get(`/project/stats?range=${range}`)
    return response.data || response || []
  } catch (error) {
    console.error('Error fetching project stats:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch project stats'))
  }
}

/**
 * Get dashboard summary metrics
 * @returns {Promise<Object>} Summary data
 */
export const getDashboardSummary = async () => {
  try {
    const response = await get('/project/summary')
    return response.data || response
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch dashboard summary'))
  }
}

/**
 * Get today's tasks (followups, events, payments)
 * @returns {Promise<Object>} Object with followups, events, payments arrays
 */
export const getTodaysTasks = async () => {
  try {
    const response = await get('/project/todays-tasks')
    return response.data || response // Return the inner data object containing the arrays
  } catch (error) {
    console.error('Error fetching today\'s tasks:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch today\'s tasks'))
  }
}

/**
 * Get turnover stats for line chart
 * @param {string} range - Time range
 * @returns {Promise<Array>} Array of turnover data
 */
export const getTurnoverStats = async (range) => {
  try {
    const response = await get(`/project/turnover?range=${range}`)
    return response.data || response || []
  } catch (error) {
    console.error('Error fetching turnover stats:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch turnover stats'))
  }
}

/**
 * Get recent activity feed
 * @returns {Promise<Array>} Array of activities
 */
export const getRecentActivity = async () => {
  try {
    const response = await get('/project/recent-activity')
    return response.data || response || []
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch recent activity'))
  }
}

/**
 * Delete timeline entry from a project
 * @param {string} projectId - Project ID
 * @param {number} entryIndex - Index of the timeline entry to delete
 * @returns {Promise<Object>} Updated project
 */
export const deleteTimelineEntry = async (projectId, entryIndex) => {
  try {
    const response = await post(`/project/deleteTimeline/${projectId}`, { entryIndex })
    return response.data || response
  } catch (error) {
    console.error('Error deleting timeline entry:', error)
    throw new Error(getErrorMessage(error, 'Failed to delete timeline entry'))
  }
}

/**
 * Get project count stats for dashboard
 * @param {string} range - Time range (week, month, year)
 * @returns {Promise<Array>} Array of count stats { label: string, count: number }
 */
export const getProjectCountStats = async (range) => {
  try {
    const response = await get(`/project/count-stats?range=${range}`)
    return response.data || response || []
  } catch (error) {
    console.error('Error fetching project count stats:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch project count stats'))
  }
}

/**
 * Get Profit & Loss stats
 * @param {string} view - 'monthly', 'weekly', 'project', or 'custom'
 * @param {number} year - Year to filter by (optional)
 * @param {string} startDate - Start date for custom range (optional, ISO string)
 * @param {string} endDate - End date for custom range (optional, ISO string)
 * @returns {Promise<Array>} Array of P&L data
 */
export const getProfitLossStats = async (view = 'monthly', year = null, startDate = null, endDate = null) => {
  try {
    let url = `/project/profit-loss-stats?view=${view}`
    if (year) {
      url += `&year=${year}`
    }
    if (startDate) {
      url += `&startDate=${startDate}`
    }
    if (endDate) {
      url += `&endDate=${endDate}`
    }
    const response = await get(url)
    return response.data || response || []
  } catch (error) {
    console.error('Error fetching P&L stats:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch P&L stats'))
  }
}

/**
 * Get AI Financial Insights based on 6-month trend analysis
 * @returns {Promise<Object>} Insight and trend data
 */
export const getFinancialInsights = async () => {
  try {
    const response = await get('/project/financial-insights')
    return response.data || response || {}
  } catch (error) {
    console.error('Error fetching financial insights:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch financial insights'))
  }
}

// ============ PAYMENT SCHEDULE (Milestones) FUNCTIONS ============

/**
 * Get payment schedules for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of payment schedules
 */
export const getPaymentSchedules = async (projectId) => {
  try {
    const response = await get(`/project/${projectId}/payment-schedule`)
    return response.data || response || []
  } catch (error) {
    console.error('Error fetching payment schedules:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch payment schedules'))
  }
}

/**
 * Add a payment schedule/milestone
 * @param {string} projectId - Project ID
 * @param {Object} scheduleData - { description, amount, dueDate, notes }
 * @returns {Promise<Object>} Created schedule
 */
export const addPaymentSchedule = async (projectId, scheduleData) => {
  try {
    const response = await post(`/project/${projectId}/payment-schedule`, scheduleData)
    return response.data || response
  } catch (error) {
    console.error('Error adding payment schedule:', error)
    throw new Error(getErrorMessage(error, 'Failed to add payment schedule'))
  }
}

/**
 * Update a payment schedule (e.g., mark as paid)
 * @param {string} projectId - Project ID
 * @param {string} scheduleId - Schedule ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated schedule
 */
export const updatePaymentSchedule = async (projectId, scheduleId, updateData) => {
  try {
    const response = await put(`/project/${projectId}/payment-schedule/${scheduleId}`, updateData)
    return response.data || response
  } catch (error) {
    console.error('Error updating payment schedule:', error)
    throw new Error(getErrorMessage(error, 'Failed to update payment schedule'))
  }
}

/**
 * Delete a payment schedule
 * @param {string} projectId - Project ID
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<Object>} Deletion response
 */
export const deletePaymentSchedule = async (projectId, scheduleId) => {
  try {
    const response = await del(`/project/${projectId}/payment-schedule/${scheduleId}`)
    return response
  } catch (error) {
    console.error('Error deleting payment schedule:', error)
    throw new Error(getErrorMessage(error, 'Failed to delete payment schedule'))
  }
}

/**
 * Sync project milestones with an external service
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Sync response
 */
export const syncProjectMilestones = async (projectId) => {
  try {
    const response = await post(`/project/${projectId}/sync-milestones`);
    return response.data || response;
  } catch (error) {
    console.error('Error syncing project milestones:', error);
    throw new Error(getErrorMessage(error, 'Failed to sync project milestones'));
  }
};

/**
 * Get payment schedule summary (overdue/upcoming totals)
 * @returns {Promise<Object>} { overduePayments, upcomingPayments, overdueCount, upcomingCount }
 */
export const getPaymentScheduleSummary = async () => {
  try {
    const response = await get('/project/payment-schedule-summary')
    return response.data || response || {}
  } catch (error) {
    console.error('Error fetching payment schedule summary:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch payment schedule summary'))
  }
}

/**
 * Release equipment back to inventory when project is completed
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Release response with released items and updated project
 */
export const releaseEquipment = async (projectId, itemIds = []) => {
  try {
    const response = await post(`/project/${projectId}/release-equipment`, { itemIds })
    return response.data || response
  } catch (error) {
    console.error('Error releasing equipment:', error)
    throw new Error(getErrorMessage(error, 'Failed to release equipment'))
  }
}

// ============ IN-HOUSE CREW FUNCTIONS ============

/**
 * Get in-house crew tasks for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of in-house crew tasks
 */
export const getInHouseTasks = async (projectId) => {
  try {
    const response = await get(`/project/${projectId}/inhouse/tasks`)
    return response.data || response || []
  } catch (error) {
    console.error('Error fetching in-house tasks:', error)
    throw new Error(getErrorMessage(error, 'Failed to fetch in-house tasks'))
  }
}


/**
 * Add a new in-house task
 * @param {string} projectId - Project ID
 * @param {Object} taskData - { crewId, name, dueDate }
 * @returns {Promise<Array>} Updated array of in-house tasks
 */
export const addInHouseTask = async (projectId, taskData) => {
  try {
    const response = await post(`/project/${projectId}/inhouse/tasks`, taskData)
    return response || []
  } catch (error) {
    console.error('Error adding in-house task:', error)
    throw new Error(getErrorMessage(error, 'Failed to add in-house task'))
  }
}

/**
 * Update the status of an in-house crew task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {string} status - New status (Pending, In Progress, Review, Completed)
 * @returns {Promise<Array>} Updated array of in-house tasks
 */
export const updateInHouseTaskStatus = async (projectId, taskId, status) => {
  try {
    const response = await post(`/project/${projectId}/inhouse/tasks/${taskId}/status`, { status })
    return response.data || response || []
  } catch (error) {
    console.error('Error updating in-house task status:', error)
    throw new Error(getErrorMessage(error, 'Failed to update task status'))
  }
}

/**
 * Update an in-house crew task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {Object} taskData - { crewId, name, dueDate }
 * @returns {Promise<Array>} Updated array of in-house tasks
 */
export const updateInHouseTask = async (projectId, taskId, taskData) => {
  try {
    const response = await put(`/project/${projectId}/inhouse/tasks/${taskId}`, taskData)
    return response.data || response || []
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update in-house task'))
  }
}

/**
 * Delete an in-house crew task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Deletion response
 */
export const deleteInHouseTask = async (projectId, taskId) => {
  try {
    const response = await del(`/project/${projectId}/inhouse/tasks/${taskId}`)
    return response.data || response || {}
  } catch (error) {
    console.error('Error deleting in-house task:', error)
    throw new Error(getErrorMessage(error, 'Failed to delete in-house task'))
  }
}
