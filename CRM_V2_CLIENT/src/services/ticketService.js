import { get, post } from './api'

/**
 * Get all tickets for the current user
 * @returns {Promise<Object>} Tickets response with tickets array
 */
export const getMyTickets = async () => {
  try {
    const response = await get('/tickets/my-tickets')
    return response
  } catch (error) {
    console.error('Error fetching tickets:', error)
    throw new Error(error.message || 'Failed to fetch tickets')
  }
}

/**
 * Create a new support ticket
 * @param {Object} ticketData - Ticket data including title, issueType, description, priority, and attachments
 * @returns {Promise<Object>} Created ticket response
 */
export const createTicket = async (ticketData) => {
  try {
    const response = await post('/tickets', ticketData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response
  } catch (error) {
    console.error('Error creating ticket:', error)
    throw new Error(error.response?.data?.message || error.message || 'Failed to create ticket')
  }
}

