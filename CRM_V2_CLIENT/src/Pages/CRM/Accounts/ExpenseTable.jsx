import React from 'react'
import { Edit2, Trash2, DollarSign } from 'lucide-react'
import { PermissionGate } from '@/Pages/utils/permissions'
import { ExpenseCategoryLabel } from './components/ExpenseCategoryLabel'

export const ExpenseTable = ({ expenses, onEdit, onDelete }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (expenses.length === 0) {
    return (
      <div className='bg-white rounded-xl border border-gray-200 p-12 text-center'>
        <DollarSign size={48} className='mx-auto text-gray-400 mb-4' />
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>No expenses yet</h3>
        <p className='text-gray-600 mb-4'>Start tracking your expenses by adding your first entry</p>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Date
              </th>
              <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Project
              </th>
              <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Assigned To
              </th>
              <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Category
              </th>
              <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Description
              </th>
              <th className='px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Amount
              </th>
              <th className='px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {expenses.map((expense, index) => (
              <tr
                key={expense._id}
                className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-primary-light/30'
                  }`}
              >
                <td className='px-4 py-3 text-sm text-gray-900'>
                  {formatDate(expense.date)}
                </td>
                <td className='px-4 py-3 text-sm text-gray-700 font-medium'>
                  {expense.project?.projectTitle || expense.projectId?.projectTitle || '-'}
                </td>
                <td className='px-4 py-3 text-sm text-gray-700'>
                  {expense.assignedCrew ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-dark/10 text-primary-dark flex items-center justify-center text-xs font-bold">
                        {expense.assignedCrew.name?.[0] || 'U'}
                      </div>
                      <span>{expense.assignedCrew.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className='px-4 py-3'>
                  <ExpenseCategoryLabel category={expense.category} />
                </td>
                <td className='px-4 py-3 text-sm text-gray-700 max-w-md truncate'>
                  {expense.description}
                </td>
                <td className='px-4 py-3 text-sm font-semibold text-gray-900 text-right'>
                  {formatCurrency(expense.amount)}
                </td>
                <td className='px-4 py-3 text-right'>
                  <div className='flex items-center justify-end gap-2'>
                    <PermissionGate page="6" component="6_1" action="edit">
                      <button
                        onClick={() => onEdit(expense)}
                        className='p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                        title='Edit expense'
                      >
                        <Edit2 size={16} />
                      </button>
                    </PermissionGate>
                    <PermissionGate page="6" component="6_1" action="edit">
                      <button
                        onClick={() => onDelete(expense._id)}
                        className='p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title='Delete expense'
                      >
                        <Trash2 size={16} />
                      </button>
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

