import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, HardDrive, Users, Search, Eye, PlusCircle, Calendar as CalendarIcon, ArrowUp, Bell, X } from 'lucide-react'
import { getAdminDashboard, getUpgradeRequests } from '../../services/superadminService'
import { LoadingSpinner } from '../../Components/Loading/LoadingSpinner'
import { Error } from '../../Components/Error'
import { AddStudioModal } from './components/AddStudioModal'
import { AddStorageModal } from './components/AddStorageModal'
import { NotificationDropdown } from './components/NotificationDropdown'
import { SuperAdminSidebar } from './SuperAdminSidebar'
import { Button } from '../../Components/ui/button'
import { Input } from '../../Components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../Components/ui/card'
import { Success } from '../../Components/Success'

export const SuperAdminDashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState({ studios: [], totalStudios: 0, totalStorageData: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [addStudioModalOpen, setAddStudioModalOpen] = useState(false)
  const [addStorageModalOpen, setAddStorageModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedStudio, setSelectedStudio] = useState(null)
  const [upgradeRequests, setUpgradeRequests] = useState([])
  const [showUpgradeRequests, setShowUpgradeRequests] = useState(false)
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    fetchUpgradeRequests()
  }, [])

  const fetchUpgradeRequests = async () => {
    try {
      const response = await getUpgradeRequests()
      setUpgradeRequests(response.requests || response || [])
    } catch (err) {
      console.error('Error fetching upgrade requests:', err)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const dashboardData = await getAdminDashboard()
      setData(dashboardData)
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Unauthorized. Please login as Super Admin.')
      } else {
        setError(err.message || 'Failed to fetch dashboard data')
      }
      console.error('Error fetching dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStorage = (studio) => {
    setSelectedStudio(studio)
    setAddStorageModalOpen(true)
  }

  const handleStorageUpdated = () => {
    setAddStorageModalOpen(false)
    fetchDashboardData()
    fetchUpgradeRequests() // Refresh upgrade requests
    setSuccessMessage('Subscription updated successfully!')
  }

  const handleViewDetails = (studio) => {
    navigate(`/superadmin/studios/${studio.refNo}`)
  }

  const formatGB = (bytes) => {
    if (!bytes || bytes === 0) return '0 GB'
    const GB = bytes / (1024 * 1024 * 1024)
    return `${GB.toFixed(2)} GB`
  }

  const filteredStudios = data.studios.filter(studio => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = (
      (studio.name || '').toLowerCase().includes(searchLower) ||
      (studio.userName || '').toLowerCase().includes(searchLower) ||
      (studio.userEmail || '').toLowerCase().includes(searchLower) ||
      (studio.refNo || '').toLowerCase().includes(searchLower)
    )
    const studioStatus = String(studio.subscription?.status || 'active').toLowerCase()
    const matchesStatus = filterStatus === '' || studioStatus === filterStatus
    const studioPlan = (studio.subscription?.planType || 'basic').toLowerCase()
    const matchesPlan = filterPlan === '' || studioPlan === filterPlan
    return matchesSearch && matchesStatus && matchesPlan
  })

  if (loading) return (
    <div className="flex">
      <SuperAdminSidebar />
      <div className="ml-64 flex-1 p-6">
        <LoadingSpinner />
      </div>
    </div>
  )

  if (error) return (
    <div className="flex">
      <SuperAdminSidebar />
      <div className="ml-64 flex-1 p-6">
        <Error title="Error" variant="error">{error}</Error>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Super Admin Dashboard</h1>
            <p className="text-gray-500 mt-1 font-medium">Platform-wide overview and studio management</p>
          </div>
          <div className="flex items-center gap-3">
            {upgradeRequests.filter(r => r.status === 'open').length > 0 && (
              <div className="relative">
                <Button
                  onClick={() => setShowUpgradeRequests(!showUpgradeRequests)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-4 py-2.5 shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  <span className="font-semibold">Upgrade Requests</span>
                  <span className="ml-2 bg-white text-orange-600 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm">
                    {upgradeRequests.filter(r => r.status === 'open').length}
                  </span>
                </Button>
                
                <NotificationDropdown
                  isOpen={showUpgradeRequests}
                  onClose={() => setShowUpgradeRequests(false)}
                  upgradeRequests={upgradeRequests}
                  onManageClick={(request) => {
                    setSelectedStudio(data.studios.find(s => s.refNo === request.refNo))
                    setAddStorageModalOpen(true)
                    setShowUpgradeRequests(false)
                  }}
                />
              </div>
            )}
          <Button
            onClick={() => setAddStudioModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white rounded-xl px-5 py-2.5 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3]" />
            Add New Studio
          </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-gray-500 uppercase flex items-center tracking-wider">
                <Building2 className="w-4 h-4 mr-2 text-primary" />
                Total Studios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-gray-900">{data.totalStudios}</p>
              <p className="text-xs text-green-600 mt-1 font-medium">Active platform users</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-gray-500 uppercase flex items-center tracking-wider">
                <HardDrive className="w-4 h-4 mr-2 text-primary" />
                Aggregated Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-gray-900">{formatGB(data.totalStorageData)}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">Total available capacity</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-gray-500 uppercase flex items-center tracking-wider">
                <Users className="w-4 h-4 mr-2 text-primary" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-gray-900">{data.studios.length}</p>
              <p className="text-xs text-purple-600 mt-1 font-medium">Currently connected</p>
            </CardContent>
          </Card>
        </div>



        {/* Search & Filter Bar */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name, email, ref number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full max-w-md bg-white border-gray-200"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 pr-8 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>

            {/* Subscription / Plan Filter */}
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="h-10 px-3 pr-8 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="">All Plans</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="pro_max">Pro Max</option>
            </select>

            {/* Clear Filters */}
            {(filterStatus || filterPlan) && (
              <button
                onClick={() => { setFilterStatus(''); setFilterPlan('') }}
                className="h-10 px-3 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Studios Table */}
        <Card className="border-gray-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Studio Information</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Owner Details</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Storage Capacity</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Validity</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Subscription</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudios.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-500">
                        No studios matching your search criteria
                      </td>
                    </tr>
                  ) : (
                    filteredStudios.map((studio) => (
                      <tr key={studio._id} onClick={() => handleViewDetails(studio)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {studio.logo ? (
                              <img src={studio.logo} alt="" className="w-8 h-8 rounded bg-gray-100 object-contain" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {studio.name?.[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900">{studio.name}</div>
                              <div className="text-xs text-gray-500 font-mono">Ref: {studio.refNo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-gray-900">{studio.userName}</div>
                          <div className="text-xs text-gray-500">{studio.userEmail}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{formatGB(studio.storage_data)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${new Date(studio.userValidUntil) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                              {new Date(studio.userValidUntil).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {studio.subscription?.planType?.replace(/_/g, ' ') || 'Basic'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex w-fit px-2 py-0.5 text-[11px] font-medium rounded-full ${String(studio.subscription?.status || 'active').toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-800'
                              : String(studio.subscription?.status || '').toLowerCase() === 'trial'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            {new Date(studio.userValidUntil) < new Date() ? 'Expired' : (studio.subscription?.status || 'Active')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddStudioModal
        open={addStudioModalOpen}
        onClose={() => setAddStudioModalOpen(false)}
        onSuccess={() => {
          setAddStudioModalOpen(false)
          fetchDashboardData()
          setSuccessMessage('Studio added successfully!')
        }}
      />

      <AddStorageModal
        open={addStorageModalOpen}
        onClose={() => setAddStorageModalOpen(false)}
        onSuccess={handleStorageUpdated}
        studio={selectedStudio}
      />
        </div>
      </div>
    </div>
  )
}
