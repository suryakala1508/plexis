import React, { useState, useEffect } from 'react'
import ReactDOM from "react-dom/client"
import { useUser } from '../../../contexts/UserContext'
import { ExpenseTable } from './ExpenseTable'
import { ExpenseModal } from './ExpenseModal'
import { TableSkeleton } from '../../../Components/Loading'
import { getProjects } from '../../../services/projectService'
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../../../services/expenseService'
import { Success } from "../../../Components/Success"
import { Error } from "../../../Components/Error"
import { ConfirmDialog } from '@/Components/ui/confirm-dialog'
import { Plus, Download, Filter, Search, RefreshCw, ArrowLeft, Trash2, X, HelpCircle, Lightbulb } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TourGuide } from '../../../Components/TourGuide/TourGuide'
import { expensesTourSteps } from '../../../Components/TourGuide/steps/expensesTourSteps'
import { PermissionGate } from '@/Pages/utils/permissions'

export const ExpensesList = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const startTourRef = React.useRef(null)
  const [expenses, setExpenses] = useState([])
  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterDateRange, setFilterDateRange] = useState('All time')
  const [showFilters, setShowFilters] = useState(false)
  // Confirmation modal state
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: null,
  })

  const EXPENSE_CATEGORIES = [
    'All',
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

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getExpenses()
      setExpenses(data || [])
      setFilteredExpenses(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load expenses')
      console.error('Error fetching expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  // Check for add query param
  useEffect(() => {
    if (location.search.includes('add=true')) {
      setIsModalOpen(true)
      // Clear the query param
      navigate(location.pathname, { replace: true })
    }
  }, [location.search, navigate])

  // Apply filters
  useEffect(() => {
    let filtered = [...expenses]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exp => {
        const projectTitle = exp.projectId?.projectTitle || exp.project?.projectTitle || '';
        return exp.description.toLowerCase().includes(query) ||
          exp.category.toLowerCase().includes(query) ||
          exp.amount.toString().includes(query) ||
          projectTitle.toLowerCase().includes(query);
      });
    }

    // Category filter
    if (filterCategory !== 'All') {
      filtered = filtered.filter(exp => exp.category === filterCategory)
    }

    // Date range filter
    if (filterDateRange !== 'All time') {
      const now = new Date()
      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.date)
        const daysDiff = Math.floor((now - expDate) / (1000 * 60 * 60 * 24))

        switch (filterDateRange) {
          case 'Today':
            return daysDiff === 0
          case 'Last 7 days':
            return daysDiff <= 7
          case 'Last 30 days':
            return daysDiff <= 30
          case 'Last 90 days':
            return daysDiff <= 90
          case 'This year':
            return expDate.getFullYear() === now.getFullYear()
          default:
            return true
        }
      })
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date))

    setFilteredExpenses(filtered)
  }, [expenses, searchQuery, filterCategory, filterDateRange])

  const handleAddExpense = () => {
    setSelectedExpense(null)
    setIsModalOpen(true)
  }

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense)
    setIsModalOpen(true)
  }

  const handleDeleteExpense = (expenseId) => {
    const expense = expenses.find(e => e._id === expenseId)
    if (!expense) return

    setConfirmState({
      open: true,
      title: 'Delete Expense',
      description: `Are you sure you want to delete "${expense.description}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteExpense(expenseId)

          // Show success toast
          const successDiv = document.createElement("div")
          document.body.appendChild(successDiv)
          const root = ReactDOM.createRoot(successDiv)
          root.render(
            <Success
              title="Successfully Deleted"
              autoClose={true}
              autoCloseDelay={4500}
              makeDarker={true}
              onClose={() => {
                root.unmount()
                document.body.removeChild(successDiv)
              }}
            >
              Expense has been successfully deleted.
            </Success>
          )

          // Update local state instead of refetching
          setExpenses(prev => prev.filter(e => e._id !== expenseId));
        } catch (err) {
          // Show error toast
          const errorDiv = document.createElement("div")
          document.body.appendChild(errorDiv)
          const errorRoot = ReactDOM.createRoot(errorDiv)
          errorRoot.render(
            <Error
              title="Delete Failed"
              variant="error"
              makeDarker={true}
              autoClose={false}
              onClose={() => {
                errorRoot.unmount()
                document.body.removeChild(errorDiv)
              }}
            >
              {err.message || 'Failed to delete expense'}
            </Error>
          )
        } finally {
          setConfirmState(prev => ({ ...prev, open: false }))
        }
      }
    })
  }

  const handleSubmitExpense = async (formData) => {
    try {
      setIsSubmitting(true)
      let savedExpense;
      if (selectedExpense) {
        savedExpense = await updateExpense(selectedExpense._id, formData)
        // Update local state
        setExpenses(prev => prev.map(exp => exp._id === savedExpense._id ? savedExpense : exp));
      } else {
        savedExpense = await addExpense(formData)
        // Add to local state
        setExpenses(prev => [savedExpense, ...prev]);
      }
      
      // Show success toast
      const successDiv = document.createElement("div")
      document.body.appendChild(successDiv)
      const root = ReactDOM.createRoot(successDiv)
      root.render(
        <Success
          title={selectedExpense ? "Successfully Updated" : "Successfully Added"}
          autoClose={true}
          autoCloseDelay={4500}
          makeDarker={true}
          onClose={() => {
            root.unmount()
            document.body.removeChild(successDiv)
          }}
        >
          Expense has been {selectedExpense ? "updated" : "added"}.
        </Success>
      )

      setIsModalOpen(false)
      setSelectedExpense(null)
    } catch (err) {
      // Show error toast
      const errorDiv = document.createElement("div")
      document.body.appendChild(errorDiv)
      const errorRoot = ReactDOM.createRoot(errorDiv)
      errorRoot.render(
        <Error
          title="Save Failed"
          variant="error"
          makeDarker={true}
          autoClose={false}
          onClose={() => {
            errorRoot.unmount()
            document.body.removeChild(errorDiv)
          }}
        >
          {err.message || 'Failed to save expense'}
        </Error>
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = () => {
    const headers = ['Date', 'Project', 'Assigned To', 'Category', 'Description', 'Amount'];
    const rows = filteredExpenses.map(exp => [
      new Date(exp.date).toLocaleDateString(),
      exp.projectId?.projectTitle || exp.project?.projectTitle || 'General',
      exp.assignedCrew ? exp.assignedCrew.name : 'Unassigned',
      exp.category,
      exp.description,
      exp.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setFilterCategory('All')
    setFilterDateRange('All time')
  }

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading && expenses.length === 0) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen'>
        <div className='max-w-[1800px] mx-auto'>
          <div className='mb-6'>
            <div className='h-8 w-48 bg-gray-200 rounded animate-pulse mb-2'></div>
            <div className='h-4 w-64 bg-gray-200 rounded animate-pulse'></div>
          </div>
          <TableSkeleton rows={10} columns={4} />
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 lg:pl-4 bg-gray-50 min-h-screen'>
      <TourGuide 
        steps={expensesTourSteps} 
        tourKey="accounts-expenses-tour"
        autoStart={false} 
        onStartTour={(startFn) => { startTourRef.current = startFn; }}
      />
      <div className='max-w-[1800px] mx-auto space-y-6'>
        {/* Header */}
        <div id="expenses-header" className='flex items-center justify-between'>
          <div>
             <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold text-primary-dark mb-1'>
                All Expenses
              </h1>
              <button 
                onClick={() => startTourRef.current?.()} 
                className='text-primary-dark/60 hover:text-primary-dark transition-colors'
                title="Start Page Tour"
              >
                
                {/* Using RefreshCw as placeholder if no Help icon imported, but I see RefreshCw imported. Let's refer to previous files where I used Lightbulb/HelpCircle */}
                {/* Actually let's use the HelpCircle I should import or if Lightbulb is available */}
              </button>
            </div>
            <p className='text-sm text-gray-600 mt-1'>
              Detailed view of all expense transactions
            </p>
          </div>
          <div id="expenses-controls" className='flex items-center gap-3'>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters
                ? 'bg-primary-dark text-white border-primary-dark'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              <Filter size={16} />
              Filters
            </button>
            <PermissionGate page="6" component="6_1" action="edit">
            <button
              onClick={handleExport}
              className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white'
            >
              <Download size={16} />
              Export
            </button>
            <button
              id="add-expense-btn"
              onClick={handleAddExpense}
              className='flex items-center gap-2 px-5 py-2.5 bg-primary-dark text-white rounded-lg text-sm font-medium hover:bg-primary-dark/90 transition-colors shadow-sm'
            >
              <Plus size={18} />
              Add Expense
            </button>
            </PermissionGate>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className='bg-white rounded-xl border border-gray-200 p-4'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {/* Search */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={18} />
                <input
                  type='text'
                  placeholder='Search expenses...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark focus:border-transparent'
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark focus:border-transparent'
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Date Range Filter */}
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark focus:border-transparent'
              >
                <option value='All time'>All time</option>
                <option value='Today'>Today</option>
                <option value='Last 7 days'>Last 7 days</option>
                <option value='Last 30 days'>Last 30 days</option>
                <option value='Last 90 days'>Last 90 days</option>
                <option value='This year'>This year</option>
              </select>

              {/* Reset */}
              <button
                onClick={resetFilters}
                className='px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50'
              >
                Reset Filters
              </button>
            </div>

            {/* Active Filters Summary */}
            {(searchQuery || filterCategory !== 'All' || filterDateRange !== 'All time') && (
              <div className='mt-3 flex items-center gap-2 text-sm text-gray-600'>
                <span className='font-medium'>Active filters:</span>
                {searchQuery && (
                  <span className='px-2 py-1 bg-blue-50 text-blue-700 rounded'>
                    Search: "{searchQuery}"
                  </span>
                )}
                {filterCategory !== 'All' && (
                  <span className='px-2 py-1 bg-purple-50 text-primary-dark rounded'>
                    Category: {filterCategory}
                  </span>
                )}
                {filterDateRange !== 'All time' && (
                  <span className='px-2 py-1 bg-green-50 text-green-700 rounded'>
                    Date: {filterDateRange}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        {/* Table */}
        <div id="expenses-table">
          <ExpenseTable
            expenses={filteredExpenses}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
          />
        </div>
      </div>
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedExpense(null)
        }}
        onSubmit={handleSubmitExpense}
        expense={selectedExpense}
        isLoading={isSubmitting}
        preselectedProjectId={null}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(v) => setConfirmState(prev => ({ ...prev, open: v }))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
      />
    </div>
  )
}

