import React, { useState, useEffect } from 'react'
import { X, Ticket, User, Building2, Calendar, Tag, Mail, Phone, Image as ImageIcon, Send, Save, MessageSquare, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../Components/ui/card'
import { Badge } from '../../../Components/ui/badge'
import { Button } from '../../../Components/ui/button'
import { Input } from '../../../Components/ui/input'
import { Textarea } from '../../../Components/ui/textarea'
import { getTicketById, updateTicket, sendTicketEmail } from '../../../services/superadminService'
import { LoadingSpinner } from '../../../Components/Loading/LoadingSpinner'
import { Success } from '../../../Components/Success'
import { Error } from '../../../Components/Error'

export const TicketDetailSidebar = ({ isOpen, onClose, ticket: initialTicket }) => {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  
  // Form states
  const [status, setStatus] = useState('open')
  const [priority, setPriority] = useState('medium')
  const [adminNotes, setAdminNotes] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)

  useEffect(() => {
    if (isOpen && initialTicket?._id) {
      fetchTicketDetails()
    }
  }, [isOpen, initialTicket?._id])

  const fetchTicketDetails = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const response = await getTicketById(initialTicket._id)
      const fullTicket = response.ticket || response
      setTicket(fullTicket)
      setStatus(fullTicket.status || 'open')
      setPriority(fullTicket.priority || 'medium')
      setAdminNotes(fullTicket.adminNotes || '')
      setEmailSubject(`Update on your ticket: ${fullTicket.title}`)
      setEmailMessage(`Hello ${fullTicket.userName || 'User'},\n\nWe have an update regarding your ticket "${fullTicket.title}".\n\n${fullTicket.adminNotes ? `Note: ${fullTicket.adminNotes}\n\n` : ''}Thank you for your patience.\n\nBest regards,\nPLEXIS Support Team`)
    } catch (err) {
      console.error('Error fetching ticket details:', err)
      setErrorMessage(err.message || 'Failed to load ticket details')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      setErrorMessage(null)
      await updateTicket({
        ticketId: ticket._id,
        status,
        priority,
        adminNotes
      })
      setSuccessMessage('Ticket updated successfully!')
      // Refresh ticket data
      await fetchTicketDetails()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update ticket')
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true)
      setErrorMessage(null)
      await sendTicketEmail(ticket._id, {
        subject: emailSubject,
        message: emailMessage
      })
      setSuccessMessage('Email sent successfully!')
      setShowEmailForm(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send email')
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setSendingEmail(false)
    }
  }

  if (!isOpen || !initialTicket) return null

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700'
      case 'resolved':
        return 'bg-green-100 text-green-700'
      case 'closed':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[700px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold text-gray-900">Ticket Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {successMessage && (
            <Success onClose={() => setSuccessMessage(null)} autoClose={true}>
              {successMessage}
            </Success>
          )}
          {errorMessage && (
            <Error onClose={() => setErrorMessage(null)} autoClose={true}>
              {errorMessage}
            </Error>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" color="primary" />
            </div>
          ) : ticket ? (
            <>
              {/* Ticket Title and Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{ticket.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      {ticket.priority && (
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ticket.issueType && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Issue Type:</span>
                        <span className="text-sm font-medium text-gray-900">{ticket.issueType}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(ticket.createdAt)}</span>
                    </div>
                    {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Updated:</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(ticket.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{ticket.description || 'No description provided'}</p>
                </CardContent>
              </Card>

              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      Attachments ({ticket.attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {ticket.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-all cursor-pointer"
                        >
                          <img
                            src={`data:${attachment.contentType};base64,${attachment.data}`}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900 mt-1">{ticket.userName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="text-gray-900 mt-1">{ticket.userEmail || 'N/A'}</p>
                    </div>
                    {ticket.userPhone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone
                        </label>
                        <p className="text-gray-900 mt-1">{ticket.userPhone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Studio Information */}
              {ticket.studioName && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Studio Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Studio Name</label>
                      <p className="text-gray-900 mt-1">{ticket.studioName}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Manage Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Update */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="open">Open</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {/* Priority Update */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Admin Notes (Visible to User)
                    </label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes that the user can see..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">These notes will be visible to the user</p>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-primary-dark text-white hover:bg-primary flex items-center justify-center"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" color="white" />
                        <span className="ml-2">Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </div>
                    )}
                  </Button>

                  {/* Send Email Button */}
                  <Button
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    variant="outline"
                    className="w-full flex items-center justify-center"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {showEmailForm ? 'Hide Email Form' : 'Send Email to Client'}
                  </Button>

                  {/* Email Form */}
                  {showEmailForm && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                          <Input
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Email subject"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                          <Textarea
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            placeholder="Email message"
                            rows={6}
                            className="w-full"
                          />
                        </div>
                        <Button
                          onClick={handleSendEmail}
                          disabled={sendingEmail || !emailSubject || !emailMessage}
                          className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                        >
                          {sendingEmail ? (
                            <div className="flex items-center justify-center">
                              <LoadingSpinner size="sm" color="white" />
                              <span className="ml-2">Sending...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <Send className="w-4 h-4 mr-2" />
                              Send Email
                            </div>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load ticket details</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
