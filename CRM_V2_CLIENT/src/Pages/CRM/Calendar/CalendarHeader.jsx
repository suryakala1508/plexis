import React from 'react'
import { Plus } from 'lucide-react'
import { PermissionGate } from '@/Pages/utils/permissions'

export const CalendarHeader = ({ onAddEvent }) => {
  return (
    <div className='mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
      <h1 id="calendar-header-title" className='text-2xl sm:text-3xl md:text-4xl font-bold text-primary-dark'>Calendar</h1>

      <PermissionGate page="2" component="2_1" action="edit">
      <button
        id="calendar-add-event-btn"
        onClick={onAddEvent}
        className='w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-semibold text-sm shadow-sm'
      >
        <Plus size={18} />
        <span>Add Event</span>
      </button>
      </PermissionGate>
    </div>
  )
}

