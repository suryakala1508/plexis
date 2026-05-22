import React, { useState } from 'react'
import { LoadingSpinner } from './Loading'
import { Send } from 'lucide-react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import {
  ENQUIRY_TYPE_OPTIONS,
  EVENT_OPTIONS,
  RELATION_OPTIONS
} from '../types/StudioConfig.js'

export const LeadForm = ({ config, onSubmit, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    whatsappNumber: '',
    sameAsContact: false,
    enquiryType: '',
    event: '',
    eventType: '',
    customEventType: '',
    eventDates: '',
    location: '',
    relation: '',
    budget: '',
    customFields: {}
  })

  const isFieldEnabled = (fieldName) => config?.form?.fields?.[fieldName] !== false

  const isFieldMandatory = (fieldName) => {
    if (!isFieldEnabled(fieldName)) return false
    const mandatory = config?.form?.mandatory
    // Legacy fallback: if mandatory isn’t stored yet, treat enabled fields as mandatory
    if (!mandatory || typeof mandatory !== 'object') return true
    return mandatory[fieldName] ?? true
  }

  const validateIndianPhone = (number) => {
    const regex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/
    return regex.test(number)
  }

  const handleChange = (field, value) => {
    // Phone number validation - strict numeric input
    if ((field === 'contactNumber' || field === 'whatsappNumber')) {
      // Allow only numbers and optional + at start
      const numericValue = value.replace(/[^0-9+]/g, '')
      // Prevent multiple pluses or plus in middle
      if ((numericValue.match(/\+/g) || []).length > 1 || (numericValue.indexOf('+') > 0)) {
        return
      }

      setFormData(prev => {
        const updated = { ...prev, [field]: numericValue }
        if (field === 'contactNumber' && prev.sameAsContact) {
          updated.whatsappNumber = numericValue
        }
        return updated
      })
      return
    }

    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // Sync WhatsApp with contact if checkbox is checked
      if (field === 'contactNumber' && prev.sameAsContact) {
        updated.whatsappNumber = value
      }

      // Clear custom event type if event is not "Other"
      if (field === 'event' && value !== 'Other') {
        updated.customEventType = ''
      }

      return updated
    })
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
    const formatted = formatBudget(e.target.value)
    handleChange('budget', formatted)
  }

  const handleSameAsContactChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      sameAsContact: checked,
      whatsappNumber: checked ? prev.contactNumber : prev.whatsappNumber
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate phone numbers
    if (isFieldEnabled('contactNumber')) {
      const mustValidate = isFieldMandatory('contactNumber') || !!formData.contactNumber
      if (mustValidate && !validateIndianPhone(formData.contactNumber)) {
        alert('Please enter a valid Indian contact number')
        return
      }
    }

    if (isFieldEnabled('whatsappNumber')) {
      const mustValidate = isFieldMandatory('whatsappNumber') || (!!formData.whatsappNumber && !formData.sameAsContact)
      if (mustValidate && !validateIndianPhone(formData.whatsappNumber)) {
        alert('Please enter a valid Indian WhatsApp number')
        return
      }
    }

    // Filter out disabled fields
    const filteredData = {}
    const formFields = config.form?.fields || {}
    Object.keys(formData).forEach(key => {
      // Always include name and email (required fields)
      if (key === 'name' || key === 'email') {
        filteredData[key] = formData[key]
      } else if (formFields[key] !== false) {
        filteredData[key] = formData[key]
      }
    })

    // Add custom fields
    filteredData.additionalfields = formData.customFields

    onSubmit(filteredData)
  }

  const inputClasses = 'w-full px-3 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 text-sm sm:text-base'
  const labelClasses = 'block text-sm sm:text-base font-semibold text-gray-800 mb-1.5'

  const accentColor = config.accentColor || '#D4AF37'

  return (
    <form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4'>
      {/* Name - Always required by backend */}
      <div className='transform transition-all duration-200 hover:scale-[1.01]'>
        <label className={labelClasses}>
          Name <span className='text-red-500'>*</span>
        </label>
        <input
          type='text'
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder='Your full name'
          required
          className={inputClasses}
          style={{
            borderColor: formData.name ? accentColor : undefined,
            '--tw-ring-color': accentColor
          }}
        />
      </div>

      {/* Email - Optional */}
      <div className='transform transition-all duration-200 hover:scale-[1.01]'>
        <label className={labelClasses}>
          Email <span className='text-red-500'>*</span>
        </label>
        <input
          type='email'
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder='your.email@example.com'
          className={inputClasses}
          required
          style={{
            borderColor: formData.email ? accentColor : undefined,
            '--tw-ring-color': accentColor
          }}
        />
      </div>

      {/* Contact Number */}
      {isFieldEnabled('contactNumber') && (
        <div>
          <label className={labelClasses}>
            Contact Number {isFieldMandatory('contactNumber') && <span className='text-red-500'>*</span>}
          </label>
          <input
            type='tel'
            value={formData.contactNumber}
            onChange={(e) => handleChange('contactNumber', e.target.value)}
            placeholder='9876543210'
            required={isFieldMandatory('contactNumber')}
            maxLength={13}
            className={inputClasses}
            style={{
              borderColor: formData.contactNumber ? (validateIndianPhone(formData.contactNumber) ? accentColor : '#ef4444') : undefined,
              '--tw-ring-color': accentColor
            }}
          />
          {formData.contactNumber && !validateIndianPhone(formData.contactNumber) && (
            <p className="text-xs text-red-500 mt-1">Please enter a valid Indian number</p>
          )}
        </div>
      )}

      {/* WhatsApp Number */}
      {isFieldEnabled('whatsappNumber') && (
        <div>
          <label className={labelClasses}>
            WhatsApp Number {isFieldMandatory('whatsappNumber') && <span className='text-red-500'>*</span>}
          </label>
          <input
            type='tel'
            value={formData.whatsappNumber}
            onChange={(e) => handleChange('whatsappNumber', e.target.value)}
            placeholder='9876543210'
            required={isFieldMandatory('whatsappNumber')}
            maxLength={13}
            disabled={formData.sameAsContact}
            className={`${inputClasses} ${formData.sameAsContact ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            style={{
              borderColor: formData.whatsappNumber ? (validateIndianPhone(formData.whatsappNumber) ? accentColor : '#ef4444') : undefined
            }}
          />
          {formData.whatsappNumber && !validateIndianPhone(formData.whatsappNumber) && !formData.sameAsContact && (
            <p className="text-xs text-red-500 mt-1">Please enter a valid Indian WhatsApp number</p>
          )}
          <label className='flex items-center gap-2.5 mt-3 text-sm sm:text-base text-gray-600 cursor-pointer group'>
            <input
              type='checkbox'
              checked={formData.sameAsContact}
              onChange={(e) => handleSameAsContactChange(e.target.checked)}
              className='w-4 h-4 sm:w-5 sm:h-5 rounded accent-current transition-transform group-hover:scale-110'
              style={{ accentColor }}
            />
            <span className='group-hover:text-gray-800 transition-colors'>Same as contact number</span>
          </label>
        </div>
      )}

      {/* Enquiry Type */}
      {isFieldEnabled('enquiryType') && (
        <div>
          <label className={labelClasses}>
            Enquiry Type {isFieldMandatory('enquiryType') && <span className='text-red-500'>*</span>}
          </label>
          <select
            value={formData.enquiryType}
            onChange={(e) => handleChange('enquiryType', e.target.value)}
            required={isFieldMandatory('enquiryType')}
            className={inputClasses}
            style={{
              borderColor: formData.enquiryType ? accentColor : undefined,
              color: formData.enquiryType ? 'inherit' : '#9CA3AF'
            }}
          >
            <option value='' disabled hidden>Select enquiry type</option>
            {ENQUIRY_TYPE_OPTIONS.map(option => (
              <option key={option} value={option} style={{ color: '#000' }}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {/* Event */}
      {isFieldEnabled('event') && (
        <div>
          <label className={labelClasses}>
            Event {isFieldMandatory('event') && <span className='text-red-500'>*</span>}
          </label>
          <select
            value={formData.event}
            onChange={(e) => handleChange('event', e.target.value)}
            required={isFieldMandatory('event')}
            className={inputClasses}
            style={{
              borderColor: formData.event ? accentColor : undefined,
              color: formData.event ? 'inherit' : '#9CA3AF'
            }}
          >
            <option value='' disabled hidden>Select event type</option>
            {EVENT_OPTIONS.map(option => (
              <option key={option} value={option} style={{ color: '#000' }}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {/* Event Type - Show text input only if "Other" is selected */}
      {isFieldEnabled('eventType') && formData.event === 'Other' && (
        <div>
          <label className={labelClasses}>
            Specify Event Type {isFieldMandatory('eventType') && <span className='text-red-500'>*</span>}
          </label>
          <input
            type='text'
            value={formData.customEventType}
            onChange={(e) => handleChange('customEventType', e.target.value)}
            placeholder='e.g., Intimate Wedding, Corporate Launch'
            required={isFieldMandatory('eventType')}
            className={inputClasses}
            style={{
              borderColor: formData.customEventType ? accentColor : undefined
            }}
          />
        </div>
      )}

      {/* Event Dates */}
      {isFieldEnabled('eventDates') && (
        <div>
          <label className={labelClasses}>
            Event Date {isFieldMandatory('eventDates') && <span className='text-red-500'>*</span>}
          </label>
          <DatePicker
            value={formData.eventDates ? dayjs(formData.eventDates) : null}
            onChange={(date) => handleChange('eventDates', date ? date.format('YYYY-MM-DD') : '')}
            format='DD/MM/YYYY'
            className={inputClasses}
            style={{
              width: '100%',
              height: '50px',
              border: `2px solid ${formData.eventDates ? accentColor : '#e5e7eb'}`,
              borderRadius: '0.75rem',
              boxShadow: 'none',
            }}
            placeholder='Select event date'
          />
        </div>
      )}

      {/* Location */}
      {isFieldEnabled('location') && (
        <div>
          <label className={labelClasses}>
            Location {isFieldMandatory('location') && <span className='text-red-500'>*</span>}
          </label>
          <input
            type='text'
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder='Event location'
            required={isFieldMandatory('location')}
            className={inputClasses}
            style={{
              borderColor: formData.location ? accentColor : undefined
            }}
          />
        </div>
      )}

      {/* Relation */}
      {isFieldEnabled('relation') && (
        <div>
          <label className={labelClasses}>
            Relation {isFieldMandatory('relation') && <span className='text-red-500'>*</span>}
          </label>
          <select
            value={formData.relation}
            onChange={(e) => handleChange('relation', e.target.value)}
            required={isFieldMandatory('relation')}
            className={inputClasses}
            style={{
              borderColor: formData.relation ? accentColor : undefined,
              color: formData.relation ? 'inherit' : '#9CA3AF'
            }}
          >
            <option value='' disabled hidden>Select relation</option>
            {RELATION_OPTIONS.map(option => (
              <option key={option} value={option} style={{ color: '#000' }}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {/* Budget */}
      {isFieldEnabled('budget') && (
        <div>
          <label className={labelClasses}>
            Budget {isFieldMandatory('budget') && <span className='text-red-500'>*</span>}
          </label>
          <input
            type='text'
            value={formData.budget}
            onChange={handleBudgetChange}
            placeholder='₹3,00,000'
            className={inputClasses}
            style={{
              borderColor: formData.budget ? accentColor : undefined
            }}
          />
        </div>
      )}

      {/* Custom Fields */}
      {(config.form?.customFields || []).map((field, index, array) => {
        const customMandatory = field?.isMandatory ?? true
        const isLast = index === array.length - 1
        const isOddCount = array.length % 2 !== 0
        const shouldSpanFull = isLast && isOddCount

        return (
          <div 
            key={index} 
            className='transform transition-all duration-200 hover:scale-[1.01]'
            
          >
            <label className={labelClasses}>
              {field.name} {customMandatory && <span className='text-red-500'>*</span>}
            </label>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={formData.customFields?.[field.name] || ''}
              onChange={(e) => handleChange('customFields', {
                ...formData.customFields,
                [field.name]: e.target.value
              })}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              required={customMandatory}
              className={inputClasses}
              style={{
                borderColor: formData.customFields?.[field.name] ? accentColor : undefined,
                '--tw-ring-color': accentColor
              }}
            />
          </div>
        )
      })}

      {/* Submit Button */}
      <button
        type='submit'
        disabled={isSubmitting}
        className='w-full flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base sm:text-lg transform hover:scale-[1.02] active:scale-[0.98]'
        style={{
          backgroundColor: accentColor,
          transform: isSubmitting ? 'scale(0.98)' : 'scale(1)'
        }}
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size='md' />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <Send size={20} className='animate-pulse' />
            <span>Send Enquiry</span>
          </>
        )}
      </button>
    </form>
  )
}

