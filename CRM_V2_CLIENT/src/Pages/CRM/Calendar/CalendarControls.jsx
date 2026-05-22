import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const CalendarControls = ({ 
  viewMode, 
  onViewModeChange, 
  onPrevious, 
  onNext, 
  viewTitle,
  onGoToToday
}) => {
  return (
    <div id="calendar-controls-bar" className='bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4'>
      <div className='flex items-center justify-between'>
        {/* Navigation */}
        <div className='flex items-center gap-4'>
          <button
            onClick={onGoToToday}
            className='px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all'
          >
            Today
          </button>
          
          <div className='flex items-center gap-2'>
            <button
              onClick={onPrevious}
              className='p-2 hover:bg-gray-100 rounded-lg transition-all'
            >
              <ChevronLeft size={20} className='text-gray-700' />
            </button>
            <button
              onClick={onNext}
              className='p-2 hover:bg-gray-100 rounded-lg transition-all'
            >
              <ChevronRight size={20} className='text-gray-700' />
            </button>
          </div>
          
          <h2 className='text-xl font-bold text-primary-dark min-w-[300px]'>
            {viewTitle}
          </h2>
        </div>

        {/* View Mode Toggle */}
        <div className='flex items-center gap-1 bg-gray-100 rounded-lg p-1'>
          <button
            id="calendar-view-mode-month"
            onClick={() => onViewModeChange('month')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-primary-dark text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            Month
          </button>
          <button
            id="calendar-view-mode-week"
            onClick={() => onViewModeChange('week')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-primary-dark text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            Week
          </button>
          <button
            id="calendar-view-mode-day"
            onClick={() => onViewModeChange('day')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              viewMode === 'day'
                ? 'bg-primary-dark text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            Day
          </button>
        </div>
      </div>
    </div>
  )
}

