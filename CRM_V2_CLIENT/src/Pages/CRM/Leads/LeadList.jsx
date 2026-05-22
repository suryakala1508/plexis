import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { ArrowUpDown, Filter } from 'lucide-react'
import { Skeleton } from '../../../Components/Skeleton'
import { formatIndianCurrency } from '../../../utils/formatUtils'

/**
 * ColumnFilterDropdown — multi-select
 * • value: string[]  (empty array = no filter)
 * • onChange: (newArray: string[]) => void
 * • Purple badge shows count when 1+ selected; dot when exactly 1
 * • Portal-rendered to escape overflow-hidden on the table wrapper
 */
const ColumnFilterDropdown = ({ value = [], options, onChange, minWidth = 170 }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const dropRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = (e) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX })
    }
    setOpen(v => !v)
  }

  const toggle = (optValue) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  const active = value.length > 0
  // Skip the "All" sentinel (index 0) — only show real options
  const visibleOptions = options.slice(1)

  const dropdown = open ? ReactDOM.createPortal(
    <div
      ref={dropRef}
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999, minWidth }}
      className="bg-white border border-gray-200 rounded-lg shadow-xl py-1.5"
    >
      {visibleOptions.map(opt => {
        const checked = value.includes(opt.value)
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${checked ? 'bg-purple-50' : ''}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.value)}
              className="accent-purple-600 rounded"
            />
            <span className={`text-xs ${checked ? 'text-purple-700 font-semibold' : 'text-gray-700'}`}>
              {opt.label}
            </span>
          </label>
        )
      })}
      {/* Clear button — only when filters are active */}
      {active && (
        <div className="border-t border-gray-100 mt-1 pt-1 px-3 pb-0.5">
          <button
            type="button"
            onClick={() => { onChange([]); setOpen(false) }}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>,
    document.body
  ) : null

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`relative flex items-center justify-center w-6 h-6 rounded transition-colors ${
          active ? 'text-purple-600 hover:text-purple-800' : 'text-gray-400 hover:text-gray-600'
        }`}
        title={active ? `${value.length} filter(s) active` : 'Filter'}
      >
        <Filter size={13} />
        {/* Badge: dot for 1 item, count for multiple */}
        {active && (
          value.length === 1
            ? <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500 ring-1 ring-white" />
            : <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-purple-500 ring-1 ring-white text-[9px] font-bold text-white px-0.5">
                {value.length}
              </span>
        )}
      </button>
      {dropdown}
    </div>
  )
}




const STATUS_OPTIONS = [
  { value: 'All leads',    label: 'All statuses' },
  { value: 'Inquiry',      label: 'Inquiry' },
  { value: 'Proposal',     label: 'Proposal' },
  { value: 'Negotiation',  label: 'Negotiation' },
  { value: 'Confirmed',    label: 'Confirmed' },
  { value: 'Rejected',     label: 'Rejected' },
]

const SOURCE_OPTIONS = [
  { value: 'All sources',    label: 'All sources' },
  { value: 'Website',        label: 'Website' },
  { value: 'Referral',       label: 'Referral' },
  { value: 'Word of Mouth',  label: 'Word of Mouth' },
  { value: 'Social Media',   label: 'Social Media' },
  { value: 'Email Campaign', label: 'Email Campaign' },
  { value: 'Cold Outreach',  label: 'Cold Outreach' },
  { value: 'Online Store',   label: 'Online Store' },
  { value: 'External Link',  label: 'External Link' },
]

export const LeadList = ({
  leads,
  onLeadClick,
  visibleColumns = { name: true, contact: true, source: true, status: true, budget: true },
  loading = false,
  // column-level filters (excel-style)
  filterStatus = 'All leads',
  filterSource = 'All sources',
  onFilterStatusChange,
  onFilterSourceChange,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const getStatusStyle = (status) => {
    const styles = {
      'Inquiry':     'bg-blue-50 text-blue-700 border-blue-200',
      'Proposal':    'bg-purple-50 text-purple-700 border-purple-200',
      'Negotiation': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Confirmed':   'bg-green-50 text-green-700 border-green-200',
      'Rejected':    'bg-red-50 text-red-700 border-red-200'
    }
    return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getSourceStyle = (source) => {
    const styles = {
      'Online Store':   'bg-blue-50 text-blue-700 border-blue-200',
      'External Link':  'bg-gray-50 text-gray-700 border-gray-200',
      'Website':        'bg-blue-50 text-blue-700 border-blue-200',
      'Referral':       'bg-purple-50 text-purple-700 border-purple-200',
      'Social Media':   'bg-pink-50 text-pink-700 border-pink-200',
      'Email Campaign': 'bg-green-50 text-green-700 border-green-200',
      'Cold Outreach':  'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
    return styles[source] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getStatusDotColor = (status) => {
    const colors = {
      'Inquiry':     'bg-blue-500',
      'Proposal':    'bg-purple-500',
      'Negotiation': 'bg-yellow-500',
      'Confirmed':   'bg-green-500',
      'Rejected':    'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedLeads = React.useMemo(() => {
    let sortableLeads = [...leads]
    if (sortConfig.key) {
      sortableLeads.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableLeads
  }, [leads, sortConfig])

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
      {/* Table */}
      <div className='overflow-x-auto no-scrollbar'>
        <table className='w-full table-fixed'>
          {/* Header */}
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              {/* Lead Name */}
              {visibleColumns.name && (
                <th className='px-4 py-2 text-left align-top w-48 min-w-[160px]'>
                  <button
                    onClick={() => handleSort('name')}
                    className='flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900'
                  >
                    LEAD NAME
                    <ArrowUpDown size={14} />
                  </button>
                </th>
              )}

              {/* Contact */}
              {visibleColumns.contact && (
                <th className='px-4 py-2 text-left align-top w-44 min-w-[140px]'>
                  <button
                    onClick={() => handleSort('email')}
                    className='flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900'
                  >
                    CONTACT
                    <ArrowUpDown size={14} />
                  </button>
                </th>
              )}

              {/* Lead Source — funnel filter */}
              {visibleColumns.source && (
                <th className='px-4 py-2 text-left align-top w-40 min-w-[140px]'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs font-bold text-gray-700 uppercase tracking-wider'>
                      LEAD SOURCE
                    </span>
                    <ColumnFilterDropdown
                      value={filterSource}
                      options={SOURCE_OPTIONS}
                      onChange={onFilterSourceChange}
                      minWidth={220}
                    />
                  </div>
                </th>
              )}

              {/* Lead Status — funnel filter */}
              {visibleColumns.status && (
                <th className='px-4 py-2 text-left align-top w-36 min-w-[130px]'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs font-bold text-gray-700 uppercase tracking-wider'>
                      LEAD STATUS
                    </span>
                    <ColumnFilterDropdown
                      value={filterStatus}
                      options={STATUS_OPTIONS}
                      onChange={onFilterStatusChange}
                    />
                  </div>
                </th>
              )}

              {/* Budget */}
              {visibleColumns.budget && (
                <th className='px-4 py-2 text-left align-top w-32 min-w-[110px]'>
                  <button
                    onClick={() => handleSort('budget')}
                    className='flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900'
                  >
                    BUDGET
                    <ArrowUpDown size={14} />
                  </button>
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className='divide-y divide-gray-200'>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-primary-light/30'}>
                  {visibleColumns.name && (
                    <td className='px-4 py-3'>
                      <div className='space-y-1'>
                        <Skeleton className='h-3 w-32' />
                        <Skeleton className='h-3 w-24' />
                      </div>
                    </td>
                  )}
                  {visibleColumns.contact && (
                    <td className='px-4 py-3'>
                      <div className='space-y-1'>
                        <Skeleton className='h-3 w-40' />
                        <Skeleton className='h-3 w-28' />
                      </div>
                    </td>
                  )}
                  {visibleColumns.source && (
                    <td className='px-4 py-3'>
                      <Skeleton className='h-5 w-20 rounded-full' />
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className='px-4 py-3'>
                      <Skeleton className='h-5 w-24 rounded-full' />
                    </td>
                  )}
                  {visibleColumns.budget && (
                    <td className='px-4 py-3'>
                      <Skeleton className='h-3 w-16' />
                    </td>
                  )}
                </tr>
              ))
            ) : sortedLeads.length === 0 ? (
              <tr>
                <td colSpan='5' className='px-6 py-12 text-center text-gray-500'>
                  <p>No leads found. Start by adding your first lead!</p>
                </td>
              </tr>
            ) : (
              sortedLeads.map((lead, index) => (
                <tr
                  key={lead.id}
                  className={`hover:bg-gray-50 transition-colors group cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-primary-light/30'
                    }`}
                  onClick={() => onLeadClick(lead)}
                >
                  {/* Lead Name */}
                  {visibleColumns.name && (
                    <td className='px-4 py-2.5'>
                      <div>
                        <div className='font-medium text-sm text-gray-900'>
                          {lead.name}
                        </div>
                        <div className='text-xs text-gray-500 mt-0.5'>
                          {lead.company}
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Contact */}
                  {visibleColumns.contact && (
                    <td className='px-4 py-2.5'>
                      <div className='space-y-1'>
                        <div className='text-sm text-gray-700 truncate'>{lead.email}</div>
                        <div className='text-sm text-gray-700'>{lead.phone}</div>
                      </div>
                    </td>
                  )}

                  {/* Lead Source */}
                  {visibleColumns.source && (
                    <td className='px-4 py-2.5'>
                      <span className={`
                        inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border
                        ${getSourceStyle(lead.source)}
                      `}>
                        {lead.source}
                      </span>
                    </td>
                  )}

                  {/* Lead Status */}
                  {visibleColumns.status && (
                    <td className='px-4 py-2.5'>
                      <span className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
                        ${getStatusStyle(lead.status)}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(lead.status)}`} />
                        {lead.status}
                      </span>
                    </td>
                  )}

                  {/* Budget */}
                  {visibleColumns.budget && (
                    <td className='px-4 py-2.5'>
                      <span className='text-sm font-medium text-gray-900'>
                        {lead.budget ? formatIndianCurrency(lead.budget.toString().replace(/[^\d.]/g, ''), true, 0) : <span className='text-gray-400'>Not set</span>}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
