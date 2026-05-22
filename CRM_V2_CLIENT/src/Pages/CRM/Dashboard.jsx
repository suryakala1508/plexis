import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { ExpiryBanner } from '../../Components/ExpiryBanner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getProjectStats, getDashboardSummary, getRecentActivity, getProjectCountStats, getTodaysTasks } from '../../services/projectService'
import { getLeadStats } from '../../services/leadService'
import { getClientStats } from '../../services/clientService'
import { UserPlus, Briefcase, DollarSign, Clock, Users, Package, FolderOpen, RefreshCw, Plus } from 'lucide-react'
import { formatDate } from '../../utils/formatUtils'
import { TourGuide } from '../../Components/TourGuide/TourGuide'
import { dashboardTourSteps } from '../../Components/TourGuide/steps/dashboardTourSteps'
import { PlexisTourBanner } from '../../Components/PlexisTourBanner'
import dayjs from 'dayjs'
// import DogWidget from '@/Components/DogWidget'
// import CatWidget from '../../Components/CatWidget'

// ─── Today's Tasks Sidebar ─────────────────────────────────────────────────────
const TodaysTasksSidebar = () => {
  const [activeTab, setActiveTab] = useState('all')
  const navigate = useNavigate()
  
  const [tasks, setTasks] = useState({ followups: [], events: [], payments: [], reminders: [] })
  const [loadingTasks, setLoadingTasks] = useState(true)

  const fetchTasks = async () => {
    setLoadingTasks(true)
    try {
      const { followups, reminders, events, payments } = await getTodaysTasks()
      setTasks({
        followups: followups || [],
        reminders: reminders || [],
        events: events || [],
        payments: payments || []
      })
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  const overdueCount = tasks.followups.filter(t => t.overdue).length + tasks.payments.filter(t => t.overdue).length

  const tabs = [
    { id: 'all',       label: 'All'        },
    { id: 'followups', label: 'Follow-ups' },
    { id: 'reminders', label: 'Reminders'  },
    { id: 'events',    label: 'Events'     },
    { id: 'payments',  label: 'Payments'   },
  ]

  const GroupLabel = ({ children }) => (
    <div className='flex items-center gap-2 py-1.5 px-1 mb-1'>
      <span className='font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap' style={{ fontSize: '9px' }}>
        {children}
      </span>
      <div className='flex-1 h-px bg-gray-100' />
    </div>
  )

  const renderFollowup = (task) => (
    <div
      key={task.id}
      onClick={() => {
        const leadId = task.originalEvent?.leadId?._id || task.originalEvent?.leadId;
        if (leadId) navigate(`/leads/${leadId}`);
      }}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border mb-1.5 transition-colors ${
        task.overdue ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${task.overdue ? 'bg-red-500' : 'bg-indigo-500'}`} />
      <div className='flex-1 min-w-0'>
        <div className={`text-sm font-semibold truncate ${task.overdue ? 'text-red-700' : 'text-gray-900'}`}>
          {task.name}{task.overdue && <span className='font-normal text-red-500 ml-1.5 text-xs'>(overdue)</span>}
        </div>
        <div className={`text-xs truncate mt-1 ${task.overdue ? 'text-red-500' : 'text-gray-500'}`}>{task.desc}</div>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
        task.overdue ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'
      }`}>
        {task.time}
      </span>
    </div>
  )

  const renderEvent = (task) => {
    const isProject = !!task.originalEvent?.projectTitle;
    return (
      <div 
        key={task.id} 
        onClick={() => {
          if (isProject) {
            navigate(`/project/${task.originalEvent._id}`);
          } else {
            navigate('/calendar', { state: { view: 'day', date: task.originalEvent.start } });
          }
        }}
        className='flex items-start gap-3 p-3 rounded-lg cursor-pointer border border-transparent hover:bg-gray-50 mb-1.5 transition-colors'
      >
      <span className='w-2 h-2 rounded-full flex-shrink-0 mt-1.5 bg-amber-500' />
      <div className='flex-1 min-w-0'>
        <div className='text-sm font-semibold text-gray-900 truncate'>{task.name}</div>
        <div className='text-xs text-gray-500 truncate mt-1'>{task.desc}</div>
      </div>
      <span className='text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 flex-shrink-0 whitespace-nowrap'>{task.time }</span>
    </div>
    );
  };

  const renderReminder = (task) => (
    <div
      key={task.id}
      onClick={() => {
        const clientId = task.originalEvent?.clientId?._id || task.originalEvent?.clientId;
        if (clientId) {
          navigate('/clients', { state: { selectedClientId: clientId } });
        }
      }}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border mb-1.5 transition-colors ${
        task.overdue ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${task.overdue ? 'bg-red-500' : 'bg-pink-500'}`} />
      <div className='flex-1 min-w-0'>
        <div className={`text-sm font-semibold truncate ${task.overdue ? 'text-red-700' : 'text-gray-900'}`}>
          {task.name}{task.overdue && <span className='font-normal text-red-500 ml-1.5 text-xs'>(overdue)</span>}
        </div>
        <div className={`text-xs truncate mt-1 ${task.overdue ? 'text-red-500' : 'text-gray-500'}`}>{task.desc}</div>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
        task.overdue ? 'bg-red-100 text-red-600' : 'bg-pink-50 text-pink-600'
      }`}>
        {task.time}
      </span>
    </div>
  )

  const renderPayment = (task) => (
    <div 
      key={task.id} 
      onClick={() => {
        const projectId = task.originalPayment?.projectId?._id || task.originalPayment?.projectId;
        if (projectId) navigate(`/project/${projectId}`);
      }}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border border-transparent hover:bg-gray-50 mb-1.5 transition-colors ${task.done ? 'opacity-60' : ''}`}
    >
      <span className='w-2 h-2 rounded-full flex-shrink-0 mt-1.5 bg-green-500' />
      <div className='flex-1 min-w-0'>
        <div className='text-sm font-semibold text-gray-900 truncate'>{task.name}</div>
        <div className='text-xs text-gray-500 truncate mt-1'>{task.desc}</div>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
        task.done ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
      }`}>
        {task.time}
      </span>
    </div>
  )

  return (
    // The height is controlled by the parent div's style={{ maxHeight: '...px' }}
    <div className='bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden h-full max-h-full'>
      {/* Header */}
      <div className='px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0'>
<div className='flex items-start justify-between mb-4'>
  <div>
    <h3 className='text-base font-bold text-gray-900'>Today's Tasks</h3>
    <p className='text-xs text-gray-400 mt-0.5'>{today}</p>
  </div>
  {overdueCount > 0 && (
    <span className='text-xs font-semibold bg-red-50 text-red-500 px-2.5 py-1 rounded-full flex-shrink-0'>
      {overdueCount} overdue
    </span>
  )}
</div>
        <div className='grid grid-cols-4 gap-1.5'>
          <div className='bg-indigo-50 rounded-lg p-1.5 text-center'>
            {loadingTasks ? <div className='h-4 w-6 bg-indigo-200 rounded animate-pulse mx-auto'></div> : <div className='text-base font-bold text-indigo-600 leading-none'>{tasks.followups.length}</div>}
            <div className='text-gray-400 mt-1 truncate' style={{ fontSize: '9px' }}>Follow-ups</div>
          </div>
          <div className='bg-pink-50 rounded-lg p-1.5 text-center'>
            {loadingTasks ? <div className='h-4 w-6 bg-pink-200 rounded animate-pulse mx-auto'></div> : <div className='text-base font-bold text-pink-600 leading-none'>{tasks.reminders?.length || 0}</div>}
            <div className='text-gray-400 mt-1 truncate' style={{ fontSize: '9px' }}>Reminders</div>
          </div>
          <div className='bg-amber-50 rounded-lg p-1.5 text-center'>
            {loadingTasks ? <div className='h-4 w-6 bg-amber-200 rounded animate-pulse mx-auto'></div> : <div className='text-base font-bold text-amber-500 leading-none'>{tasks.events.length}</div>}
            <div className='text-gray-400 mt-1 truncate' style={{ fontSize: '9px' }}>Events</div>
          </div>
          <div className='bg-green-50 rounded-lg p-1.5 text-center'>
            {loadingTasks ? <div className='h-4 w-6 bg-green-200 rounded animate-pulse mx-auto'></div> : <div className='text-base font-bold text-green-600 leading-none'>{tasks.payments.length}</div>}
            <div className='text-gray-400 mt-1 truncate' style={{ fontSize: '9px' }}>Payments</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='relative border-b border-gray-100 flex-shrink-0 flex items-center bg-white'>
        <div className='flex overflow-x-auto hide-scrollbar scroll-smooth flex-1' style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-fit px-3 py-2.5 flex-1 text-center transition-colors border-b-2 font-medium text-xs whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-500'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Right fade/shadow indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-end pr-1">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Scrollable task list */}
      <div 
        className='flex-1 overflow-y-auto px-4 py-3' 
        style={{ minHeight: 0, msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
        <div className="hide-scrollbar h-full">
        {loadingTasks ? (
          <div className='flex flex-col gap-2 mt-4'>
            <div className='h-12 bg-gray-100 rounded-lg animate-pulse w-full'></div>
            <div className='h-12 bg-gray-100 rounded-lg animate-pulse w-full'></div>
            <div className='h-12 bg-gray-100 rounded-lg animate-pulse w-full'></div>
          </div>
        ) : (
          <>
          {(activeTab === 'all' || activeTab === 'followups') && (
            <>
              {activeTab === 'all' && <GroupLabel>Lead Follow-ups</GroupLabel>}
              {tasks.followups.length > 0 ? tasks.followups.map(renderFollowup) : <div className="text-sm text-gray-400 italic py-8 px-4 text-center bg-gray-50/50 rounded-lg mb-4 mx-1 border border-gray-100">No follow-ups for today</div>}
            </>
          )}
          {(activeTab === 'all' || activeTab === 'reminders') && (
            <>
              {activeTab === 'all' && <GroupLabel>Client Reminders</GroupLabel>}
              {tasks.reminders?.length > 0 ? tasks.reminders.map(renderReminder) : <div className="text-sm text-gray-400 italic py-8 px-4 text-center bg-gray-50/50 rounded-lg mb-4 mx-1 border border-gray-100">No reminders for today</div>}
            </>
          )}
          {(activeTab === 'all' || activeTab === 'events') && (
            <>
              {activeTab === 'all' && <GroupLabel>Events &amp; Meetups</GroupLabel>}
              {tasks.events.length > 0 ? tasks.events.map(renderEvent) : <div className="text-sm text-gray-400 italic py-8 px-4 text-center bg-gray-50/50 rounded-lg mb-4 mx-1 border border-gray-100">No events scheduled today</div>}
            </>
          )}
          {(activeTab === 'all' || activeTab === 'payments') && (
            <>
              {activeTab === 'all' && <GroupLabel>Payments</GroupLabel>}
              {tasks.payments.length > 0 ? tasks.payments.map(renderPayment) : <div className="text-sm text-gray-400 italic py-8 px-4 text-center bg-gray-50/50 rounded-lg mb-4 mx-1 border border-gray-100">No payments due today</div>}
            </>
          )}
          </>
        )}
        </div>
      </div>

      {/* Footer Quick Actions */}
      <div className='px-4 pb-4 pt-3 border-t border-gray-100 flex-shrink-0'>
        <p className='text-gray-400 uppercase tracking-widest font-semibold mb-3' style={{ fontSize: '10px' }}>Quick Actions</p>
        <div className='flex flex-col gap-2'>
          {[
            { label: 'Add New Lead',   onClick: () => navigate('/leads', { state: { openCreateModal: true } }) },
            { label: 'Create Project', onClick: () => navigate('/project?create=true') },
            { label: 'Add an Expense', onClick: () => navigate('/accounts/expenses?add=true') },
          ].map(({ label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className='flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-gray-700 transition-colors w-full text-left font-medium text-sm'
            >
              <Plus size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const startTourRef = useRef(null)

  const [activeView, setActiveView]             = useState(() => localStorage.getItem('dashboard_active_view')  || 'leads')
  const [activeStatsRange, setActiveStatsRange] = useState(() => localStorage.getItem('dashboard_active_range') || 'month')
  const [statsRange, setStatsRange]             = useState('month')
  const [projectStats, setProjectStats]         = useState([])
  const [statsLoading, setStatsLoading]         = useState(false)
  const [showAllProjectTypes, setShowAllProjectTypes] = useState(false)
  const [leadCountStats, setLeadCountStats]     = useState([])
  const [leadStatsLoading, setLeadStatsLoading] = useState(false)
  const [projectCountStats, setProjectCountStats]   = useState([])
  const [projectStatsLoading, setProjectStatsLoading] = useState(false)
  const [clientCountStats, setClientCountStats] = useState([])
  const [clientStatsLoading, setClientStatsLoading] = useState(false)
  const [summary, setSummary]                   = useState({ totalLeads: 0, activeProjects: 0, totalClients: 0, revenue: 0, totalExpenses: 0 })
  const [recentActivities, setRecentActivities] = useState([])
  const [summaryLoading, setSummaryLoading]     = useState(false)
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  useEffect(() => { fetchSummaryData() }, [])
  useEffect(() => { if (activeStatsRange) fetchBarChartData() }, [activeStatsRange])
  useEffect(() => { if (statsRange) fetchPieChartData() }, [statsRange])
  useEffect(() => { localStorage.setItem('dashboard_active_view',  activeView) },       [activeView])
  useEffect(() => { localStorage.setItem('dashboard_active_range', activeStatsRange) }, [activeStatsRange])

  useEffect(() => {
    const handler = () => fetchAllData()
    window.addEventListener('refreshRecentActivity', handler)
    return () => window.removeEventListener('refreshRecentActivity', handler)
  }, [])

  const fetchSummaryData = async () => {
    try {
      setSummaryLoading(true); setActivitiesLoading(true)
      const [summaryData, activity] = await Promise.all([getDashboardSummary(), getRecentActivity()])
      setSummary(summaryData || { totalLeads: 0, activeProjects: 0, totalClients: 0, revenue: 0, totalExpenses: 0 })
      setRecentActivities(activity || [])
    } catch (e) { console.error(e) }
    finally { setSummaryLoading(false); setActivitiesLoading(false) }
  }

  const fetchBarChartData = async () => {
    try {
      setLeadStatsLoading(true); setProjectStatsLoading(true); setClientStatsLoading(true)
      const [leadStats, projectCountData, clientStats] = await Promise.all([
        getLeadStats(activeStatsRange), getProjectCountStats(activeStatsRange), getClientStats(activeStatsRange)
      ])
      setLeadCountStats(leadStats || [])
      setProjectCountStats(projectCountData || [])
      setClientCountStats(clientStats || [])
    } catch (e) { console.error(e) }
    finally { setLeadStatsLoading(false); setProjectStatsLoading(false); setClientStatsLoading(false) }
  }

  const fetchPieChartData = async () => {
    try {
      setStatsLoading(true)
      const stats = await getProjectStats(statsRange)
      setProjectStats(stats || [])
    } catch (e) { console.error(e) }
    finally { setStatsLoading(false) }
  }

  const fetchAllData = async () => Promise.all([fetchSummaryData(), fetchBarChartData(), fetchPieChartData()])

  const getActiveGraphData = () => {
    switch (activeView) {
      case 'leads':    return { data: leadCountStats,    loading: leadStatsLoading,    title: 'Lead Count',    color: '#6366f1' }
      case 'projects': return { data: projectCountStats, loading: projectStatsLoading, title: 'Project Count', color: '#8b5cf6' }
      case 'clients':  return { data: clientCountStats,  loading: clientStatsLoading,  title: 'Client Count',  color: '#f59e0b' }
      default:         return { data: leadCountStats,    loading: leadStatsLoading,    title: 'Lead Count',    color: '#6366f1' }
    }
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981']
  const barChartLoading = leadStatsLoading || projectStatsLoading || clientStatsLoading

  return (
    <div className='p-5 lg:pl-4 bg-gray-50 min-h-screen'>
      <TourGuide
        steps={dashboardTourSteps}
        tourKey="dashboard-tour"
        autoStart={false}
        onStartTour={(startFn) => { startTourRef.current = startFn }}
      />

      <ExpiryBanner />
      <PlexisTourBanner />

{/* Header */}
<div id="dashboard-header-section" className="mb-5 flex items-end w-full">
  <div className="flex-shrink-0 pb-1">
    <h1 className='text-xl font-bold text-primary-dark mb-0.5'>Dashboard</h1>
    <p className='text-sm text-gray-600'>
      Welcome back, {user?.firstName || 'User'}! Here's what's happening today.
    </p>
  </div>
  
  {/* The dog will walk across this remaining space and enter the house on the right */}
  {/* <DogWidget /> */}
</div>

      {/* ══════════════════════════════════════════════════════════════════════
          OUTER TWO-COLUMN GRID: [main content] | [tasks sidebar]
          The sidebar spans the full height including Recent Activity.
      ══════════════════════════════════════════════════════════════════════ */}
      <div className='xl:grid xl:grid-cols-[1fr_320px] xl:gap-5'>

        {/* ── LEFT: all main content ──────────────────────────────────────── */}
        <div className='min-w-0 flex flex-col gap-4'>

          {/* Stat cards */}
          <div id="dashboard-stats-grid" className='grid grid-cols-2 lg:grid-cols-4 gap-3'>

            <div
              id="dashboard-first-count-card"
              className={`group bg-white p-4 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition-all ${activeView === 'leads' ? 'border-blue-500 shadow-md' : 'border-gray-200'}`}
              onClick={() => setActiveView('leads')}
            >
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-xs font-medium text-gray-600'>Total Leads</h3>
                <div className='w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center'>
                  <svg className='w-3.5 h-3.5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' />
                  </svg>
                </div>
              </div>
              <p className='text-2xl font-bold text-gray-900 mb-0.5'>{summaryLoading ? '...' : summary.totalLeads}</p>
              <p className='text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>Click to view lead trends</p>
            </div>

            <div
              className={`group bg-white p-4 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition-all ${activeView === 'projects' ? 'border-purple-500 shadow-md' : 'border-gray-200'}`}
              onClick={() => setActiveView('projects')}
            >
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-xs font-medium text-gray-600'>Total Projects</h3>
                <div className='w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center'>
                  <svg className='w-3.5 h-3.5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' />
                  </svg>
                </div>
              </div>
              <p className='text-2xl font-bold text-gray-900 mb-0.5'>{summaryLoading ? '...' : summary.activeProjects}</p>
              <p className='text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>Click to view project trends</p>
            </div>

            <div
              className={`group bg-white p-4 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition-all ${activeView === 'clients' ? 'border-orange-500 shadow-md' : 'border-gray-200'}`}
              onClick={() => setActiveView('clients')}
            >
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-xs font-medium text-gray-600'>Total Clients</h3>
                <div className='w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center'>
                  <svg className='w-3.5 h-3.5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                  </svg>
                </div>
              </div>
              <p className='text-2xl font-bold text-gray-900 mb-0.5'>{summaryLoading ? '...' : summary.totalClients}</p>
              <p className='text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>Click to view client trends</p>
            </div>

            <div
              className='group bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors'
              onClick={() => navigate('/accounts/overview')}
            >
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-xs font-medium text-gray-600'>Revenue</h3>
                <div className='w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center'>
                  <svg className='w-3.5 h-3.5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
              </div>
              <p className='text-2xl font-bold text-gray-900 mb-0.5'>{summaryLoading ? '...' : `₹${summary.revenue.toLocaleString('en-IN')}`}</p>
              <p className='text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>From all projects</p>
            </div>

          </div>

          {/* Charts row */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>

            {/* Bar chart */}
            <div id="dashboard-count-graph" className='bg-white p-5 rounded-lg border border-gray-200 flex flex-col' style={{ minHeight: '300px' }}>
              <div className='flex items-center justify-between mb-3'>
                <h2 className='text-sm font-semibold text-gray-900'>{getActiveGraphData().title}</h2>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => fetchBarChartData()}
                    disabled={barChartLoading}
                    className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors ${barChartLoading ? 'animate-spin text-blue-500' : ''}`}
                    title="Refresh"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <select
                    value={activeStatsRange}
                    onChange={(e) => setActiveStatsRange(e.target.value)}
                    className='text-xs border border-gray-300 rounded-md px-2 pr-6 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>

              {getActiveGraphData().loading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
                </div>
              ) : !getActiveGraphData().data?.length ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                  <p className="text-sm">No data available</p>
                  <p className="text-xs mt-1">Try a different time range</p>
                </div>
              ) : (
                <div className="flex-1 w-full min-w-0" style={{ height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getActiveGraphData().data} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} allowDecimals={false} domain={[0, 'dataMax + 1']} />
                      <Tooltip
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill={getActiveGraphData().color} radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pie / donut chart */}
            <div id="dashboard-project-types-section" className='bg-white p-5 rounded-lg border border-gray-200 flex flex-col' style={{ minHeight: '300px' }}>
              <div className='flex items-center justify-between mb-3'>
                <h2 className='text-sm font-semibold text-gray-900'>Project Types</h2>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => fetchPieChartData()}
                    disabled={statsLoading}
                    className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors ${statsLoading ? 'animate-spin text-blue-500' : ''}`}
                    title="Refresh"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <select
                    value={statsRange}
                    onChange={(e) => setStatsRange(e.target.value)}
                    className='text-xs border border-gray-300 rounded-md px-2 pr-6 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>

              {statsLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
                </div>
              ) : projectStats.length > 0 ? (
                <div className='flex flex-col gap-3 flex-1'>
                  {/* Centred donut */}
                  <div className='flex justify-center min-w-0'>
                    <ResponsiveContainer width={148} height={148}>
                      <PieChart>
                        <Pie
                          data={projectStats}
                          cx="50%" cy="50%"
                          innerRadius={44} outerRadius={68}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {projectStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 2-column pill legend */}
                  <div className='grid grid-cols-2 gap-2'>
                    {(showAllProjectTypes ? projectStats : projectStats.slice(0, 6)).map((entry, index) => (
                      <div key={index} className='flex items-center gap-2 bg-gray-50 px-2.5 py-2 rounded-lg min-w-0'>
                        <div className='w-2 h-2 rounded-full flex-shrink-0' style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className='text-xs text-gray-600 flex-1 truncate'>{entry.name}</span>
                        <span className='text-xs font-semibold text-gray-900 flex-shrink-0'>{entry.value}</span>
                      </div>
                    ))}
                  </div>

                  {projectStats.length > 6 && (
                    <button
                      onClick={() => setShowAllProjectTypes(!showAllProjectTypes)}
                      className='text-xs text-blue-600 hover:text-blue-800 hover:underline text-center w-full'
                    >
                      {showAllProjectTypes ? 'Show Less' : `Show More (+${projectStats.length - 6})`}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1">
                  <div className="bg-gray-50 rounded-full p-5 mb-3">
                    <FolderOpen size={36} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    No projects for {statsRange === 'week' ? 'this week' : statsRange === 'month' ? 'this month' : 'this year'}
                  </p>
                  <p className="text-xs text-gray-500">Try selecting a different time range</p>
                </div>
              )}
            </div>

          </div>

          {/* Recent Activity — full width of the left column */}
          <div id="dashboard-recent-activities" className='bg-white rounded-lg border border-gray-200 p-5'>
            <h2 className='text-sm font-semibold text-gray-900 mb-3'>Recent Activity</h2>
            <div className='space-y-1'>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity) => {
                  const IconMap = { lead: UserPlus, project: Briefcase, expense: DollarSign, crew: Users, inventory: Package, client: UserPlus }
                  const IconComponent = IconMap[activity.type] || Clock
                  const colorClasses = {
                    blue:   'bg-blue-50 text-blue-600',
                    purple: 'bg-purple-50 text-purple-600',
                    green:  'bg-green-50 text-green-600',
                    orange: 'bg-orange-50 text-orange-600',
                    teal:   'bg-teal-50 text-teal-600',
                  }
                  const handleActivityClick = () => {
                    if      (activity.type === 'project')   navigate(`/project/${activity.id.replace('project-', '')}`)
                    else if (activity.type === 'lead')      navigate(`/leads/${activity.id.replace('lead-', '')}`)
                    else if (activity.type === 'client')    navigate('/clients')
                    else if (activity.type === 'expense')   navigate('/accounts/expenses')
                    else if (activity.type === 'crew')      navigate('/crew')
                    else if (activity.type === 'inventory') navigate('/inventory')
                  }
                  return (
                    <div
                      key={activity.id}
                      className='flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer'
                      onClick={handleActivityClick}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`}>
                        <IconComponent size={16} />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs font-medium text-gray-900'>{activity.title}</p>
                        <p className='text-xs text-gray-600 truncate'>{activity.description}</p>
                      </div>
                      <div className='flex items-center gap-1 text-xs text-gray-500 flex-shrink-0'>
                        <Clock size={11} />
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">No recent activity</div>
              )}
            </div>
          </div>

        </div>
        {/* ── END LEFT COLUMN ── */}

        {/* ── RIGHT: Today's Tasks — dynamic height, constrained to max height ─────────────── */}
        <div className='hidden xl:block' style={{ maxHeight: '930px' }}>
          <TodaysTasksSidebar />
        </div>

      </div>

    </div>
  )
}