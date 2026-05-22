import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export const ExpenseCharts = ({ monthlyRevenue = [], chartPeriod = 'year', totalIncome = 0, onViewAllExpenses, summary }) => {
  const stats = useMemo(() => {
    const periodLabels = {
      week: ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'],
      month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      year: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }

    const normalizeLabel = (label) => {
      if (!label) return ''
      if (label === 'Tue') return 'Tues'
      if (label === 'Thu') return 'Thur'
      return label
    }

    const labels = periodLabels[chartPeriod] || periodLabels.year

    // If summary data is provided from backend, use it directly
    if (summary) {
      const { total, thisMonth, lastMonth, categoryBreakdown, trends, count } = summary

      // Map backend trends for the selected period to chart format
      const periodTrends = trends[chartPeriod] || trends['year'] || []

      const expenseLookup = new Map(
        periodTrends.map((trend) => [normalizeLabel(trend.month), Number(trend.amount || 0)])
      )

      const incomeLookup = new Map(
        monthlyRevenue.map((revenue) => {
          const label = normalizeLabel(revenue.label || revenue.month)
          return [label, Number(revenue.amount || revenue.value || revenue.revenue || 0)]
        })
      )

      const trendData = labels.map((label) => ({
        month: label,
        expense: expenseLookup.get(label) || 0,
        income: incomeLookup.get(label) || 0
      }))

      // Calculate percentage change
      const changePercent = lastMonth === 0
        ? (thisMonth > 0 ? 100 : 0)
        : ((thisMonth - lastMonth) / lastMonth) * 100

      return {
        total,
        thisMonth,
        lastMonth,
        changePercent,
        categoryBreakdown: categoryBreakdown.map(c => ({
          ...c,
          percentage: total > 0 ? (c.amount / total) * 100 : 0
        })),
        monthlyTrend: trendData,
        totalExpenses: count
      }
    }

    return {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      changePercent: 0,
      categoryBreakdown: [],
      monthlyTrend: labels.map((label) => ({
        month: label,
        expense: 0,
        income: 0
      })),
      totalExpenses: 0
    }
  }, [summary, monthlyRevenue, chartPeriod])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getCategoryColor = (index) => {
    const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']
    return colors[index % colors.length]
  }


  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div id="accounts-summary-cards" className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {/* Total Expenses */}
        <div className='bg-white rounded-xl border border-gray-200 p-5'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-sm font-medium text-gray-600'>Total Expenses</span>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <DollarSign size={18} className='text-blue-600' />
            </div>
          </div>
          <div className='text-2xl font-bold text-gray-900'>{formatCurrency(stats.total)}</div>
          <div className='text-xs text-gray-500 mt-1'>{stats.totalExpenses} transactions</div>
        </div>

        {/* Dynamic Period Card - This Week/Month/Year */}
        <div className='bg-white rounded-xl border border-gray-200 p-5'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-sm font-medium text-gray-600'>
              {chartPeriod === 'week' ? 'This Week' : chartPeriod === 'month' ? 'This Month' : 'This Year'}
            </span>
            <div className='p-2 bg-green-50 rounded-lg'>
              <TrendingUp size={18} className='text-green-600' />
            </div>
          </div>
          <div className='text-2xl font-bold text-gray-900'>{formatCurrency(stats.thisMonth)}</div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${stats.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(stats.changePercent).toFixed(1)}% from last {chartPeriod === 'week' ? 'week' : chartPeriod === 'month' ? 'month' : 'year'}
          </div>
        </div>

        {/* Average Transaction Value */}
        <div className='bg-white rounded-xl border border-gray-200 p-5'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-sm font-medium text-gray-600'>Average Expense Value</span>
            <div className='p-2 bg-orange-50 rounded-lg'>
              <PieChartIcon size={18} className='text-orange-600' />
            </div>
          </div>
          <div className='text-2xl font-bold text-gray-900'>
            {formatCurrency(stats.totalExpenses > 0 ? stats.total / stats.totalExpenses : 0)}
          </div>
        </div>

        {/* Total Income */}
        <div className='bg-white rounded-xl border border-gray-200 p-5'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-sm font-medium text-gray-600'>Total Income</span>
            <div className='p-2 bg-purple-50 rounded-lg'>
              <DollarSign size={18} className='text-purple-600' />
            </div>
          </div>
          <div className='text-2xl font-bold text-gray-900'>{formatCurrency(totalIncome)}</div>
          <div className='text-xs text-gray-500 mt-1'>From payment history</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Summary Bar Chart */}
        <div id="accounts-revenue-chart" className='bg-white rounded-xl border border-gray-200 p-6'>
          <h3 className='text-lg font-bold text-gray-900 mb-6'>Summary</h3>
          {stats.monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} minHeight={300}>
              <BarChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [formatCurrency(value), name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="income" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} name="Income" />
                <Bar dataKey="expense" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center text-gray-400' style={{ height: '300px' }}>
              No data available
            </div>
          )}
        </div>

        {/* Expenses Pie Chart */}
        <div id="accounts-expenses-pie" className='bg-white rounded-xl border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-bold text-gray-900'>Expenses</h3>
            {onViewAllExpenses && (
              <button
                onClick={onViewAllExpenses}
                className='text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline'
              >
                More →
              </button>
            )}
          </div>
          {stats.categoryBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250} minHeight={250}>
                <PieChart>
                  <Pie
                    data={stats.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="amount"
                    label={false}
                    labelLine={false}
                    strokeWidth={0}
                  >
                    {stats.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(index)} stroke="transparent" strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend below the pie chart */}
              <div className='mt-4 space-y-2'>
                {stats.categoryBreakdown.map((cat, index) => (
                  <div key={index} className='flex items-center justify-between text-sm p-2 bg-gray-50 rounded'>
                    <div className='flex items-center gap-2'>
                      <div
                        className='w-4 h-4 rounded'
                        style={{ backgroundColor: getCategoryColor(index) }}
                      />
                      <span className='text-gray-900 font-medium'>{cat.category}</span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='text-gray-700 font-semibold'>{formatCurrency(cat.amount)}</span>
                      <span className='text-gray-500 text-xs'>{cat.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className='flex items-center justify-center text-gray-400' style={{ height: '300px' }}>
              No expenses to display
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

