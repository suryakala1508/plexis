import React, { useState, useEffect } from 'react'
import { useUser } from '../../../contexts/UserContext'
import { ExpenseCharts } from './ExpenseCharts'
import { CardSkeleton } from '../../../Components/Loading'
import { getExpenses, getExpenseSummary } from '../../../services/expenseService'
import { getTurnoverStats, getFinancialInsights, getDashboardSummary } from '../../../services/projectService'
import { RefreshCw, TrendingUp, Calendar, DollarSign, ArrowRight, Lightbulb, AlertTriangle, TrendingDown, CheckCircle, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TourGuide } from '../../../Components/TourGuide/TourGuide'
import { accountsOverviewTourSteps } from '../../../Components/TourGuide/steps/accountsOverviewTourSteps'
import { PermissionGate, PageGuard } from '@/Pages/utils/permissions'
import { ExpenseCategoryLabel } from './components/ExpenseCategoryLabel'

export const AccountsOverview = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const startTourRef = React.useRef(null)
  const [summary, setSummary] = useState(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [aiInsight, setAiInsight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartPeriod, setChartPeriod] = useState('year')
  const [totalIncome, setTotalIncome] = useState(0)

  // Fetch summary cards and insights once
  const fetchOverviewData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [summaryData, insightsData, dashboardData] = await Promise.all([
        getExpenseSummary(),
        getFinancialInsights(), // Get AI insights
        getDashboardSummary() // Get dashboard income/summary
      ])
      setSummary(summaryData)
      setAiInsight(insightsData?.insight || null)
      // Income is computed from project payment history entries
      setTotalIncome(dashboardData?.totalIncome ?? dashboardData?.revenue ?? 0)
    } catch (err) {
      setError(err.message || 'Failed to load expenses')
      console.error('Error fetching expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch turnover whenever chart period changes so labels align with expense trends
  const fetchTurnoverData = async (period) => {
    try {
      setError(null)
      const turnoverData = await getTurnoverStats(period)
      setMonthlyRevenue(turnoverData || [])
    } catch (err) {
      setError(err.message || 'Failed to load turnover trend')
      console.error('Error fetching turnover trend:', err)
    }
  }

  useEffect(() => {
    fetchOverviewData()
  }, [])

  useEffect(() => {
    fetchTurnoverData(chartPeriod)
  }, [chartPeriod])

  // Use pre-fetched recent expenses from summary
  const recentExpenses = summary?.recentExpenses || []

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB')
  }

  // Export expenses to CSV - Fetches all expenses on demand
  const handleExportCSV = async () => {
    try {
      const expenses = await getExpenses()
      if (!expenses || expenses.length === 0) {
        alert('No expenses to export')
        return
      }

      // CSV headers
      const headers = ['Date', 'Description', 'Category', 'Amount', 'Project', 'Assigned Crew']

      // CSV rows
      const rows = expenses.map(expense => {
        // Extract project name - handle both populated and string ID
        const projectName = expense.projectId?.projectTitle || expense.projectId || 'N/A'

        // Extract crew member name - handle both populated and string ID
        const crewName = expense.assignedCrew?.name || expense.assignedCrew || 'N/A'

        return [
          formatDate(expense.date),
          expense.description,
          expense.category,
          expense.amount,
          projectName,
          crewName
        ]
      })

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Export failed:", err)
      alert("Failed to export expenses")
    }
  }

  if (loading && !summary) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen'>
        <div className='mx-auto' style={{ maxWidth: '1800px' }}>
          <div className='mb-6'>
            <div className='h-8 w-48 bg-gray-200 rounded animate-pulse mb-2'></div>
            <div className='h-4 w-64 bg-gray-200 rounded animate-pulse'></div>
          </div>
          <CardSkeleton count={4} layout='grid' />
        </div>
      </div>
    )
  }

  return (
    <PageGuard page="6">
      <div className='p-6 lg:pl-4 bg-gray-50 min-h-screen'>
        <TourGuide
          steps={accountsOverviewTourSteps}
          tourKey="accounts-overview-tour"
          autoStart={false}
          onStartTour={(startFn) => { startTourRef.current = startFn; }}
        />
        <div className='mx-auto space-y-6' style={{ maxWidth: '1800px' }}>
          {/* Header */}
          <div id="accounts-overview-header" className='flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold text-primary-dark mb-1'>
                  Accounts Overview
                </h1>
                <button
                  onClick={() => startTourRef.current?.()}
                  className='text-primary-dark/60 hover:text-primary-dark transition-colors'
                  title="Start Page Tour"
                >
                  <Lightbulb size={18} />
                </button>
              </div>
              <p className='text-sm text-gray-600 mt-1'>
                Your financial summary and expense analytics
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={() => navigate('/accounts/expenses')}
                className='flex items-center gap-2 px-5 py-2.5 bg-primary-dark text-white rounded-lg text-sm font-medium hover:bg-primary-dark/90 transition-colors shadow-sm'
              >
                View All Expenses
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
              {error}
            </div>
          )}

          {/* AI Financial Insights - Commented out as requested */}
          {/* {!loading && aiInsight && (
          <div className={`rounded-xl border-2 p-5 flex items-start gap-4 transition-all hover:shadow-lg ${aiInsight.color === 'red' ? 'bg-red-50 border-red-200' :
            aiInsight.color === 'amber' ? 'bg-amber-50 border-amber-200' :
              aiInsight.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                'bg-emerald-50 border-emerald-200'
            }`}>
            <div className={`p-3 rounded-xl ${aiInsight.color === 'red' ? 'bg-red-100' :
              aiInsight.color === 'amber' ? 'bg-amber-100' :
                aiInsight.color === 'blue' ? 'bg-blue-100' :
                  'bg-emerald-100'
              }`}>
              {aiInsight.icon === 'alert-triangle' && <AlertTriangle className={`${aiInsight.color === 'red' ? 'text-red-600' :
                aiInsight.color === 'amber' ? 'text-amber-600' :
                  'text-blue-600'
                }`} size={24} />}
              {aiInsight.icon === 'trending-up' && <TrendingUp className={`${aiInsight.color === 'red' ? 'text-red-600' :
                aiInsight.color === 'amber' ? 'text-amber-600' :
                  aiInsight.color === 'blue' ? 'text-blue-600' :
                    'text-emerald-600'
                }`} size={24} />}
              {aiInsight.icon === 'trending-down' && <TrendingDown className='text-emerald-600' size={24} />}
              {aiInsight.icon === 'lightbulb' && <Lightbulb className={`${aiInsight.color === 'blue' ? 'text-blue-600' : 'text-emerald-600'
                }`} size={24} />}
              {aiInsight.icon === 'alert-circle' && <AlertTriangle className='text-red-600' size={24} />}
              {aiInsight.icon === 'check-circle' && <CheckCircle className='text-blue-600' size={24} />}
              {aiInsight.icon === 'activity' && <Activity className='text-amber-600' size={24} />}
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <Lightbulb className='text-purple-600' size={18} />
                <span className='text-xs font-black text-primary-dark uppercase tracking-wider'>
                  AI Financial Insight
                </span>
              </div>
              <p className={`text-sm font-medium leading-relaxed ${aiInsight.color === 'red' ? 'text-red-900' :
                aiInsight.color === 'amber' ? 'text-amber-900' :
                  aiInsight.color === 'blue' ? 'text-blue-900' :
                    'text-emerald-900'
                }`}>
                {aiInsight.message}
              </p>
              {aiInsight.action && (
                <button
                  onClick={() => navigate(aiInsight.link)}
                  className={`mt-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all ${aiInsight.color === 'red' ? 'text-red-700' :
                    aiInsight.color === 'amber' ? 'text-amber-700' :
                      aiInsight.color === 'blue' ? 'text-blue-700' :
                        'text-emerald-700'
                    }`}
                >
                  {aiInsight.action}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )} */}
          {/* Charts Period Filter */}
          <div id="financial-charts-section" className='relative bg-white rounded-xl border border-gray-200 p-4'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <h2 className='text-lg font-semibold text-gray-900'>Financial Charts</h2>
              <div className='relative w-full sm:w-60'>
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-dark focus:border-transparent bg-white'
                >
                  <option value='week'>Week</option>
                  <option value='month'>Month</option>
                  <option value='year'>Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Charts and Metrics */}
          <ExpenseCharts
            summary={summary}
            monthlyRevenue={monthlyRevenue}
            chartPeriod={chartPeriod}
            totalIncome={totalIncome}
            onViewAllExpenses={() => navigate('/accounts/expenses')}
          />

          {/* Recent Expenses Card */}
          <div id="recent-expenses-card" className='bg-white rounded-xl border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-bold text-primary-dark'>Recent Expenses</h3>
              <button
                onClick={() => navigate('/accounts/expenses')}
                className='text-sm text-primary-dark hover:text-primary-dark/80 font-medium flex items-center gap-1'
              >
                View all
                <ArrowRight size={16} />
              </button>
            </div>

            {recentExpenses.length === 0 ? (
              <div className='text-center py-8'>
                <DollarSign size={48} className='mx-auto text-gray-400 mb-4' />
                <p className='text-gray-600'>No expenses to display</p>
                <PermissionGate page="6" component="6_1" action="edit">
                  <button
                    onClick={() => navigate('/accounts/expenses')}
                    className='mt-4 px-4 py-2 bg-primary-dark text-white rounded-lg text-sm hover:bg-primary-dark/90 transition-colors'
                  >
                    Add Your First Expense
                  </button>
                </PermissionGate>
              </div>
            ) : (
              <div className='space-y-3'>
                {recentExpenses.map((expense, index) => (
                  <div
                    key={expense._id}
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-primary-light/30'
                      }`}
                    onClick={() => navigate('/accounts/expenses')}
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-3'>
                        <div className='text-sm font-medium text-gray-900'>
                          {expense.description}
                        </div>
                        <ExpenseCategoryLabel category={expense.category} />
                      </div>
                      <div className='text-xs text-gray-500 mt-1 flex items-center gap-1'>
                        <Calendar size={12} />
                        {formatDate(expense.date)}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-bold text-gray-900'>
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div id="quick-actions-grid" className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <button
              onClick={() => navigate('/accounts/expenses')}
              className='bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-md transition-shadow group'
            >
              <div className='flex items-center justify-between mb-3'>
                <div className='p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors'>
                  <DollarSign size={24} className='text-blue-600' />
                </div>
                <ArrowRight size={20} className='text-gray-400 group-hover:text-primary-dark transition-colors' />
              </div>
              <h4 className='font-semibold text-gray-900 mb-1'>Manage Expenses</h4>
              <p className='text-sm text-gray-600'>Add, edit, or delete expense entries</p>
            </button>

            <button
              onClick={() => navigate('/accounts/profit-loss')}
              className='bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-md transition-shadow group'
            >
              <div className='flex items-center justify-between mb-3'>
                <div className='p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors'>
                  <TrendingUp size={24} className='text-green-600' />
                </div>
                <ArrowRight size={20} className='text-gray-400 group-hover:text-primary-dark transition-colors' />
              </div>
              <h4 className='font-semibold text-gray-900 mb-1'>Profit & Loss</h4>
              <p className='text-sm text-gray-600'>View financial summary and profit breakdown</p>
            </button>

            <button
              onClick={handleExportCSV}
              className='bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-md transition-shadow group'
            >
              <div className='flex items-center justify-between mb-3'>
                <div className='p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors'>
                  <Calendar size={24} className='text-purple-600' />
                </div>
                <ArrowRight size={20} className='text-gray-400 group-hover:text-primary-dark transition-colors' />
              </div>
              <h4 className='font-semibold text-gray-900 mb-1'>Export Reports</h4>
              <p className='text-sm text-gray-600'>Download expense reports as CSV</p>
            </button>

            <button
              onClick={() => navigate('/accounts/paymentdues')}
              className='bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-md transition-shadow group'
            >
              <div className='flex items-center justify-between mb-3'>
                <div className='p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors'>
                  <AlertTriangle size={24} className='text-red-600' />
                </div>
                <ArrowRight size={20} className='text-gray-400 group-hover:text-primary-dark transition-colors' />
              </div>
              <h4 className='font-semibold text-gray-900 mb-1'>Payment Dues</h4>
              <p className='text-sm text-gray-600'>Track unpaid and overdue payments</p>
            </button>
          </div>
        </div>
      </div>
    </PageGuard>
  )
}










