import React, { useState } from 'react'
import { Save, X } from 'lucide-react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

export const LeadForm = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    whatsappNumber: '',
    sameAsContact: false,
    EnquiryType: '',
    EventType: '',
    customEventType: '',
    EventDate: '',
    EventEndDate: '',
    Location: '',
    Relation: '',
    source: 'Online Store',
    status: 'Inquiry',
    remarks: '',
    company: '',
    budget: '',
    owner: 'John Doe',
    ownerInitials: 'JD'
  })

  const [errors, setErrors] = useState({})

  const sourceOptions = [
    'Online Store',
    'External Link',
    'Website',
    'Referral',
    'Word of Mouth',
    'Social Media',
    'Email Campaign',
    'Cold Outreach',
    'Event',
    'Other'
  ]

  const eventTypeOptions = [
    'Wedding',
    'Pre-wedding',
    'Portrait',
    'Corporate',
    'Event',
    'Other'
  ]

  const statusOptions = [
    'Inquiry',
    'Proposal',
    'Negotiation',
    'Confirmed',
    'Rejected'
  ]

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target

    // Restrict phone fields to 10 digits
    if (name === 'contactNumber' || name === 'whatsappNumber') {
      value = value.replace(/\D/g, '').slice(0, 10)
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }

      // Sync WhatsApp with contact if checkbox is checked
      if (name === 'contactNumber' && prev.sameAsContact) {
        updated.whatsappNumber = value
      }

      // Clear custom event type if EventType is not "Other"
      if (name === 'EventType' && value !== 'Other') {
        updated.customEventType = ''
      }

      return updated
    })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const formatBudget = (value) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/[^0-9]/g, '')

    if (!numericValue) return ''

    // Add commas for Indian numbering system
    const lastThree = numericValue.slice(-3)
    const otherNumbers = numericValue.slice(0, -3)
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherNumbers ? ',' : '') + lastThree

    return '₹' + formatted
  }

  const handleBudgetChange = (e) => {
    // Only allow digits for raw value
    const rawValue = e.target.value.replace(/[^0-9]/g, '')
    const formatted = formatBudget(rawValue)

    // Store raw value for backend, but keep formatted for display if needed
    // Actually, the input's value property will be bound to formData.budget
    // So if we want to show it formatted, we must store the formatted string
    // OR have a separate state for display.
    // Given the current structure, I will store the formatted string but 
    // ensure Leads.jsx cleans it before sending.

    setFormData(prev => ({ ...prev, budget: formatted }))
    if (errors.budget) {
      setErrors(prev => ({ ...prev, budget: '' }))
    }
  }

  const handleSameAsContactChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      sameAsContact: checked,
      whatsappNumber: checked ? prev.contactNumber : prev.whatsappNumber
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required'
    } else if (formData.contactNumber.length !== 10) {
      newErrors.contactNumber = 'Contact number must be 10 digits'
    }

    if (!formData.Location.trim()) {
      newErrors.Location = 'Location is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      if (onCreate) {
        const submitData = {
          ...formData,
          EventType: formData.EventType === 'Other' && formData.customEventType.trim()
            ? formData.customEventType.trim()
            : formData.EventType,
        }
        onCreate(submitData)
      }
      onClose && onClose()
      setFormData({
        name: '',
        email: '',
        contactNumber: '',
        whatsappNumber: '',
        sameAsContact: false,
        EnquiryType: '',
        EventType: '',
        customEventType: '',
        EventDate: '',
        EventEndDate: '',
        Location: '',
        Relation: '',
        source: 'Online Store',
        status: 'Inquiry',
        remarks: '',
        company: '',
        budget: '',
        owner: 'John Doe',
        ownerInitials: 'JD'
      })
      setErrors({})
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 overflow-hidden'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out'
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className='fixed inset-y-0 right-0 flex max-w-full pl-10'>
        <div className='w-screen max-w-md transform transition-all duration-300 ease-in-out animate-slide-in-right'>
          <div className='flex h-full flex-col bg-white shadow-2xl'>
            {/* Header */}
            <div className='flex-shrink-0 px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white'>
              <div className='flex items-start justify-between'>
                <div>
                  <h1 className='text-xl font-bold text-gray-900'>Create New Lead</h1>
                  <p className='text-sm text-gray-500 mt-1'>Add a new lead to your pipeline</p>
                </div>
                <button
                  type='button'
                  onClick={onClose}
                  className='p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors'
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto px-6 py-5'>
              <div className='space-y-5'>
                {/* Basic Information */}
                <div>
                  <h3 className='text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <span className='w-1 h-4 bg-primary-dark rounded-full'></span>
                    Basic Information
                  </h3>
                  <div className='space-y-2.5'>
                    {/* Name */}
                    <div>
                      <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
                        Name <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='text'
                        id='name'
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        className={`
                        w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all
                        ${errors.name ? 'border-red-500' : 'border-gray-300'}
                      `}
                        placeholder='John Doe'
                      />
                      {errors.name && (
                        <p className='mt-1 text-sm text-red-500'>{errors.name}</p>
                      )}
                    </div>

                    {/* Company */}
                    <div>
                      <label htmlFor='company' className='block text-sm font-medium text-gray-700 mb-1'>
                        Company
                      </label>
                      <input
                        type='text'
                        id='company'
                        name='company'
                        value={formData.company}
                        onChange={handleChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                        placeholder='Acme Inc.'
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className='text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <span className='w-1 h-4 bg-primary-dark rounded-full'></span>
                    Contact Information
                  </h3>
                  <div className='space-y-2.5'>
                    <div>
                      <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
                        Email <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='email'
                        id='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        className={`
                        w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all
                        ${errors.email ? 'border-red-500' : 'border-gray-300'}
                      `}
                        placeholder='john@example.com'
                      />
                      {errors.email && (
                        <p className='mt-1 text-sm text-red-500'>{errors.email}</p>
                      )}
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label htmlFor='contactNumber' className='block text-sm font-medium text-gray-700 mb-1'>
                        Contact Number <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='tel'
                        id='contactNumber'
                        name='contactNumber'
                        value={formData.contactNumber}
                        onChange={handleChange}
                        className={`
                        w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all
                        ${errors.contactNumber ? 'border-red-500' : 'border-gray-300'}
                      `}
                        placeholder='9876543210'
                      />
                      {errors.contactNumber && (
                        <p className='mt-1 text-sm text-red-500'>{errors.contactNumber}</p>
                      )}
                    </div>

                    {/* WhatsApp Number */}
                    <div>
                      <label htmlFor='whatsappNumber' className='block text-sm font-medium text-gray-700 mb-1'>
                        WhatsApp Number
                      </label>
                      <input
                        type='tel'
                        id='whatsappNumber'
                        name='whatsappNumber'
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        disabled={formData.sameAsContact}
                        className={`
                        w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all
                        ${formData.sameAsContact ? 'bg-gray-100 cursor-not-allowed' : ''}
                        border-gray-300
                      `}
                        placeholder='9876543210'
                      />
                      <label className='flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={formData.sameAsContact}
                          onChange={(e) => handleSameAsContactChange(e.target.checked)}
                          className='w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary'
                        />
                        Same as contact number
                      </label>
                    </div>
                  </div>
                </div>

                {/* Lead Details */}
                <div>
                  <h3 className='text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <span className='w-1 h-4 bg-primary-dark rounded-full'></span>
                    Lead Details
                  </h3>
                  <div className='space-y-2.5'>
                    {/* Source */}
                    <div>
                      <label htmlFor='source' className='block text-sm font-medium text-gray-700 mb-1'>
                        Source
                      </label>
                      <select
                        id='source'
                        name='source'
                        value={formData.source}
                        onChange={handleChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                      >
                        {sourceOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor='status' className='block text-sm font-medium text-gray-700 mb-1'>
                        Status
                      </label>
                      <select
                        id='status'
                        name='status'
                        value={formData.status}
                        onChange={handleChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                      >
                        {statusOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* Budget */}
                    <div>
                      <label htmlFor='budget' className='block text-sm font-medium text-gray-700 mb-1'>
                        Budget
                      </label>
                      <input
                        type='text'
                        id='budget'
                        name='budget'
                        value={formData.budget}
                        onChange={handleBudgetChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                        placeholder='₹50,000'
                      />
                    </div>
                  </div>
                </div>

                {/* Event & Enquiry Details */}
                <div>
                  <h3 className='text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <span className='w-1 h-4 bg-primary-dark rounded-full'></span>
                    Event & Enquiry Details
                  </h3>
                  <div className='space-y-2.5'>
                    {/* Enquiry Type */}
                    <div>
                      <label htmlFor='EnquiryType' className='block text-sm font-medium text-gray-700 mb-1'>
                        Enquiry Type
                      </label>
                      <input
                        type='text'
                        id='EnquiryType'
                        name='EnquiryType'
                        value={formData.EnquiryType}
                        onChange={handleChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                        placeholder='e.g., Wedding, Corporate Event'
                      />
                    </div>

                    {/* Event Type */}
                    <div>
                      <label htmlFor='EventType' className='block text-sm font-medium text-gray-700 mb-1'>
                        Event Type
                      </label>
                      <select
                        id='EventType'
                        name='EventType'
                        value={formData.EventType}
                        onChange={handleChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                      >
                        <option value="">Select event type</option>
                        {eventTypeOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* Event Type - Show only if "Other" is selected */}
                    {formData.EventType === 'Other' && (
                      <div>
                        <label htmlFor='customEventType' className='block text-sm font-medium text-gray-700 mb-1'>
                          Specify Event Type
                        </label>
                        <input
                          type='text'
                          id='customEventType'
                          name='customEventType'
                          value={formData.customEventType}
                          onChange={handleChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                          placeholder='e.g., Intimate Wedding, Corporate Launch'
                        />
                      </div>
                    )}

                    {/* Event Date */}
                    <div className='flex gap-4'>
                      <div className='flex-1'>
                        <label htmlFor='EventDate' className='block text-sm font-medium text-gray-700 mb-1'>
                          Start Date
                        </label>
                        <DatePicker
                          value={formData.EventDate ? dayjs(formData.EventDate) : null}
                          onChange={(date) => setFormData(prev => ({ ...prev, EventDate: date ? date.format('YYYY-MM-DD') : '' }))}
                          format='DD/MM/YYYY'
                          className='w-full h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                          style={{ width: '100%' }}
                          placeholder='Select event date'
                        />
                      </div>
                      <div className='flex-1'>
                        <label htmlFor='EventEndDate' className='block text-sm font-medium text-gray-700 mb-1'>
                          End Date
                        </label>
                        <DatePicker
                          value={formData.EventEndDate ? dayjs(formData.EventEndDate) : null}
                          onChange={(date) => setFormData(prev => ({ ...prev, EventEndDate: date ? date.format('YYYY-MM-DD') : '' }))}
                          format='DD/MM/YYYY'
                          className='w-full h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                          style={{ width: '100%' }}
                          placeholder='Select end date'
                          minDate={formData.EventDate ? dayjs(formData.EventDate) : dayjs()}
                        />
                      </div>
                    </div>
                    {/* Location */}
                    <div>
                      <label htmlFor='Location' className='block text-sm font-medium text-gray-700 mb-1'>
                        Location <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='text'
                        id='Location'
                        name='Location'
                        value={formData.Location}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.Location ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder='Event location'
                      />
                      {errors.Location && (
                        <p className='mt-1 text-sm text-red-500'>{errors.Location}</p>
                      )}
                    </div>

                    {/* Relation */}
                    <div>
                      <label htmlFor='Relation' className='block text-sm font-medium text-gray-700 mb-1'>
                        Relation
                      </label>
                      <input
                        type='text'
                        id='Relation'
                        name='Relation'
                        value={formData.Relation}
                        onChange={handleChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all'
                        placeholder='e.g., Bride, Groom, Event Manager'
                      />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label htmlFor='remarks' className='block text-sm font-medium text-gray-700 mb-1'>
                    Remarks
                  </label>
                  <textarea
                    id='remarks'
                    name='remarks'
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={2}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all'
                    placeholder='Add any additional notes about this lead...'
                  />
                </div>
              </div>
            </form>

            {/* Footer - Sticky */}
            <div className='flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50'>
              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={onClose}
                  className='flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white font-medium transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  onClick={handleSubmit}
                  className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-dark text-white rounded-lg hover:bg-primary font-medium transition-colors shadow-sm'
                >
                  <Save size={18} />
                  Create Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
