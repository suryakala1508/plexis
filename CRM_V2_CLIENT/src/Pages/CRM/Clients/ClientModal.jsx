import React, { useState, useEffect } from 'react'
import { Briefcase } from 'lucide-react'
import { getProjects } from '../../../services/projectService'
import { LoadingSpinner } from '../../../Components/Loading'

export const ClientModal = ({ isOpen, onClose, onSave, editClient = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    email: '',
    phone: '',
    status: 'Ongoing',
    notes: '',
    linkToProject: false,
    projectId: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  useEffect(() => {
    if (editClient) {
      setFormData({
        name: editClient.name || '',
        relation: editClient.relation || '',
        email: editClient.email || '',
        phone: editClient.phone || '',
        status: editClient.status || 'Ongoing',
        notes: editClient.notes || '',
        linkToProject: false,
        projectId: ''
      })
    } else {
      setFormData({
        name: '',
        relation: '',
        email: '',
        phone: '',
        status: 'Ongoing',
        notes: '',
        linkToProject: false,
        projectId: ''
      })
    }
    setErrors({})
    setSubmitError(null)
  }, [editClient, isOpen])

  // Fetch projects when modal opens and linkToProject is enabled
  useEffect(() => {
    if (isOpen && formData.linkToProject && !editClient) {
      fetchProjects()
    }
  }, [isOpen, formData.linkToProject, editClient])

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true)
      const projectsData = await getProjects()
      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleChange = (e) => {
    let { name, value } = e.target

    // Handle phone number for Indian format
    if (name === 'phone') {
      // Remove all non-digits except +
      let cleaned = value.replace(/[^\d+]/g, '')

      // If starts with +91, allow +91 followed by up to 10 digits
      if (cleaned.startsWith('+91')) {
        const digits = cleaned.slice(3).replace(/\D/g, '').slice(0, 10)
        value = '+91' + digits
      } else if (cleaned.startsWith('91') && cleaned.length > 2) {
        // If starts with 91 (without +), add + and limit to 10 more digits
        const digits = cleaned.slice(2).replace(/\D/g, '').slice(0, 10)
        value = '+91' + digits
      } else {
        // Otherwise, just allow 10 digits
        const digits = cleaned.replace(/\D/g, '').slice(0, 10)
        value = digits
      }
    }

    // Handle checkbox
    if (name === 'linkToProject' && e.target.type === 'checkbox') {
      value = e.target.checked
      // If unchecking, clear projectId
      if (!value) {
        setFormData(prev => ({ ...prev, [name]: value, projectId: '' }))
        return
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required'
    }

    if (!formData.relation.trim()) {
      newErrors.relation = 'Relation is required'
    }

    // Email is optional but if provided, must be valid
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    // Phone validation for Indian numbers
    if (formData.phone) {
      const phoneRegex = /^(\+91)?[6-9]\d{9}$/
      const cleanedPhone = formData.phone.replace(/[^\d]/g, '')
      // Remove +91 prefix if present for validation
      const phoneDigits = cleanedPhone.startsWith('91') ? cleanedPhone.slice(2) : cleanedPhone

      if (phoneDigits.length !== 10 || !phoneRegex.test(phoneDigits)) {
        newErrors.phone = 'Please enter a valid Indian phone number (10 digits)'
      }
    }

    // If linking to project, projectId is required
    if (formData.linkToProject && !formData.projectId) {
      newErrors.projectId = 'Please select a project to link'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onSave(formData)
      // Wait for onSave to complete before closing
      onClose()
    } catch (err) {
      console.error('Error in ClientModal:', err)
      // Extract the error message correctly from the API error object
      const errorMsg = err.message || (typeof err === 'string' ? err : 'An error occurred while saving the client')
      setSubmitError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40"
        onClick={onClose}
      />

      {/* Side Popup */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[370px] lg:w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary-dark">
            {editClient ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {/* Client Name */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter client/company name"
                className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400 ${errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Relation */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Relation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="relation"
                value={formData.relation}
                onChange={handleChange}
                placeholder="e.g., Lead Converted, Referral"
                className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400 ${errors.relation ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.relation && <p className="mt-1 text-xs text-red-600">{errors.relation}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all bg-white cursor-pointer"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Link to Project */}
            {!editClient && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    name="linkToProject"
                    id="linkToProject"
                    checked={formData.linkToProject}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-dark border-gray-300 rounded focus:ring-primary-dark cursor-pointer"
                  />
                  <label htmlFor="linkToProject" className="flex items-center gap-1.5 text-xs font-semibold text-primary-dark cursor-pointer select-none">
                    <Briefcase size={14} />
                    Link to Existing Project
                  </label>
                </div>

                {formData.linkToProject && (
                  <div className="animate-fadeIn pl-6">
                    <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                      Select Project <span className="text-red-500">*</span>
                    </label>
                    {loadingProjects ? (
                      <div className="px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-xs text-gray-500">Loading projects...</span>
                      </div>
                    ) : (
                      <select
                        name="projectId"
                        value={formData.projectId}
                        onChange={handleChange}
                        className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all bg-white cursor-pointer ${errors.projectId ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Select a project...</option>
                        {projects.map(project => (
                          <option key={project._id || project.id} value={project._id || project.id}>
                            {project.projectTitle || project.title || 'Untitled Project'}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.projectId && <p className="mt-1 text-xs text-red-600">{errors.projectId}</p>}
                    {projects.length === 0 && !loadingProjects && (
                      <p className="mt-1 text-[10px] text-gray-500">No projects available.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Email <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@company.com"
                className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Phone <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes..."
                rows={4}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all resize-none placeholder:text-gray-400"
              />
            </div>

          </form>
        </div>

        {/* Action Buttons - Sticky Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-dark rounded-lg hover:bg-primary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {editClient ? 'Update Client' : 'Add Client'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

