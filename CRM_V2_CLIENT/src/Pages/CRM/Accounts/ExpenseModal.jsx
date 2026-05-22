import React, { useState, useEffect } from 'react'
import { X, Users } from 'lucide-react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { getExpenseOptions, uploadExpenseScreenshots } from '../../../services/expenseService'
import ScreenshotUploader from '../../../Components/ScreenshotUploader'

const EXPENSE_CATEGORIES = [
  'Equipment',
  'Software & Tools',
  'Marketing',
  'Salaries',
  'Rent & Utilities',
  'Travel',
  'Office Supplies',
  'Professional Services',
  'Insurance',
  'Taxes',
  'Maintenance',
  'Training & Development',
  'Other'
]

export const ExpenseModal = ({ isOpen, onClose, onSubmit, expense, isLoading, preselectedProjectId, preselectedCrew }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: dayjs(),
    category: 'Equipment',
    customCategory: '',
    expenseType: preselectedProjectId ? 'project' : 'general',
    projectId: preselectedProjectId || '',
    assignedCrew: '',
    screenshots: []
  })
  const [amountDisplay, setAmountDisplay] = useState('')
  const [projects, setProjects] = useState([])
  const [crewList, setCrewList] = useState([])

  // Format number with Indian number system (commas)
  const formatIndianNumber = (value) => {
    try {
      if (!value || value === '' || value === null || value === undefined) return ''

      // Remove all non-digit characters except decimal point
      const numericValue = value.toString().replace(/[^\d.]/g, '')
      if (!numericValue) return ''

      // Split by decimal point
      const parts = numericValue.split('.')
      const integerPart = parts[0] || ''
      const decimalPart = parts[1] || ''

      // Format integer part with Indian number system using Intl.NumberFormat
      let formattedInteger = integerPart
      if (integerPart) {
        const num = parseFloat(integerPart)
        if (!isNaN(num) && num >= 0) {
          formattedInteger = new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
          }).format(num)
        }
      }

      // Combine with decimal part (limit to 2 decimal places)
      const formattedDecimal = decimalPart.slice(0, 2)

      return formattedDecimal ? `${formattedInteger}.${formattedDecimal}` : formattedInteger
    } catch (error) {
      console.error('Error formatting Indian number:', error)
      return value?.toString() || ''
    }
  }

  // Parse formatted number back to numeric value
  const parseIndianNumber = (value) => {
    try {
      if (!value || value === '') return ''
      const numericValue = value.toString().replace(/[^\d.]/g, '')
      return numericValue === '' ? '' : (parseFloat(numericValue) || '')
    } catch (error) {
      console.error('Error parsing Indian number:', error)
      return ''
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const optionsData = await getExpenseOptions()
        setProjects(optionsData?.projects || [])
        
        const crewData = preselectedCrew && preselectedCrew.length > 0 ? preselectedCrew : (optionsData?.crew || [])
        setCrewList(Array.isArray(crewData) ? crewData : [])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        const amount = expense.amount || ''
        const hasProject = expense.projectId?._id || expense.projectId || preselectedProjectId
        setFormData({
          amount: amount,
          description: expense.description || '',
          date: expense.date ? dayjs(expense.date) : dayjs(),
          category: expense.category || 'Equipment',
          customCategory: expense.customCategory || '',
          expenseType: hasProject ? 'project' : 'general',
          projectId: hasProject || '',
          assignedCrew: expense.assignedCrew?._id || expense.assignedCrew || '',
          screenshots: expense.screenshots || []
        })
        setAmountDisplay(amount ? formatIndianNumber(amount.toString()) : '')
      } else {
        setFormData({
          amount: '',
          description: '',
          date: dayjs(),
          category: 'Equipment',
          customCategory: '',
          expenseType: preselectedProjectId ? 'project' : 'general',
          projectId: preselectedProjectId || '',
          assignedCrew: '',
          screenshots: []
        })
        setAmountDisplay('')
      }
    }
  }, [isOpen, expense, preselectedProjectId])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate amount
    if (!formData.amount || formData.amount === '') {
      return
    }

    // Validate date
    if (!formData.date) {
      return
    }

    // Validate Project (Optional now)
    // if (!formData.projectId) {
    //   return
    // }

    // Convert dayjs date to ISO string for backend
    let dateValue = formData.date
    if (dateValue && typeof dateValue.format === 'function') {
      // It's a dayjs object
      dateValue = dateValue.format('YYYY-MM-DD')
    } else if (dateValue) {
      // It's already a string or Date
      dateValue = typeof dateValue === 'string' ? dateValue : new Date(dateValue).toISOString().split('T')[0]
    } else {
      dateValue = new Date().toISOString().split('T')[0]
    }

    const submitData = {
      ...formData,
      date: dateValue
    }
    onSubmit(submitData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'amount') {
      // Format the display value
      const formatted = formatIndianNumber(value)
      setAmountDisplay(formatted)

      // Store the actual numeric value
      const numericValue = parseIndianNumber(value)
      setFormData(prev => ({ ...prev, [name]: numericValue }))
    } else if (name === 'expenseType') {
      // When expense type changes, clear project if switching to general
      setFormData(prev => ({
        ...prev,
        expenseType: value,
        projectId: value === 'general' ? '' : prev.projectId
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date: date }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar - Right aligned */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h3 className="text-xl font-bold text-primary-dark">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Amount */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Amount <span className="text-red-500">*</span>
              </label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>₹</span>
                <input
                  type='text'
                  name='amount'
                  value={amountDisplay}
                  onChange={handleChange}
                  required
                  className='w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent'
                  placeholder='0.00'
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name='category'
                value={formData.category}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent bg-white'
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Custom Category */}
            {formData.category === 'Other' && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Specify Category <span className="text-red-500">*</span>
                </label>
                <input
                  type='text'
                  name='customCategory'
                  value={formData.customCategory}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent'
                  placeholder='e.g., Marketing Tools'
                />
              </div>
            )}

            {/* Date */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.date || dayjs()}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                placeholder="dd-mm-yyyy"
                className='w-full'
                style={{ height: '42px', width: '100%' }}
              />
            </div>

            {/* Description */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Description
              </label>
              <textarea
                name='description'
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent resize-none'
                placeholder='Enter expense description...'
              />
            </div>

            {/* Expense Type */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Expense Type <span className="text-red-500">*</span>
              </label>
              <select
                name='expenseType'
                value={formData.expenseType}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent bg-white'
              >
                <option value='general'>General Expense</option>
                <option value='project'>Project Related</option>
              </select>
            </div>

            {/* Project & Crew in Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Project - Only show if expense type is 'project' */}
              {formData.expenseType === 'project' && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    name='projectId'
                    value={formData.projectId}
                    onChange={handleChange}
                    required
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent bg-white'
                  >
                    <option value=''>Select Project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.projectTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assigned Crew */}
              <div className={formData.expenseType === 'general' ? 'col-span-2' : ''}>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Users className='inline-block mr-1 mb-1' size={16} />
                  Assigned Crew <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <select
                  name='assignedCrew'
                  value={formData.assignedCrew}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent bg-white'
                >
                  <option value=''>No crew assigned</option>
                  {crewList.map(crew => (
                    <option key={crew._id} value={crew._id}>
                      {crew.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Screenshots */}
            <ScreenshotUploader
              urls={formData.screenshots}
              onChange={(urls) => setFormData(prev => ({ ...prev, screenshots: urls }))}
              onUpload={uploadExpenseScreenshots}
              disabled={isLoading}
            />
          </form>
        </div>

        {/* Footer Buttons */}
        <div className='flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-white'>
          <div className='flex justify-end gap-3'>
            <button
              type='button'
              onClick={onClose}
              className='px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={isLoading}
              className='px-5 py-2.5 text-sm font-medium text-white bg-primary-dark rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {isLoading ? 'Saving...' : expense ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
