import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Calendar, Layers, Clock, Lightbulb, TrendingDown, AlertTriangle, TrendingUp, CheckCircle, DollarSign, ChevronDown, Filter } from 'lucide-react'
import { getProfitLossStats } from '../../../services/projectService'
import { CardSkeleton } from '../../../Components/Loading'
import { TourGuide } from '../../../Components/TourGuide/TourGuide'
import { profitLossTourSteps } from '../../../Components/TourGuide/steps/profitLossTourSteps'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export const ProfitLoss = () => {
    const navigate = useNavigate()
    const startTourRef = React.useRef(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState([])
    const [view, setView] = useState(() => localStorage.getItem('profitLossView') || 'monthly') // 'monthly', 'weekly', 'project', 'custom'
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState('All')
    const [error, setError] = useState(null)
    const [customDateRange, setCustomDateRange] = useState([null, null])

    const fetchData = async (currentView = view, year = selectedYear) => {
        try {
            setLoading(true)
            setError(null)
            let data
            if (currentView === 'custom' && customDateRange[0] && customDateRange[1]) {
                data = await getProfitLossStats('custom', null, customDateRange[0].format('YYYY-MM-DD'), customDateRange[1].format('YYYY-MM-DD'))
            } else {
                data = await getProfitLossStats(currentView, year)
            }
            setStats(data || [])
        } catch (err) {
            setError(err.message || 'Failed to load Profit & Loss data')
            console.error('Error fetching P&L data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (view === 'custom') {
            if (customDateRange[0] && customDateRange[1]) {
                fetchData('custom')
            }
        } else {
            fetchData(view, selectedYear)
        }
        localStorage.setItem('profitLossView', view)
    }, [view, selectedYear, customDateRange])

    const displayedStats = useMemo(() => {
        if (view === 'monthly' && selectedMonth !== 'All') {
            const mIdx = parseInt(selectedMonth)
            return stats.filter((_, i) => i === mIdx)
        }
        return stats
    }, [stats, view, selectedMonth])

    // Calculate overall financial data
    const financialData = useMemo(() => {
        if (!displayedStats || !Array.isArray(displayedStats) || displayedStats.length === 0) {
            return {
                totalBudget: 0,
                totalExpenses: 0,
                profit: 0,
                profitMargin: 0,
                expensePercent: 0,
                totals: {
                    totalBudget: 0,
                    paidPayments: 0,
                    expenses: 0,
                    exactProfit: 0,
                    overduePayments: 0,
                    upcomingPayments: 0,
                    expectedProfit: 0
                }
            }
        }

        const totals = {
            totalBudget: displayedStats.reduce((sum, m) => sum + (m.totalBudget || 0), 0),
            paidPayments: displayedStats.reduce((sum, m) => sum + m.paidPayments, 0),
            expenses: displayedStats.reduce((sum, m) => sum + m.expenses, 0),
            overduePayments: displayedStats.reduce((sum, m) => sum + m.overduePayments, 0),
            upcomingPayments: displayedStats.reduce((sum, m) => sum + (m.upcomingPayments || 0), 0),
            exactProfit: 0,
            realizedProfit: 0
        }

        // Use backend calculated profit values for overall totals
        totals.exactProfit = displayedStats.reduce((sum, m) => sum + m.exactProfit, 0)
        totals.realizedProfit = displayedStats.reduce((sum, m) => sum + (m.realizedProfit || 0), 0)

        const profit = totals.exactProfit

        const expensePercent = totals.totalBudget > 0 ? ((totals.expenses / totals.totalBudget) * 100).toFixed(1) : 0
        const profitPercent = totals.totalBudget > 0 ? ((profit / totals.totalBudget) * 100).toFixed(1) : 0

        return {
            totalBudget: totals.totalBudget,
            totalExpenses: totals.expenses,
            profit,
            expensePercent,
            profitPercent,
            totals
        }
    }, [displayedStats])

    // Helper function for currency formatting
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '-';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    // AI Insights Generator - Pure data-driven, no static rules
    const insights = useMemo(() => {
        const totalRevenueBase = Number(financialData.totalBudget) || 0
        if (!displayedStats.length || totalRevenueBase === 0) return []

        const contextualInsights = []

        // Critical: Operating at a Loss
        if (financialData.profit < 0) {
            contextualInsights.push({
                type: 'critical',
                icon: AlertTriangle,
                message: `Loss of ${formatCurrency(Math.abs(financialData.profit))} detected. Review ${view} breakdown to identify high-expense periods.`,
                color: 'red',
                priority: 1
            })
        }

        // High Overdue/Pending Payments
        const totalUnpaid = (financialData.totals.overduePayments || 0) + (financialData.totals.upcomingPayments || 0)
        const overdueRatio = (totalUnpaid / totalRevenueBase) * 100
        if (totalUnpaid > 0 && overdueRatio > 10) {
            contextualInsights.push({
                type: 'warning',
                icon: AlertTriangle,
                message: `${formatCurrency(totalUnpaid)} overdue/pending. ${view === 'project' ? 'Check project-wise collection status' : 'Prioritize collections'}.`,
                color: 'amber',
                priority: 2
            })
        }

        // Healthy Performance Recognition
        const profitMargin = (financialData.profit / totalRevenueBase) * 100
        if (profitMargin >= 30 && overdueRatio < 10) {
            contextualInsights.push({
                type: 'success',
                icon: Lightbulb,
                message: `Strong ${Math.round(profitMargin)}% margin in ${view} view. ${view === 'project' ? 'Replicate successful project strategies' : 'Maintain this trajectory'}.`,
                color: 'emerald',
                priority: 5
            })
        }

        // Remaining Expected Profit Analysis
        if (financialData.totals.totalBudget > 0 && financialData.totals.exactProfit > 0) {
            contextualInsights.push({
                type: 'info',
                icon: Layers,
                message: `Projected profit of ${formatCurrency(financialData.totals.exactProfit)} based on budgets vs expenses. Execute scheduled payments to realize this view.`,
                color: 'blue',
                priority: 3
            })
        }

        return contextualInsights.sort((a, b) => a.priority - b.priority).slice(0, 2)
    }, [financialData.totals, financialData.profit, view, displayedStats])

    // Calculate KPI Metrics for dashboard based on user formulas
    const kpiMetrics = useMemo(() => {
        if (!displayedStats || displayedStats.length === 0) return {
            profitMargin: 0,
            collectionRate: 0,
            avgProjectValue: 0,
            activeProjects: 0
        }

        const totals = financialData.totals
        
        // 1. Expected Profit Margin = (Expected Profit / Total Budget) * 100
        const profitMargin = totals.totalBudget > 0 
            ? Math.round((totals.exactProfit / totals.totalBudget) * 100) 
            : 0

        // 2. Collection Rate = (Paid / (Paid + Overdue)) * 100
        const collectionRate = (totals.paidPayments + totals.overduePayments) > 0
            ? Math.round((totals.paidPayments / (totals.paidPayments + totals.overduePayments)) * 100)
            : 0

        // 3. Avg Project/Period Value
        const periodsWithRevenue = displayedStats.filter(s => (s.totalBudget || 0) > 0).length
        const avgProjectValue = periodsWithRevenue > 0
            ? Math.round(totals.totalBudget / periodsWithRevenue)
            : 0

        // 4. Active Projects/Periods = Simple count of periods/projects with revenue
        const activeProjects = displayedStats.filter(s => (s.totalBudget || 0) > 0).length

        return {
            profitMargin,
            collectionRate,
            avgProjectValue,
            activeProjects
        }
    }, [displayedStats, financialData.totals, view])

    const viewOptions = [
        { id: 'monthly', label: 'Monthly', icon: Calendar },
        { id: 'weekly', label: 'Weekly', icon: Clock },
        { id: 'project', label: 'Project-wise', icon: Layers },
        { id: 'custom', label: 'Custom', icon: Filter }
    ]

    const breakdownTitleByView = {
        monthly: 'Monthly Financial Breakdown',
        weekly: 'Weekly Financial Breakdown',
        project: 'Project-wise Financial Breakdown',
        custom: 'Custom Date Range Breakdown'
    }
    const normalizedView = String(view || '').trim().toLowerCase()
    const resolvedView = normalizedView.includes('project')
        ? 'project'
        : normalizedView.includes('week')
            ? 'weekly'
            : normalizedView.includes('custom')
                ? 'custom'
                : 'monthly'
    const breakdownTitle = breakdownTitleByView[resolvedView]

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900 p-4 md:p-8 lg:pl-4'>
            <TourGuide 
              steps={profitLossTourSteps} 
              tourKey="accounts-profit-loss-tour"
              autoStart={false} 
              onStartTour={(startFn) => { startTourRef.current = startFn; }}
            />
            {/* Enhanced Header */}
            <div id="profit-loss-header" className='mb-8'>
                {/* Breadcrumb and Title Row */}
                <div className='flex items-center gap-3 mb-6'>
                    <div className='flex-1 flex items-center gap-2'>
                        <h1 className='text-2xl font-bold text-primary-dark mb-1'>Profit & Loss Dashboard</h1>
                        <button 
                          onClick={() => startTourRef.current?.()} 
                          className='text-primary-dark/60 hover:text-primary-dark transition-colors'
                          title="Start Page Tour"
                        >
                          <Lightbulb size={20} />
                        </button>
                    </div>
                </div>

                {/* Controls Row */}
                <div className='flex flex-wrap items-center gap-4'>
                    {/* View Switcher */}
                    <div id="view-switcher" className='flex items-center bg-white border-2 border-gray-100 rounded-2xl p-1.5 shadow-sm'>
                        {viewOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setView(opt.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${view === opt.id
                                    ? 'bg-primary-dark text-white shadow-lg scale-105'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-dark'
                                    }`}
                            >
                                <opt.icon size={18} />
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Range Picker */}
                    {view === 'custom' && (
                        <div className='flex items-center bg-white border-2 border-gray-100 rounded-2xl p-1.5 shadow-sm'>
                            <RangePicker
                                value={customDateRange[0] && customDateRange[1] ? [customDateRange[0], customDateRange[1]] : null}
                                onChange={(dates) => {
                                    setCustomDateRange(dates || [null, null])
                                }}
                                format="DD MMM YYYY"
                                allowClear
                                className='border-0 shadow-none'
                                style={{ minWidth: 280 }}
                                placeholder={['Start Date', 'End Date']}
                            />
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2'>
                    <span className='font-medium'>Error:</span> {error}
                </div>
            )}

            {/* Summary Section */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-stretch'>
                {/* Left - Summary Data */}
                <div id="summary-section" className='lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-10 shadow-sm relative overflow-hidden flex flex-col justify-center'>
                    {/* Background Decorative Element */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                    <div className='space-y-10 relative z-10'>
                        <div className='flex items-center justify-between max-w-2xl'>
                            <div className="flex flex-col">
                                <span className='text-xs font-black text-gray-400 uppercase tracking-widest mb-1'>Project Budgets</span>
                                <span className='text-base font-bold text-gray-500'>Total Revenue</span>
                            </div>
                            <span className='text-3xl font-bold text-gray-900 tabular-nums'>
                                {formatCurrency(financialData.totalBudget)}
                            </span>
                        </div>

                        <div className='flex items-center justify-between max-w-2xl'>
                            <div className="flex flex-col">
                                <span className='text-xs font-black text-gray-400 uppercase tracking-widest mb-1'>My Expenses</span>
                                <div className='flex items-center gap-3 mt-1'>
                                    <div className='flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black uppercase tracking-wider'>
                                        {financialData.expensePercent}% of Total
                                    </div>
                                </div>
                            </div>
                            <span className='text-3xl font-bold text-gray-900 tabular-nums'>
                                {formatCurrency(financialData.totalExpenses)}
                            </span>
                        </div>

                        <div className='pt-8 border-t border-gray-100 flex items-center justify-between max-w-2xl'>
                            <div className="flex flex-col">
                                <span className='text-xs font-black text-primary-dark uppercase tracking-widest mb-1'>Net Profit</span>
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 ${financialData.profit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'} rounded-md text-[10px] font-black uppercase tracking-wider mt-1`}>
                                    {financialData.profitPercent}% Margin
                                </div>
                            </div>
                            <span className={`text-5xl font-black tabular-nums tracking-tight ${financialData.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {formatCurrency(financialData.profit)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right - KPI Dashboard */}
                <div id="kpi-dashboard" className='lg:col-span-4 bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
                    <h3 className='text-sm font-bold text-primary-dark uppercase tracking-wider mb-6'>Key Performance Metrics</h3>

                    {/* KPI Grid - 2x2 */}
                    <div className='grid grid-cols-2 gap-4'>
                        {/* Profit Margin */}
                        <div className='bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200'>
                            <div className='flex items-center justify-center mb-2'>
                                <div className='p-2 bg-emerald-100 rounded-lg'>
                                    <TrendingUp className='text-emerald-600' size={20} />
                                </div>
                            </div>
                            <div className='text-center'>
                                <div className='text-2xl font-black text-gray-900 mb-1'>
                                    {kpiMetrics.profitMargin}%
                                </div>
                                <div className='text-xs font-medium text-gray-600'>Profit Margin</div>
                            </div>
                        </div>

                        {/* Collection Rate */}
                        <div className='bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200'>
                            <div className='flex items-center justify-center mb-2'>
                                <div className='p-2 bg-blue-100 rounded-lg'>
                                    <CheckCircle className='text-blue-600' size={20} />
                                </div>
                            </div>
                            <div className='text-center'>
                                <div className='text-2xl font-black text-gray-900 mb-1'>
                                    {kpiMetrics.collectionRate}%
                                </div>
                                <div className='text-xs font-medium text-gray-600'>Collection Rate</div>
                            </div>
                        </div>

                        {/* Avg Project Value */}
                        <div className='bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200'>
                            <div className='flex items-center justify-center mb-2'>
                                <div className='p-2 bg-purple-100 rounded-lg'>
                                    <DollarSign className='text-purple-600' size={20} />
                                </div>
                            </div>
                            <div className='text-center'>
                                <div className='text-xl font-black text-gray-900 mb-1'>
                                    {formatCurrency(kpiMetrics.avgProjectValue)}
                                </div>
                                <div className='text-xs font-medium text-gray-600'>Avg {view === 'project' ? 'Project' : 'Period'} Value</div>
                            </div>
                        </div>

                        {/* Active Count */}
                        <div className='bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-200'>
                            <div className='flex items-center justify-center mb-2'>
                                <div className='p-2 bg-orange-100 rounded-lg'>
                                    <Layers className='text-orange-600' size={20} />
                                </div>
                            </div>
                            <div className='text-center'>
                                <div className='text-2xl font-black text-gray-900 mb-1'>
                                    {kpiMetrics.activeProjects}
                                </div>
                                <div className='text-xs font-medium text-gray-600'>Active {view === 'project' ? 'Projects' : 'Periods (w/ Revenue)'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <CardSkeleton count={1} />
            ) : (
                <div id="breakdown-table" className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
                    {/* Enhanced Table Header with Dropdown Toggle */}
                    <div className='bg-primary-dark px-8 py-5'>
                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                            <div className='flex items-center gap-3 text-left'>
                                <div className='flex-1'>
                                    <h2 className='text-2xl font-semibold text-white mb-1'>{breakdownTitle}</h2>
                                    <p className='text-sm text-white/80'>Detailed period-wise analysis</p>
                                </div>
                            </div>

                            {/* Year Dropdown */}
                            <div className='relative flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors'>
                                <Calendar size={18} className='text-white/90' />
                                <span className='text-sm text-white/90 font-medium'>Year</span>
                                <div className="relative">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className='appearance-none text-sm text-white bg-transparent outline-none cursor-pointer border-l border-white/30 pl-3 pr-8 w-[80px]'
                                    >
                                        {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                                            <option key={year} value={year} className='text-gray-900 bg-white'>{year}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className='absolute right-2 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none' />
                                </div>
                            </div>
                            
                            {/* Month Dropdown for Monthly View */}
                            {view === 'monthly' && (
                                <div className='relative flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors ml-3'>
                                    <Filter size={18} className='text-white/90' />
                                    <span className='text-sm text-white/90 font-medium'>Month</span>
                                    <div className="relative">
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className='appearance-none text-sm text-white bg-transparent outline-none cursor-pointer border-l border-white/30 pl-3 pr-8 w-[100px]'
                                        >
                                            <option value="All" className='text-gray-900 bg-white'>All Months</option>
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                                                <option key={idx} value={idx} className='text-gray-900 bg-white'>{month}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className='absolute right-2 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none' />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='overflow-x-auto relative'>
                            <table className='w-full min-w-[1000px]'>
                            <thead>
                                <tr className='bg-gradient-to-r from-gray-800 to-gray-700'>
                                    <th className='sticky left-0 z-20 px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-widest bg-gray-800 min-w-[280px] border-r border-gray-600'>
                                        Metric
                                    </th>
                                    <th className='sticky left-[280px] z-20 px-6 py-4 text-right text-xs font-semibold text-yellow-300 uppercase tracking-widest bg-gray-800 min-w-[150px] border-r border-gray-600'>
                                        Total
                                    </th>
                                    {displayedStats.map((data, idx) => (
                                        <th key={idx} className='px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider bg-gray-700 min-w-[140px] border-r border-gray-600'>
                                            {data.month}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Revenue Section Header */}
                                <tr className='bg-gradient-to-r from-blue-50 to-indigo-50'>
                                    <td colSpan={displayedStats.length + 2} className='px-6 py-2'>
                                        <div className='text-xs font-medium text-blue-900 uppercase tracking-widest'>Revenue & Income</div>
                                    </td>
                                </tr>

                                {/* Project Budgets Row */}
                                <tr className='hover:bg-blue-50/30 transition-colors border-b border-gray-200'>
                                    <td className='sticky left-0 z-10 px-6 py-4 text-sm font-medium text-gray-900 bg-white border-r border-gray-300'>
                                        Project Budgets [Revenue]
                                    </td>
                                    <td className='sticky left-[280px] z-10 px-6 py-4 text-right text-base font-medium text-blue-700 tabular-nums bg-white border-r border-gray-300'>
                                        {formatCurrency(financialData.totals.totalBudget)}
                                    </td>
                                    {displayedStats.map((data, i) => (
                                        <td key={i} className='px-6 py-4 text-center text-sm text-gray-700 font-medium tabular-nums border-r border-gray-200'>
                                            {formatCurrency(data.totalBudget || 0)}
                                        </td>
                                    ))}
                                </tr>

                                {/* Expenses Section Header */}
                                <tr className='bg-gradient-to-r from-amber-50 to-orange-50'>
                                    <td colSpan={displayedStats.length + 2} className='px-6 py-2'>
                                        <div className='text-xs font-medium text-amber-900 uppercase tracking-widest'>Expenses & Costs</div>
                                    </td>
                                </tr>

                                {/* My Expenses Row */}
                                <tr className='hover:bg-amber-50/30 transition-colors border-b border-gray-200'>
                                    <td className='sticky left-0 z-10 px-6 py-4 text-sm font-medium text-gray-900 bg-white border-r border-gray-300'>
                                        My Expenses [-]
                                    </td>
                                    <td className='sticky left-[280px] z-10 px-6 py-4 text-right text-base font-medium text-amber-700 tabular-nums bg-white border-r border-gray-300'>
                                        {formatCurrency(financialData.totals.expenses)}
                                    </td>
                                    {displayedStats.map((data, i) => (
                                        <td key={i} className='px-6 py-4 text-center text-sm text-gray-700 font-medium tabular-nums border-r border-gray-200'>
                                            {formatCurrency(data.expenses)}
                                        </td>
                                    ))}
                                </tr>

                                {/* Profit Section Header */}
                                <tr className='bg-gradient-to-r from-emerald-50 to-green-50'>
                                    <td colSpan={displayedStats.length + 2} className='px-6 py-2'>
                                        <div className='text-xs font-medium text-emerald-900 uppercase tracking-widest'>Net Profit</div>
                                    </td>
                                </tr>

                                {/* Net Profit Row */}
                                <tr className='hover:bg-emerald-50/30 transition-colors border-b-2 border-emerald-200'>
                                    <td className='sticky left-0 z-10 px-6 py-4 bg-white border-r border-gray-300'>
                                        <div className='flex items-center gap-2'>
                                            <span className='text-sm font-medium text-gray-900'>Net Profit</span>
                                            <span className='text-xs text-gray-500 font-medium'>[Budget - Exp]</span>
                                        </div>
                                    </td>
                                    <td className={`sticky left-[280px] z-10 px-6 py-4 text-right text-lg font-medium tabular-nums bg-white border-r border-gray-300 ${financialData.totals.exactProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {formatCurrency(financialData.totals.exactProfit)}
                                    </td>
                                    {displayedStats.map((data, i) => {
                                        const profit = data.exactProfit;
                                        return (
                                            <td key={i} className={`px-6 py-4 text-center text-sm font-medium tabular-nums border-r border-gray-200 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {formatCurrency(profit)}
                                            </td>
                                        );
                                    })}
                                </tr>

                                {/* Cash Flow Section Header */}
                                <tr className='bg-gradient-to-r from-purple-50 to-pink-50'>
                                    <td colSpan={displayedStats.length + 2} className='px-6 py-2'>
                                        <div className='text-xs font-medium text-purple-900 uppercase tracking-widest'>Cash Flow Analysis</div>
                                    </td>
                                </tr>

                                {/* Amount Received Row */}
                                <tr className='hover:bg-purple-50/30 transition-colors border-b border-gray-200'>
                                    <td className='sticky left-0 z-10 px-6 py-4 text-sm font-medium text-gray-900 bg-white border-r border-gray-300'>
                                        Amount Received [+]
                                    </td>
                                    <td className='sticky left-[280px] z-10 px-6 py-4 text-right text-base font-medium text-purple-700 tabular-nums bg-white border-r border-gray-300'>
                                        {formatCurrency(financialData.totals.paidPayments)}
                                    </td>
                                    {displayedStats.map((data, i) => (
                                        <td key={i} className='px-6 py-4 text-center text-sm text-emerald-700 font-medium tabular-nums border-r border-gray-200'>
                                            {formatCurrency(data.paidPayments)}
                                        </td>
                                    ))}
                                </tr>

                                {/* Overdue/Pending Payment Row */}
                                <tr className='hover:bg-red-50/30 transition-colors border-b border-gray-200'>
                                    <td className='sticky left-0 z-10 px-6 py-4 text-sm font-medium text-gray-900 bg-white border-r border-gray-300'>
                                        Overdue/Pending
                                    </td>
                                    <td className='sticky left-[280px] z-10 px-6 py-4 text-right text-base font-medium text-red-700 tabular-nums bg-white border-r border-gray-300'>
                                        {formatCurrency((financialData.totals.overduePayments || 0) + (financialData.totals.upcomingPayments || 0))}
                                    </td>
                                    {displayedStats.map((data, i) => (
                                        <td key={i} className='px-6 py-4 text-center text-sm text-red-700 font-medium tabular-nums border-r border-gray-200'>
                                            {formatCurrency((data.overduePayments || 0) + (data.upcomingPayments || 0))}
                                        </td>
                                    ))}
                                </tr>

                                {/* Realized Profit Row - Final */}
                                <tr className='hover:bg-purple-50/30 transition-colors border-t-2 border-purple-300'>
                                    <td className='sticky left-0 z-10 px-6 py-4 bg-white border-r border-gray-300'>
                                        <div className='flex items-center gap-2'>
                                            <span className='text-sm font-medium text-gray-900'>Realized Profit</span>
                                            <span className='text-xs text-gray-500 font-medium'>(Cash - Exp)</span>
                                        </div>
                                    </td>
                                    <td className={`sticky left-[280px] z-10 px-6 py-4 text-right text-lg font-medium tabular-nums bg-white border-r border-gray-300 ${financialData.totals.realizedProfit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                                        {formatCurrency(financialData.totals.realizedProfit)}
                                    </td>
                                    {displayedStats.map((data, i) => (
                                        <td key={i} className={`px-6 py-4 text-center text-sm font-medium tabular-nums border-r border-gray-200 ${data.realizedProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                            {formatCurrency(data.realizedProfit || 0)}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProfitLoss
