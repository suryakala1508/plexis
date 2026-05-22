import React, { useState, useEffect } from 'react'
import { Ticket, Search, Filter, Eye } from 'lucide-react'
import { getAllTickets } from '../../services/superadminService'
import { LoadingSpinner } from '../../Components/Loading/LoadingSpinner'
import { Error } from '../../Components/Error'
import { Card, CardContent, CardHeader, CardTitle } from '../../Components/ui/card'
import { Input } from '../../Components/ui/input'
import { Button } from '../../Components/ui/button'
import { TicketDetailSidebar } from './components/TicketDetailSidebar'
import { SuperAdminSidebar } from './SuperAdminSidebar'

export const TicketsPage = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ticketFilter, setTicketFilter] = useState('all')
  const [ticketSearchTerm, setTicketSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(false)

  useEffect(() => {
    fetchAllTickets()
  }, [])

  const fetchAllTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getAllTickets()
      
      // Handle different response structures
      if (response && response.tickets && Array.isArray(response.tickets)) {
        setTickets(response.tickets)
      } else if (Array.isArray(response)) {
        setTickets(response)
      } else if (response && typeof response === 'object') {
        console.warn('Unexpected response structure:', response)
        setTickets([])
      } else {
        console.warn('Empty or invalid response:', response)
        setTickets([])
      }
    } catch (err) {
      console.error('Error fetching tickets - full error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tickets'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    // Filter by status
    if (ticketFilter !== 'all' && ticket.status !== ticketFilter) {
      return false
    }
    
    // Filter by search term
    const searchLower = ticketSearchTerm.toLowerCase()
    return (
      (ticket.title || '').toLowerCase().includes(searchLower) ||
      (ticket.userName || '').toLowerCase().includes(searchLower) ||
      (ticket.userEmail || '').toLowerCase().includes(searchLower)
    )
  })

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket)
    setDetailSidebarOpen(true)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'resolved':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'closed':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'in_progress':
      case 'in progress':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-dark border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Loading tickets...</p>
            <p className="mt-2 text-gray-400 text-sm">Please wait while we fetch all tickets</p>
          </div>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Error title="Error Loading Tickets" variant="error">
            {error}
          </Error>
          <div className="mt-4">
            <button
              onClick={fetchAllTickets}
              className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Tickets</h1>
            <p className="text-gray-600">View and manage all tickets raised by users</p>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by user name, email, or ticket title..."
                    value={ticketSearchTerm}
                    onChange={(e) => setTicketSearchTerm(e.target.value)}
                    className="pl-10 w-full bg-white border-gray-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={ticketFilter}
                    onChange={(e) => setTicketFilter(e.target.value)}
                    className="px-9 py-2 text-sm border text-center border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <CardContent className="p-0">
              {filteredTickets.length === 0 && !loading ? (
                <div className="text-center">
                  <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No tickets found</p>
                  {ticketSearchTerm || ticketFilter !== 'all' ? (
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter</p>
                  ) : (
                    <p className="text-gray-400 text-sm mt-2">No tickets have been raised yet</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">User</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Issue Title</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Priority</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Status</th>
                        <th className="text-right py-4 px-6 font-semibold text-gray-700 text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTickets.map((ticket) => (
                        <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium text-gray-900">{ticket.userName || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{ticket.userEmail || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{ticket.title}</div>
                            {ticket.issueType && (
                              <div className="text-xs text-gray-500 mt-1">{ticket.issueType}</div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority || 'medium')}`}>
                              {ticket.priority || 'medium'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                              {ticket.status || 'open'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button
                              onClick={() => handleViewTicket(ticket)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TicketDetailSidebar
        isOpen={detailSidebarOpen}
        onClose={() => {
          setDetailSidebarOpen(false)
          setSelectedTicket(null)
        }}
        ticket={selectedTicket}
      />
    </div>
  )
}
