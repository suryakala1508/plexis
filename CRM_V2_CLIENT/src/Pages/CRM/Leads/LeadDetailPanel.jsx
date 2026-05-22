import React, { useState, useEffect } from 'react'
import { X, Mail, Phone, Tag, Building2, Calendar, FileText, Edit2, Save } from 'lucide-react'
import { formatIndianCurrency } from '../../../utils/formatUtils'

export const LeadDetailPanel = ({ lead, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState(null)

  useEffect(() => {
    if (lead) {
      setEditedLead({ ...lead })
    }
  }, [lead])

  if (!lead) return null

  const statusOptions = [
    'New',
    'Open',
    'In Progress',
    'Open Deal',
    'Attempt to Contact',
    'Deal Unqualified',
    'Bad Timing',
    'Inquiry',
    'Proposal',
    'Negotiation',
    'Confirmed',
    'Rejected'
  ]

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-700 border-blue-200',
      'Open': 'bg-purple-100 text-purple-700 border-purple-200',
      'In Progress': 'bg-green-100 text-green-700 border-green-200',
      'Open Deal': 'bg-orange-100 text-orange-700 border-orange-200',
      'Attempt to Contact': 'bg-green-100 text-green-700 border-green-200',
      'Deal Unqualified': 'bg-red-100 text-red-700 border-red-200',
      'Bad Timing': 'bg-orange-100 text-orange-700 border-orange-200',
      'Inquiry': 'bg-blue-100 text-blue-700 border-blue-200',
      'Proposal': 'bg-purple-100 text-purple-700 border-purple-200',
      'Negotiation': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Confirmed': 'bg-green-100 text-green-700 border-green-200',
      'Rejected': 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const handleSave = () => {
    onUpdate(editedLead)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedLead({ ...lead })
    setIsEditing(false)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`
          fixed inset-0 bg-black transition-opacity duration-300 z-40
          ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          overflow-y-auto
        `}
      >
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10'>
          <h2 className='text-xl font-bold text-primary-dark'>Lead Details</h2>
          <div className='flex items-center gap-2'>
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className='px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium'
                >
                  <Save size={16} />
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium'
              >
                <Edit2 size={16} />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <X size={20} className='text-gray-600' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Name & Company */}
          <div>
            {isEditing ? (
              <div className='space-y-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Name
                  </label>
                  <input
                    type='text'
                    value={editedLead.name}
                    onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Company
                  </label>
                  <input
                    type='text'
                    value={editedLead.company}
                    onChange={(e) => setEditedLead({ ...editedLead, company: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                  />
                </div>
              </div>
            ) : (
              <>
                <h3 className='text-2xl font-bold text-gray-900 mb-1'>
                  {lead.name}
                </h3>
                {lead.company && (
                  <div className='flex items-center gap-2 text-gray-600'>
                    <Building2 size={18} />
                    <span className='text-lg'>{lead.company}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Status
            </label>
            {isEditing ? (
              <select
                value={editedLead.status}
                onChange={(e) => setEditedLead({ ...editedLead, status: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            ) : (
              <span className={`
                inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border
                ${getStatusColor(lead.status)}
              `}>
                {lead.status}
              </span>
            )}
          </div>

          {/* Contact Information */}
          <div className='space-y-4 pt-4 border-t border-gray-200'>
            <h4 className='font-semibold text-gray-900'>Contact Information</h4>

            {/* Email */}
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1.5'>
                Email
              </label>
              {isEditing ? (
                <input
                  type='email'
                  value={editedLead.email}
                  onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                />
              ) : (
                <div className='flex items-center gap-2 text-gray-700'>
                  <Mail size={18} className='text-gray-400' />
                  <a href={`mailto:${lead.email}`} className='hover:text-gray-900 hover:underline'>
                    {lead.email}
                  </a>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1.5'>
                Phone
              </label>
              {isEditing ? (
                <input
                  type='tel'
                  value={editedLead.phone}
                  onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                />
              ) : (
                <div className='flex items-center gap-2 text-gray-700'>
                  <Phone size={18} className='text-gray-400' />
                  <a href={`tel:${lead.phone}`} className='hover:text-gray-900 hover:underline'>
                    {lead.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className='space-y-4 pt-4 border-t border-gray-200'>
            <h4 className='font-semibold text-gray-900'>Additional Details</h4>

            {/* Source */}
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1.5'>
                Source
              </label>
              {isEditing ? (
                <input
                  type='text'
                  value={editedLead.source}
                  onChange={(e) => setEditedLead({ ...editedLead, source: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                />
              ) : (
                <div className='flex items-center gap-2 text-gray-700'>
                  <Tag size={18} className='text-gray-400' />
                  <span>{lead.source}</span>
                </div>
              )}
            </div>

            {/* Budget */}
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1.5'>
                Budget
              </label>
              {isEditing ? (
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>₹</span>
                  <input
                    type='text'
                    value={editedLead.budget}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '')
                      setEditedLead({ ...editedLead, budget: value })
                    }}
                    placeholder='0'
                    className='w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                  />
                </div>
              ) : (
                <div className='flex items-center gap-2 text-gray-700 font-semibold'>
                  <span>{lead.budget ? formatIndianCurrency(lead.budget.toString().replace(/[^\d.]/g, ''), true, 0) : "Not set"}</span>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-medium text-gray-500 mb-1.5'>
                  Created
                </label>
                <div className='flex items-center gap-2 text-gray-700 text-sm'>
                  <Calendar size={16} className='text-gray-400' />
                  <span>{lead.createdDate}</span>
                </div>
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-500 mb-1.5'>
                  Last Contact
                </label>
                <div className='flex items-center gap-2 text-gray-700 text-sm'>
                  <Calendar size={16} className='text-gray-400' />
                  <span>{lead.lastContact}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className='pt-4 border-t border-gray-200'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Notes
            </label>
            {isEditing ? (
              <textarea
                value={editedLead.notes}
                onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                rows={4}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none'
              />
            ) : (
              <div className='bg-gray-50 rounded-lg p-4 text-gray-700'>
                <div className='flex items-start gap-2'>
                  <FileText size={18} className='text-gray-400 flex-shrink-0 mt-0.5' />
                  <p className='text-sm'>{lead.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='pt-6 border-t border-gray-200 flex gap-3'>
            <button className='flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors'>
              Send Email
            </button>
            <button className='flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors'>
              Schedule Call
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

