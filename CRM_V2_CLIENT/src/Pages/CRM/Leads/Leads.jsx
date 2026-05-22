import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LeadList } from './LeadList'
import { LeadKanban } from './LeadKanban'
import { useUser } from '../../../contexts/UserContext'
import { ExpiryLock } from '../../../Components/ExpiryLock'
import { List, Kanban, Plus, Download, Settings2, Search } from 'lucide-react'
import { DatePicker, Popover } from 'antd'
import { CalendarDays, X } from 'lucide-react'
import dayjs from 'dayjs'
import { LeadForm } from './forms/LeadCreationForm'
import { getLeads, createLead, updateLead } from '../../../services/leadService'
import { Success } from '../../../Components/Success'
import { Error } from '../../../Components/Error'
import { formatDate } from '../../../utils/formatUtils'
import { TourGuide } from '../../../Components/TourGuide/TourGuide'
import { leadsTourSteps } from '../../../Components/TourGuide/steps/leadsTourSteps'
import { PageGuard, PermissionGate } from "@/Pages/utils/permissions"

const { RangePicker } = DatePicker

/**
 * Compact single-banner date range button.
 * A small pill button opens/closes an antd RangePicker calendar.
 * The picker input row is hidden — only the panel calendar is shown.
 */
const DateRangeButton = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const label = value?.[0] && value?.[1]
    ? `${value[0].format('D MMM')}–${value[1].format('D MMM')}`
    : null

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      {/* Pill trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`max-w-[150px] flex items-center gap-1.5 px-3 py-[7px] rounded-lg border text-xs font-medium transition-colors ${
          label
            ? 'border-blue-400 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <CalendarDays size={13} className="shrink-1" />
        <span className="truncate">{label || 'Date range'}</span>
        {label && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false) }}
            className="ml-0.5 hover:text-blue-900 shrink-0"
          >
            <X size={11} strokeWidth={2.5} />
          </span>
        )}
      </button>

      {/* Floating calendar panel */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ minWidth: 560 }}
        >
          {/* Hide the picker's input row, only show the calendar panels */}
          <style>{`
            .leads-drb .ant-picker { height: 0; overflow: hidden; border: none; padding: 0; }
            .leads-drb .ant-picker-dropdown { position: relative !important; box-shadow: none !important; }
            .leads-drb .ant-picker-panel-container { box-shadow: none !important; border-radius: 0 !important; }
            .leads-drb .ant-picker-range-arrow { display: none !important; }
          `}</style>
          <div className="leads-drb">
            <RangePicker
              value={value}
              onChange={(dates) => {
                onChange(dates)
                if (dates) setOpen(false)
              }}
              format="DD MMM YYYY"
              open
              getPopupContainer={(trigger) => trigger.closest('.leads-drb') || document.body}
            />
          </div>
        </div>
      )}
    </div>
  )
}


export const Leads = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser(Date)
  const startTourRef = useRef(null)

  // Load view mode from sessionStorage or default to 'list'
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = sessionStorage.getItem('leadsViewMode')
    return savedViewMode || 'list'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState([])   // [] = all statuses
  const [filterSource, setFilterSource] = useState([])   // [] = all sources
  const [filterEnquiryType, setFilterEnquiryType] = useState('')
  const [filterEventType, setFilterEventType] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterCreationRange, setFilterCreationRange] = useState(null) // [dayjs, dayjs] | null
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    contact: true,
    source: true,
    status: true,
    budget: true
  })
  const [isTourActive, setIsTourActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true)
        const fetchedLeads = await getLeads()
        // Map backend fields to frontend format
        const mappedLeads = fetchedLeads.map(lead => ({
          id: lead._id || lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.contactNumber || lead.phone,
          whatsappNumber: lead.whatsappNumber,
          source: lead.source || 'Website',
          status: lead.status || 'Inquiry',
          company: lead.company || lead.Relation || '',
          budget: lead.budget || '',
          notes: lead.remarks || lead.notes || '',
          EnquiryType: lead.EnquiryType,
          EventType: lead.EventType,
          EventDate: lead.EventDate,
          Location: lead.Location,
          Relation: lead.Relation,
          createdDate: formatDate(lead.createdAt),
          createdAtRaw: lead.createdAt || new Date().toISOString(),
          lastContact: formatDate(lead.updatedAt),
          timestamp: lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-US') : new Date().toLocaleString('en-US'),
          owner: user?.name || 'You',
          ownerInitials: user?.name ? user.name.split(' ').map(p => p[0]).join('').toUpperCase() : 'YO',
          avatar: null
        }))
        setLeads(mappedLeads)
      } catch (error) {
        console.error('Error fetching leads:', error)
        setErrorMessage(`Failed to load leads: ${error.message}`)
        setLeads([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [user])

  // Keep track of when the Leads tour is active (for demo row etc.)
  // The actual starting of the tour is handled inside `TourGuide` via the same `plexis-start-tour` event.
  useEffect(() => {
    const handleTourStartEvent = (e) => {
      if (e.detail?.tourKey === 'leads-tour') {
        setIsTourActive(true);
      }
    };

    const handleTourFinishEvent = (e) => {
      if (e.detail?.tourKey === 'leads-tour') {
        setIsTourActive(false);
      }
    };

    window.addEventListener('plexis-start-tour', handleTourStartEvent);
    window.addEventListener('plexis-tour-finished', handleTourFinishEvent);

    return () => {
      window.removeEventListener('plexis-start-tour', handleTourStartEvent);
      window.removeEventListener('plexis-tour-finished', handleTourFinishEvent);
    };
  }, []);
  // Check if we need to open create modal from navigation
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setShowCreateModal(true)
    }
  }, [location.state])

  const handleCreateLead = async (data) => {
    try {
      // Map frontend form data to backend model
      const leadData = {
        name: data.name,
        email: data.email,
        contactNumber: data.contactNumber || data.phone || '',
        whatsappNumber: data.whatsappNumber || '',
        EnquiryType: data.EnquiryType || '',
        EventType: data.EventType || '',
        EventDate: data.EventDate || null,
        EventEndDate: data.EventEndDate || null,
        Location: data.Location || '',
        Relation: data.Relation || data.company || '',
        source: data.source || 'Manual Entry',
        status: data.status || 'Inquiry',
        budget: data.budget ? data.budget.toString().replace(/[^\d.]/g, '') : '',
        remarks: data.remarks || data.notes || ''
      }

      await createLead(leadData)

      // Refresh leads list - force refresh by adding timestamp to bypass cache
      const fetchedLeads = await getLeads()
      const mappedLeads = fetchedLeads.map(lead => ({
        id: lead._id || lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.contactNumber || lead.phone,
        whatsappNumber: lead.whatsappNumber,
        source: lead.source || 'Website',
        status: lead.status || 'New',
        company: lead.company || lead.Relation || '',
        budget: lead.budget || '',
        notes: lead.remarks || lead.notes || '',
        EnquiryType: lead.EnquiryType,
        EventType: lead.EventType,
        EventDate: lead.EventDate,
        EventEndDate: lead.EventEndDate,
        Location: lead.Location,
        Relation: lead.Relation,
        createdDate: formatDate(lead.createdAt),
        createdAtRaw: lead.createdAt || new Date().toISOString(),
        lastContact: formatDate(lead.updatedAt),
        timestamp: lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-US') : new Date().toLocaleString('en-US'),
        owner: user?.name || 'You',
        ownerInitials: user?.name ? user.name.split(' ').map(p => p[0]).join('').toUpperCase() : 'YO',
        avatar: null
      }))
      setLeads(mappedLeads)

      setShowCreateModal(false)
      setSuccessMessage('Lead created successfully!')
    } catch (error) {
      console.error('Error creating lead:', error)
      setErrorMessage(`Failed to create lead: ${error.message}`)
    }
  }

  // Leads state - initialized as empty array, populated from API
  const [leads, setLeads] = useState([])

  const handleLeadClick = (lead) => {
    navigate(`/leads/${lead.id}`)
  }

  const handleUpdateLead = async (updatedLead) => {
    // Optimistic update
    const originalLeads = [...leads]
    setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead))

    try {
      // Map frontend fields back to backend model expected by leadController
      const updateData = {
        name: updatedLead.name,
        email: updatedLead.email,
        contactNumber: updatedLead.phone,
        whatsappNumber: updatedLead.whatsappNumber,
        source: updatedLead.source,
        status: updatedLead.status,
        budget: updatedLead.budget,
        remarks: updatedLead.notes || updatedLead.remarks,
        Relation: updatedLead.company || updatedLead.Relation,
        Location: updatedLead.Location,
        EventType: updatedLead.EventType,
        EnquiryType: updatedLead.EnquiryType
      }

      await updateLead(updatedLead.id, updateData)
      setSuccessMessage(`Lead updated successfully`)
    } catch (error) {
      console.error('Error updating lead:', error)
      setErrorMessage(`Failed to update lead: ${error.message}`)
      // Revert on error
      setLeads(originalLeads)
    }
  }


  const handleExport = () => {
    // Define columns with their visibility and data access
    const columns = [
      { header: 'Name', accessor: l => l.name, visible: visibleColumns.name },
      { header: 'Email', accessor: l => l.email, visible: visibleColumns.contact },
      { header: 'Phone', accessor: l => (l.phone ? `\t${l.phone}` : ''), visible: visibleColumns.contact },
      { header: 'Company', accessor: l => l.company, visible: true }, 
      { header: 'Source', accessor: l => l.source, visible: visibleColumns.source },
      { header: 'Status', accessor: l => l.status, visible: visibleColumns.status },
      { header: 'Budget', accessor: l => l.budget || 'Not set', visible: visibleColumns.budget },
      { header: 'Created At', accessor: l => l.timestamp, visible: true }
    ];

    const activeColumns = columns.filter(col => col.visible);

    // Function to escape and quote CSV values
    const formatCSVValue = (val) => {
      const stringVal = (val ?? '').toString();
      // If it contains a comma, newline, or quotes, wrap it in double quotes and escape internal quotes
      if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const csvContent = [
      activeColumns.map(col => formatCSVValue(col.header)).join(','),
      ...filteredLeads.map(lead => 
        activeColumns.map(col => formatCSVValue(col.accessor(lead))).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }))
  }

  const filterLeadsByCreationRange = (lead) => {
    if (!filterCreationRange || !filterCreationRange[0] || !filterCreationRange[1]) return true
    const leadDate = dayjs(lead.createdAtRaw || lead.createdDate)
    return leadDate.isAfter(filterCreationRange[0].startOf('day').subtract(1, 'ms')) &&
           leadDate.isBefore(filterCreationRange[1].endOf('day').add(1, 'ms'))
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus.length === 0 || filterStatus.includes(lead.status)
    const matchesSource = filterSource.length === 0 || filterSource.includes(lead.source)
    const matchesCreationRange = filterLeadsByCreationRange(lead)
    const matchesEnquiryType = !filterEnquiryType ||
      (lead.EnquiryType || '').toLowerCase().includes(filterEnquiryType.toLowerCase())
    const matchesEventType = !filterEventType ||
      (lead.EventType || '').toLowerCase().includes(filterEventType.toLowerCase())
    const matchesLocation = !filterLocation ||
      (lead.Location || '').toLowerCase().includes(filterLocation.toLowerCase())
    return matchesSearch && matchesStatus && matchesSource &&
           matchesCreationRange && matchesEnquiryType && matchesEventType && matchesLocation
  })

  // Unique dropdown values derived from loaded leads
  const uniqueEnquiryTypes = useMemo(() => {
    const vals = [...new Set(leads.map(l => l.EnquiryType).filter(Boolean))].sort()
    return vals
  }, [leads])

  const uniqueEventTypes = useMemo(() => {
    const vals = [...new Set(leads.map(l => l.EventType).filter(Boolean))].sort()
    return vals
  }, [leads])

  const uniqueLocations = useMemo(() => {
    const vals = [...new Set(leads.map(l => l.Location).filter(Boolean))].sort()
    return vals
  }, [leads])

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterSource, filterCreationRange, filterEnquiryType, filterEventType, filterLocation])


  return (
    <>
      <TourGuide 
        steps={leadsTourSteps} 
        tourKey="leads-tour" 
        autoStart={false}
        onStartTour={(startFn) => { startTourRef.current = startFn; }}
        onComplete={(opts) => {
          console.log("Leads tour completed, navigating to detail...");
          const targetId = leads.length > 0 ? leads[0].id : '1';
          const state = { continueTour: true, isTourMode: true };
          if (opts?.isIndividualSection) {
            state.individualSectionReturnTo = '/leads';
          }
          navigate(`/leads/${targetId}`, { state });
        }}
      />
     <PageGuard page="3">
      {successMessage && (
        <Success onClose={() => setSuccessMessage(null)} autoClose={true}>
          {successMessage}
        </Success>
      )}
      {errorMessage && (
        <Error onClose={() => setErrorMessage(null)} autoClose={true}>
          {errorMessage}
        </Error>
      )}
      <div className='p-6 lg:pl-4 bg-gray-50 min-h-screen'>
        <div className='max-w-[1600px] mx-auto'>
          {/* Header with Lead Count */}
          <div id="leads-header-section" className='mb-4'>
            <h1 className='text-2xl font-bold text-primary-dark mb-1'>
              Leads
            </h1>
          </div>

          {/* Action Bar */}
          <div id="leads-action-bar" className='bg-white rounded-xl shadow-sm border border-gray-200 mb-4'>
            <div className='p-3 border-b border-gray-200 space-y-2'>
              {/* Filter bar — two groups with space-between */}
              <div className='flex items-center justify-between gap-2 min-w-0'>

                {/* Left: filters */}
                <div className='flex items-center gap-1.5 min-w-0 flex-1'>

                  {/* Enquiry Type */}
                  <select
                    value={filterEnquiryType}
                    onChange={(e) => setFilterEnquiryType(e.target.value)}
                    className="max-w-[115px] px-2 py-[7px] border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-dark cursor-pointer appearance-none bg-white pr-6 bg-no-repeat bg-right truncate"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 0.35rem center' }}
                  >
                    <option value=''>Enquiry type</option>
                    {uniqueEnquiryTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {/* Event Type */}
                  <select
                    value={filterEventType}
                    onChange={(e) => setFilterEventType(e.target.value)}
                    className="max-w-[115px] px-2 py-[7px] border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-dark cursor-pointer appearance-none bg-white pr-6 bg-no-repeat bg-right truncate"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 0.35rem center' }}
                  >
                    <option value=''>Event type</option>
                    {uniqueEventTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {/* Location */}
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="max-w-[115px] px-2 py-[7px] border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-dark cursor-pointer appearance-none bg-white pr-6 bg-no-repeat bg-right truncate"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 0.35rem center' }}
                  >
                    <option value=''>Location</option>
                    {uniqueLocations.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>

                  {/* Date Range */}
                  <DateRangeButton
                    value={filterCreationRange}
                    onChange={setFilterCreationRange}
                  />

                  {/* Clear Filters */}
                  {(filterStatus.length > 0 || filterSource.length > 0 ||
                    filterEnquiryType || filterEventType || filterLocation || filterCreationRange) && (
                    <button
                      onClick={() => {
                        setFilterStatus([])
                        setFilterSource([])
                        setFilterEnquiryType('')
                        setFilterEventType('')
                        setFilterLocation('')
                        setFilterCreationRange(null)
                      }}
                      className="px-2 py-[7px] text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Right: action buttons */}
                <div className='flex items-center gap-2'>

                  {/* Manage Column */}
                  <div className='relative'>
                    <button
                      onClick={() => setShowColumnManager(!showColumnManager)}
                      className='flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50'
                    >
                      <Settings2 size={14} />
                      Manage Column
                    </button>
                    {showColumnManager && (
                      <div className='absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-48'>
                        <div className='space-y-2'>
                          <label className='flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded'>
                            <input type='checkbox' checked={visibleColumns.name} onChange={() => toggleColumn('name')} className='rounded' />
                            Lead Name
                          </label>
                          <label className='flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded'>
                            <input type='checkbox' checked={visibleColumns.contact} onChange={() => toggleColumn('contact')} className='rounded' />
                            Contact
                          </label>
                          <label className='flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded'>
                            <input type='checkbox' checked={visibleColumns.source} onChange={() => toggleColumn('source')} className='rounded' />
                            Lead Source
                          </label>
                          <label className='flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded'>
                            <input type='checkbox' checked={visibleColumns.status} onChange={() => toggleColumn('status')} className='rounded' />
                            Lead Status
                          </label>
                          <label className='flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded'>
                            <input type='checkbox' checked={visibleColumns.budget} onChange={() => toggleColumn('budget')} className='rounded' />
                            Budget
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <PermissionGate page="3" component="3_1" action="edit">
                    <button
                      onClick={handleExport}
                      className='flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50'
                    >
                      <Download size={14} />
                      Export
                    </button>

                    <ExpiryLock>
                      <button
                        id="leads-create-button"
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-dark/90 transition-colors font-medium text-sm"
                      >
                        <Plus size={16} />
                        Create leads
                      </button>
                    </ExpiryLock>
                  </PermissionGate>

                  {/* View Toggle & Results */}
                  <div id="leads-view-toggle" className='flex items-center gap-2 border-l border-gray-200 pl-2'>
                    <span className='text-xs text-gray-500'>
                      {filteredLeads.length}/{leads.length}
                    </span>
                    <div className='flex items-center gap-1 bg-gray-100 rounded-lg p-1'>
                      <button
                        onClick={() => {
                          setViewMode('list')
                          sessionStorage.setItem('leadsViewMode', 'list')
                        }}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        <List size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('kanban')
                          sessionStorage.setItem('leadsViewMode', 'kanban')
                        }}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        <Kanban size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Search Bar */}
            <div className='p-3'>
              <div id="leads-search" className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={18} />
                <input
                  type='text'
                  placeholder='Search leads'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent'
                />
              </div>
            </div>
          </div>

          {/* View Content */}
          <div id="leads-content" className='relative'>
            {viewMode === 'list' ? (
              <>
                <LeadList
                  leads={paginatedLeads}
                  onLeadClick={handleLeadClick}
                  visibleColumns={visibleColumns}
                  loading={loading}
                  filterStatus={filterStatus}
                  filterSource={filterSource}
                  onFilterStatusChange={setFilterStatus}
                  onFilterSourceChange={setFilterSource}
                />

                {/* Pagination */}
                {!loading && filteredLeads.length > 0 && (
                  <div className='bg-white border border-gray-200 rounded-lg mt-4 px-6 py-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4'>
                        <span className='text-sm text-gray-600'>
                          Showing {startIndex + 1} to {Math.min(endIndex, filteredLeads.length)} of {filteredLeads.length} leads
                        </span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value))
                            setCurrentPage(1)
                          }}
                          className='px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark'
                        >
                          <option value={10}>10 per page</option>
                          <option value={25}>25 per page</option>
                          <option value={50}>50 per page</option>
                          <option value={100}>100 per page</option>
                        </select>
                      </div>

                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className='px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          Previous
                        </button>

                        <div className='flex items-center gap-1'>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                  ? 'bg-primary-dark text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className='px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <LeadKanban
                leads={filteredLeads}
                onLeadClick={handleLeadClick}
                onUpdateLead={handleUpdateLead}
                loading={loading}
              />
            )}

            {/* Demo Lead for Tour - Only show when tour is active and no real leads shown */}
            {isTourActive && filteredLeads.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg opacity-80 pointer-events-none">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Example Lead</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">John Doe (Demo)</div>
                    <div className="text-xs text-gray-500">Corporate Event</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary-dark">Inquiry</div>
                    <div className="text-xs text-gray-400">Website Source</div>
                  </div>
                </div>
              </div>
            )}

            {/* Create Lead Modal */}
            <ExpiryLock>
              <LeadForm
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateLead}
              />
            </ExpiryLock>
          </div>
        </div>
      </div>
      {successMessage && (
        <Success onClose={() => setSuccessMessage(null)} autoClose={true}>
          {successMessage}
        </Success>
      )}
      {errorMessage && (
        <Error onClose={() => setErrorMessage(null)} autoClose={true}>
          {errorMessage}
        </Error>
      )}
      </PageGuard>
    </>
  )
}
