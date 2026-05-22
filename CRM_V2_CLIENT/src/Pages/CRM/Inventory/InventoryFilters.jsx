import React, { useState, useEffect, useRef } from 'react';

/**
 * InventoryFilters Component
 * Provides search and filter controls for inventory items
 */
export const InventoryFilters = ({ filters, onFilterChange, categories }) => {
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

  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    (filters.availability !== 'all' ? 1 : 0);

  return (
    <div className='mb-6'>
      <div className='flex items-start gap-4'>
        {/* Search Bar - Always Visible */}
        <div className='flex-1'>

          <input
            id="inventory-search-input"
            type='text'
            
            placeholder='Search by item name...'
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all bg-white shadow-sm'
          />
        </div>

        {/* Filters - Collapsible on Right */}
        <div className='relative'  id="category-filter" ref={dropdownRef}>
          {/* Funnel Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className='flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm'
          >
            {/* Funnel Icon */}
            <svg
              className='w-5 h-5 text-primary-dark'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
              />
            </svg>
            <span className='font-medium text-sm text-primary-dark'>Filters</span>
            {activeFiltersCount > 0 && (
              <span className='bg-primary-dark text-white text-xs px-2 py-0.5 rounded-full'>
                {activeFiltersCount}
              </span>
            )}
            {/* Toggle Arrow */}
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''
                }`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>

          {/* Dropdown Content */}
          {isOpen && (
            <div className='absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10 w-[280px] animate-fadeIn'>
              <div className='space-y-4'>
                {/* Category Filter */}
                <div>
                  <label htmlFor='category' className='block text-xs font-semibold text-primary-dark mb-1.5'>
                    Category
                  </label>
                  <select
                    id='category'
                    value={filters.category}
                    onChange={(e) => onFilterChange('category', e.target.value)}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all bg-white'
                  >
                    <option value=''>All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                    Availability
                  </label>
                  <div className='space-y-2'>
                    <label className='flex items-center'>
                      <input
                        type='radio'
                        name='availability'
                        value='all'
                        checked={filters.availability === 'all'}
                        onChange={(e) => onFilterChange('availability', e.target.value)}
                        className='w-4 h-4 text-primary-dark focus:ring-primary-dark border-gray-300'
                      />
                      <span className='ml-2 text-sm text-gray-700'>All Items</span>
                    </label>
                    <label className='flex items-center'>
                      <input
                        type='radio'
                        name='availability'
                        value='available'
                        checked={filters.availability === 'available'}
                        onChange={(e) => onFilterChange('availability', e.target.value)}
                        className='w-4 h-4 text-primary-dark focus:ring-primary-dark border-gray-300'
                      />
                      <span className='ml-2 text-sm text-gray-700'>Available Only</span>
                    </label>
                    <label className='flex items-center'>
                      <input
                        type='radio'
                        name='availability'
                        value='unavailable'
                        checked={filters.availability === 'unavailable'}
                        onChange={(e) => onFilterChange('availability', e.target.value)}
                        className='w-4 h-4 text-primary-dark focus:ring-primary-dark border-gray-300'
                      />
                      <span className='ml-2 text-sm text-gray-700'>Unavailable Only</span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => onFilterChange('reset', null)}
                    className='w-full py-2 text-sm text-primary-dark hover:text-primary font-medium transition-colors border border-gray-300 rounded-lg hover:bg-gray-50'
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
