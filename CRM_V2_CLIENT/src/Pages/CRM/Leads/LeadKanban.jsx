import React, { useState } from 'react'
import { Phone } from 'lucide-react'
import { formatDate } from '../../../utils/formatUtils'

export const LeadKanban = ({ leads, onLeadClick, onUpdateLead, loading = false }) => {
  const [draggedLead, setDraggedLead] = useState(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState(null)

  const statusColumns = [
    { id: 'Inquiry', label: 'Inquiry', color: 'blue', dotColor: 'bg-blue-500' },
    { id: 'Proposal', label: 'Proposal', color: 'purple', dotColor: 'bg-purple-500' },
    { id: 'Negotiation', label: 'Negotiation', color: 'yellow', dotColor: 'bg-yellow-500' },
    { id: 'Confirmed', label: 'Confirmed', color: 'green', dotColor: 'bg-green-500' },
    { id: 'Rejected', label: 'Rejected', color: 'red', dotColor: 'bg-red-500' }
  ]

  const getLeadsByStatus = (status) => {
    return leads.filter(lead => lead.status === status)
  }

  const handleDragStart = (e, lead, columnId) => {
    setDraggedLead({ ...lead, sourceColumn: columnId })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget)
  }

  const handleDragOver = (e, columnId, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverColumn(columnId)
    setDraggedOverIndex(index)
  }

  const handleDrop = (e, targetColumnId, targetIndex) => {
    e.preventDefault()
    if (draggedLead) {
      const columnLeads = getLeadsByStatus(targetColumnId)
      const sourceColumnLeads = getLeadsByStatus(draggedLead.sourceColumn)

      // Remove from source
      const sourceIndex = sourceColumnLeads.findIndex(l => l.id === draggedLead.id)
      const newSourceLeads = [...sourceColumnLeads]
      newSourceLeads.splice(sourceIndex, 1)

      // Insert at target position
      const newTargetLeads = [...columnLeads]
      const insertIndex = targetIndex !== undefined ? targetIndex : newTargetLeads.length
      newTargetLeads.splice(insertIndex, 0, draggedLead)

      // Update status if moved to different column
      if (draggedLead.sourceColumn !== targetColumnId) {
        const updatedLead = { ...draggedLead, status: targetColumnId }
        onUpdateLead(updatedLead)
      } else {
        // Just reorder within same column - you might want to add an onReorder callback
        // For now, we'll just update the status to trigger a re-render
        onUpdateLead({ ...draggedLead, status: targetColumnId })
      }
    }
    setDraggedLead(null)
    setDraggedOverIndex(null)
    setDraggedOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedLead(null)
    setDraggedOverIndex(null)
    setDraggedOverColumn(null)
  }

  const handleDragLeave = () => {
    setDraggedOverIndex(null)
    setDraggedOverColumn(null)
  }

  return (
    <div className='flex gap-1.5 lg:gap-2 xl:gap-2.5 2xl:gap-3 overflow-x-auto no-scrollbar pb-4'>
      {statusColumns.map((column, colIndex) => {
        const columnLeads = getLeadsByStatus(column.id)
        const isLastColumn = colIndex === statusColumns.length - 1

        return (
          <div
            key={column.id}
            className={`shrink-0 w-48 md:w-48 lg:w-52 xl:w-56 2xl:w-64 ${isLastColumn ? 'lg:mr-2 xl:mr-3 2xl:mr-4' : ''}`}
          >
            {/* Column Container with White Background */}
            <div className='bg-white rounded-xl border border-gray-200 p-2.5 lg:p-3 xl:p-3.5 2xl:p-4 h-full'>
              {/* Column Header */}
              <div className='mb-2 lg:mb-3 xl:mb-3 2xl:mb-4'>
                <div className='flex items-center gap-1.5'>
                  <span className={`w-1.5 h-1.5 rounded-full ${column.dotColor}`} />
                  <h3 className='text-xs font-semibold text-gray-900'>
                    {column.label}
                  </h3>
                  <span className='text-xs text-gray-500'>
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards Container - No individual scrolling */}
              <div
                className='space-y-1.5 lg:space-y-2 xl:space-y-2.5 2xl:space-y-3'
                onDragOver={(e) => handleDragOver(e, column.id, columnLeads.length)}
                onDrop={(e) => handleDrop(e, column.id, columnLeads.length)}
                onDragLeave={handleDragLeave}
              >
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className='bg-gray-50 rounded-lg border border-gray-200 p-2.5 md:p-3 lg:p-3.5 xl:p-4 shadow-sm animate-pulse'
                    >
                      <div className='space-y-1.5'>
                        <div className='h-4 bg-gray-200 rounded w-3/4' />
                        <div className='h-3 bg-gray-200 rounded w-1/2' />
                        <div className='flex items-center gap-1.5'>
                          <div className='w-3 h-3 bg-gray-200 rounded shrink-0' />
                          <div className='h-3 bg-gray-200 rounded w-20' />
                        </div>
                      </div>
                    </div>
                  ))
                ) : columnLeads.length === 0 ? (
                  <div className='bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-4 lg:p-6 xl:p-8 2xl:p-10 text-center'>
                    <p className='text-gray-400 text-xs lg:text-sm xl:text-base 2xl:text-lg'>
                      No leads in {column.label.toLowerCase()}
                    </p>
                  </div>
                ) : (
                  columnLeads.map((lead, index) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead, column.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        e.preventDefault()
                        handleDragOver(e, column.id, index)
                      }}
                      onClick={() => onLeadClick(lead)}
                      className={`
                      bg-gray-50 rounded-lg border border-gray-200 p-2 md:p-2.5 lg:p-3
                      cursor-grab active:cursor-grabbing
                      hover:shadow-md hover:border-gray-300 transition-all
                      ${draggedLead?.id === lead.id ? 'opacity-50' : 'opacity-100'}
                      ${draggedOverColumn === column.id && draggedOverIndex === index && draggedLead?.id !== lead.id ? 'border-blue-400 border-2' : ''}
                    `}
                    >
                      {/* Simplified Layout: Name, Date, and Phone */}
                      <div className='space-y-1'>
                        <h4 className='font-semibold text-xs text-gray-900 truncate'>
                          {lead.name}
                        </h4>
                        <p className='text-xs text-gray-500'>
                          {(() => {
                            const dateValue = lead.timestamp || lead.createdAt || lead.date || lead.EventDate || lead.createdDate
                            if (!dateValue) return formatDate(new Date())

                            // If it's already in dd/mm/yyyy format, return as is
                            if (typeof dateValue === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
                              return dateValue
                            }

                            // If it's in dd-mm-yyyy format, convert to dd/mm/yyyy
                            if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
                              return dateValue.replaceAll('-', '/')
                            }

                            // If it contains time info (like "at" or comma-separated date), extract just the date part
                            if (typeof dateValue === 'string') {
                              if (dateValue.includes('at')) {
                                return dateValue.split(' at ')[0]
                              }
                              // Handle locale string format like "12/15/2024, 4:30:00 PM"
                              if (dateValue.includes(',')) {
                                const datePart = dateValue.split(',')[0]
                                // Convert MM/DD/YYYY to DD/MM/YYYY
                                const parts = datePart.split('/')
                                if (parts.length === 3) {
                                  return `${parts[1].padStart(2, '0')}/${parts[0].padStart(2, '0')}/${parts[2]}`
                                }
                              }
                            }

                            return formatDate(dateValue)
                          })()}
                        </p>
                        {lead.phone && (
                          <div className='flex items-center gap-1 text-xs text-gray-600'>
                            <Phone size={11} className='text-gray-400 shrink-0' />
                            <span className='truncate'>{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
