import React from 'react'
import { Search, Download } from 'lucide-react'
import { PermissionGate } from '@/Pages/utils/permissions'

export const ClientFilters = ({
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
  onExport
}) => {
  return (
    <div id="clients-filter-search" className='bg-white rounded-xl shadow-sm border border-gray-200 mb-6'>
      {/* Filter Bar */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex flex-wrap items-center gap-3'>
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className='min-w-[140px] px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-dark cursor-pointer'
          >
            <option value='All'>All Clients</option>
            <option value='Ongoing'>Ongoing</option>
            <option value='Completed'>Completed</option>
          </select>

          {/* Divider */}
          <div className='h-8 w-px bg-gray-300' />

          {/* Export Button */}
          <PermissionGate page="4" component="4_1" action="edit">
          <button
            onClick={onExport}
            className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50'
          >
            <Download size={16} />
            Export
          </button>
          </PermissionGate>

          {/* Spacer */}
          <div className='flex-1' />

          {/* Results Count */}
          <div className='text-sm text-gray-600'>
            <span>
              Showing <span className='font-semibold'>{filteredCount}</span> of{' '}
              <span className='font-semibold'>{totalCount}</span> clients
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className='p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
          <input
            type='text'
            placeholder='Search clients by name, company, or email...'
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent'
          />
        </div>
      </div>
    </div>
  )
}

