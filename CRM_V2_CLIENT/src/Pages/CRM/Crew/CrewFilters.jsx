import React, { useState, useRef, useEffect } from 'react';

/**
 * Filter component for Crew management
 * Provides search, position filter, and role filter (for staff)
 */
export const CrewFilters = ({ filters, onFilterChange, positions, roles, showRoleFilter = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Count active filters (excluding search and 'all' values)
  const activeFiltersCount = [
    filters.position && filters.position !== '',
    showRoleFilter && filters.role && filters.role !== ''
  ].filter(Boolean).length;

  return (
    <div className='mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4'>
      {/* Search Bar */}
      <div id="crew-search-filter" className='flex-1'>
        <div className='relative'>
          <input
            type='text'
            placeholder='Search by name, email, or position...'
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className='w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all'
          />
          <svg
            className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
      </div>

      {/* Filters Dropdown */}
      <div id="crew-filter-dropdown" className='relative' ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white w-full sm:w-auto'
        >
          <svg className='w-4 h-4 sm:w-5 sm:h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' />
          </svg>
          <span className='text-xs sm:text-sm font-medium text-gray-700'>Filters</span>
          {activeFiltersCount > 0 && (
            <span className='ml-1 px-2 py-0.5 bg-primary-dark text-white text-xs font-semibold rounded-full'>
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className='absolute right-0 top-full mt-2 w-[280px] sm:w-[320px] bg-white rounded-lg shadow-xl border border-gray-200 z-50'>
            <div className='p-4 space-y-4'>
              {/* Position Filter */}
              <div>
                <label className='block text-sm font-medium text-primary-dark mb-2'>
                  Position
                </label>
                <select
                  value={filters.position}
                  onChange={(e) => onFilterChange('position', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all text-sm'
                >
                  <option value=''>All Positions</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter (Staff only) */}
              {showRoleFilter && (
                <div>
                  <label className='block text-sm font-medium text-primary-dark mb-2'>
                    Role
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => onFilterChange('role', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all text-sm'
                  >
                    <option value=''>All Roles</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reset Button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => onFilterChange('reset')}
                  className='w-full px-3 py-2 text-sm font-medium text-primary-dark hover:bg-primary-light/20 rounded-lg transition-colors'
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

