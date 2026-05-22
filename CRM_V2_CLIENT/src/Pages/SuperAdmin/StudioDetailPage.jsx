import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, Mail, Phone, Calendar, HardDrive,
  Users, TrendingUp, FolderOpen, ShieldCheck, BadgeCheck,
  User, CheckCircle2, XCircle, Pencil, X, Plus, Minus, Save, Loader2, RefreshCw, Trash2, Download, ChevronDown
} from 'lucide-react'
import { getStudioDetails, updateStudioPlanByAdmin, updateUserSubscription, updateStudioFeatureOverrides, resetStudioFeatureOverrides, deleteStudioByAdmin, exportStudioLeads, exportStudioClients, exportStudioGallery } from '../../services/superadminService'
import { LoadingSpinner } from '../../Components/Loading/LoadingSpinner'
import { Error } from '../../Components/Error'
import { Success } from '../../Components/Success'
import { SuperAdminSidebar } from './SuperAdminSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '../../Components/ui/card'
import { Input } from '../../Components/ui/input'
import { SUBSCRIPTION_FEATURE_KEYS, getSubscriptionFeatureLabel } from '../../utils/subscriptionFeatures'

const PLANS = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'pro_max', label: 'Pro Max' },
]

const StatCard = ({ icon: Icon, label, value, subLabel, color }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
    <div className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} bg-opacity-10`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
      <p className="text-lg font-black text-gray-900 leading-tight">{value}</p>
      {subLabel && <p className="text-xs text-gray-400 leading-tight">{subLabel}</p>}
    </div>
  </div>
)

const StatusBadge = ({ status, validUntil }) => {
  const isExpired = validUntil && new Date(validUntil) < new Date()
  const s = isExpired ? 'expired' : (status || '').toLowerCase()
  const config = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Inactive' },
    trial: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Trial' },
    expired: { bg: 'bg-red-100', text: 'text-red-700', label: 'Expired' },
  }
  const c = config[s] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status || '—' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const StudioDetailPage = () => {
  const { refNo } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Plan editing state
  const [editingPlan, setEditingPlan] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState(null)
  const [planSuccess, setPlanSuccess] = useState(null)

  // Storage editing state
  const [storageMode, setStorageMode] = useState('add')
  const [daysMode, setDaysMode] = useState('add')
  const [storageGB, setStorageGB] = useState('0')
  const [days, setDays] = useState('0')
  const [storageLoading, setStorageLoading] = useState(false)
  const [storageError, setStorageError] = useState(null)
  const [storageSuccess, setStorageSuccess] = useState(null)

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)

  // Confirmation Modal state
  const [modalConfig, setModalConfig] = useState(null)

  // Feature editing state
  const [editingFeatures, setEditingFeatures] = useState(false)
  const [featureOverrides, setFeatureOverrides] = useState({})
  const [featureLoading, setFeatureLoading] = useState(false)
  const [featureError, setFeatureError] = useState(null)
  const [featureSuccess, setFeatureSuccess] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getStudioDetails(refNo)
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load studio details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refNo])

  const handlePlanSave = async () => {
    if (!selectedPlan) return
    try {
      setPlanLoading(true)
      setPlanError(null)
      await updateStudioPlanByAdmin({ refNo, planType: selectedPlan })
      setPlanSuccess('Plan updated successfully!')
      setEditingPlan(false)
      fetchData()
    } catch (err) {
      setPlanError(err.message || 'Failed to update plan')
    } finally {
      setPlanLoading(false)
    }
  }

  const handleStorageUpdate = async (e) => {
    e.preventDefault()
    const storageValue = parseFloat(storageGB)
    const daysValue = parseInt(days)
    const studio = data?.studio

    try {
      setStorageLoading(true)
      setStorageError(null)

      const storageMultiplier = storageMode === 'reduce' ? -1 : 1
      const bytesToAdd = storageValue > 0 ? Math.floor(storageValue * 1024 * 1024 * 1024) * storageMultiplier : 0
      const daysMultiplier = daysMode === 'reduce' ? -1 : 1
      const daysToAdd = daysValue > 0 ? daysValue * daysMultiplier : 0

      await updateUserSubscription({
        refNo: studio.refNo,
        additionalStorage: bytesToAdd,
        extendDays: daysToAdd,
      })

      setStorageGB('0')
      setDays('0')
      setStorageSuccess('Subscription updated successfully!')
      fetchData()
    } catch (err) {
      setStorageError(err.message || 'Failed to update subscription')
    } finally {
      setStorageLoading(false)
    }
  }

  const handleSaveFeatures = async () => {
    try {
      setFeatureLoading(true)
      setFeatureError(null)
      await updateStudioFeatureOverrides(data?.studio?._id, featureOverrides)
      setFeatureSuccess('Feature overrides saved successfully!')
      setEditingFeatures(false)
      fetchData()
    } catch (err) {
      setFeatureError(err.message || 'Failed to save feature overrides')
    } finally {
      setFeatureLoading(false)
    }
  }

  const handleResetFeatures = async () => {
    setModalConfig({
      title: 'Reset Features',
      message: 'Are you sure you want to reset all custom feature overrides to the plan defaults?',
      isDestructive: false,
      onConfirm: async () => {
        try {
          setFeatureLoading(true)
          setFeatureError(null)
          await resetStudioFeatureOverrides(data?.studio?._id)
          setFeatureSuccess('Features reset to plan defaults successfully!')
          setEditingFeatures(false)
          fetchData()
        } catch (err) {
          setFeatureError(err.message || 'Failed to reset features')
        } finally {
          setFeatureLoading(false)
          setModalConfig(null)
        }
      }
    })
  }

  const handleDeleteStudio = async () => {
    setModalConfig({
      title: 'Permanently Delete Studio',
      message: '⚠️ WARNING: This is a devastating action. Are you absolutely sure you want to permanently delete this Studio, its User, and ALL associated data (Contracts, Leads, Clients)? This cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setIsDeleting(true)
          await deleteStudioByAdmin(data?.studio?._id)
          setModalConfig(null)
          navigate('/superadmin')
        } catch (err) {
          setModalConfig({
            title: 'Error',
            message: err.message || 'Failed to delete studio. Please try again.',
            isDestructive: false,
            onConfirm: () => setModalConfig(null)
          })
          setIsDeleting(false)
        }
      }
    })
  }

  const handleExport = async (type) => {
    try {
      setIsExporting(true)
      setExportDropdownOpen(false)
      
      let blob;
      let filename;
      
      if (type === 'leads') {
        blob = await exportStudioLeads(refNo)
        filename = `leads_${refNo}.csv`
      } else if (type === 'clients') {
        blob = await exportStudioClients(refNo)
        filename = `clients_${refNo}.csv`
      } else if (type === 'gallery') {
        blob = await exportStudioGallery(refNo)
        filename = `gallery_${refNo}.zip`
      }

      if (blob) {
        const url = window.URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
      }
    } catch (err) {
      setModalConfig({
        title: 'Export Error',
        message: err.message || 'Failed to export data. The zip may be too large or there are no files.',
        isDestructive: false,
        onConfirm: () => setModalConfig(null)
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="ml-64 flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="ml-64 flex-1 p-8">
        <Error title="Error">{error || 'Studio not found'}</Error>
      </div>
    </div>
  )

  const { studio, stats } = data
  const subscription = studio?.subscription || null
  
  // Fallback for old documents: if no features are found in subscription, default to Basic plan features
  const defaultBasicFeatures = {
    lead_management: true,
    project_handling: true,
    quotation_invoicing_gst: true,
    digital_albums: true,
    photo_storage: true,
    inventory_management: true,
    crew_handling: true,
    inhouse_crew_handling: true,
    financial_dashboard: true
  }

  const featureSource = subscription?.features || (
    subscription && SUBSCRIPTION_FEATURE_KEYS.some(k => subscription[k] === true)
      ? subscription 
      : defaultBasicFeatures
  )
  
  // When editing, we prefer the overrides state; otherwise we show current DB features.
  const getFeatureValue = (key) => {
    if (editingFeatures && featureOverrides.hasOwnProperty(key)) {
      return featureOverrides[key]
    }
    return Boolean(featureSource[key])
  }

  const featureValues = SUBSCRIPTION_FEATURE_KEYS.map((featureKey) => ({
    key: featureKey,
    label: getSubscriptionFeatureLabel(featureKey),
    value: getFeatureValue(featureKey),
  }))
  const storagePercent = parseFloat(stats?.storagePercent || 0)

  const currentStorageGB = (studio.storage_data || 0) / (1024 * 1024 * 1024)
  const usedStorageGB = (studio.storageUsed || 0) / (1024 * 1024 * 1024)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscription', label: 'Subscription' },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="ml-64 flex-1">
        {/* Hero Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate('/superadmin')}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Dashboard
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    disabled={isExporting}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors border border-gray-200 shadow-sm"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Download className="w-4 h-4 text-primary" />}
                    {isExporting ? 'Exporting...' : 'Export Data'}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {exportDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <button
                        onClick={() => handleExport('leads')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" /> Leads (CSV)
                      </button>
                      <button
                        onClick={() => handleExport('clients')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" /> Clients (CSV)
                      </button>
                      <div className="h-px bg-gray-100 my-1 mx-2" />
                      <button
                        onClick={() => handleExport('gallery')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <FolderOpen className="w-4 h-4" /> Gallery Images (ZIP)
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDeleteStudio}
                  disabled={isDeleting}
                  className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isDeleting ? 'Deleting...' : 'Delete Studio'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {studio.logo ? (
                <img src={studio.logo} alt="" className="w-16 h-16 rounded-2xl object-contain bg-gray-50 border border-gray-100 p-1" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-2xl border border-primary/10">
                  {studio.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-black text-gray-900">{studio.name}</h1>
                  <StatusBadge status={studio.subscription?.status} validUntil={studio.userValidUntil} />
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                    {studio.subscription?.planType?.replace(/_/g, ' ') || 'Basic'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{studio.userName || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{studio.userEmail || 'N/A'}</span>
                  {studio.userPhone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{studio.userPhone}</span>}
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">Ref: {studio.refNo}</span>
                </div>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 mt-4 -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'text-primary border-primary bg-primary/5'
                      : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Clients" value={stats.totalClients} subLabel="All time" color="bg-blue-500" />
                <StatCard icon={TrendingUp} label="Total Leads" value={stats.totalLeads} subLabel="All enquiries" color="bg-purple-500" />
                <StatCard icon={FolderOpen} label="Total Projects" value={stats.totalProjects} subLabel="All shoots" color="bg-orange-500" />
                <StatCard icon={HardDrive} label="Storage Used" value={stats.storageUsedGB} subLabel={`of ${stats.storageTotalGB}`} color="bg-green-500" />
              </div>

              {/* Storage Progress */}
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HardDrive className="w-4 h-4 text-primary" /> Storage Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{stats.storageUsedGB} used of {stats.storageTotalGB}</span>
                    <span className={`font-bold ${storagePercent >= 90 ? 'text-red-600' : storagePercent >= 70 ? 'text-yellow-600' : 'text-green-600'}`}>{stats.storagePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${storagePercent >= 90 ? 'bg-red-500' : storagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(storagePercent, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Studio Info */}
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="w-4 h-4 text-primary" /> Studio Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Studio Name</label>
                      <p className="text-gray-900 mt-1 font-medium">{studio.name || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner</label>
                      <p className="text-gray-900 mt-1 font-medium">{studio.userName || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                      <p className="text-gray-900 mt-1 font-medium">{studio.userEmail || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</label>
                      <p className="text-gray-900 mt-1 font-medium">{studio.userPhone || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference No.</label>
                      <p className="text-gray-900 mt-1 font-mono text-xs">{studio.refNo || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Member Since</label>
                      <p className="text-gray-900 mt-1 font-medium">{formatDate(studio.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valid Until</label>
                      <p className={`mt-1 font-medium ${new Date(studio.userValidUntil) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(studio.userValidUntil)}
                        {new Date(studio.userValidUntil) < new Date() && ' (Expired)'}
                      </p>
                    </div>
                    {studio.mainAddress?.city && (
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</label>
                        <p className="text-gray-900 mt-1 font-medium">
                          {[studio.mainAddress.city, studio.mainAddress.state, studio.mainAddress.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SUBSCRIPTION TAB */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">

              {/* Success / Error toasts */}
              {planSuccess && <Success onClose={() => setPlanSuccess(null)} autoClose>{planSuccess}</Success>}
              {storageSuccess && <Success onClose={() => setStorageSuccess(null)} autoClose>{storageSuccess}</Success>}
              {featureSuccess && <Success onClose={() => setFeatureSuccess(null)} autoClose>{featureSuccess}</Success>}

              {/* Plan Details + Edit */}
              <Card className="border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      Subscription Plan
                    </span>
                    {!editingPlan && (
                      <button
                        onClick={() => { setEditingPlan(true); setSelectedPlan(subscription?.planType || 'basic'); setPlanError(null) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Plan
                      </button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {planError && <Error onClose={() => setPlanError(null)}>{planError}</Error>}

                  {/* Current Plan Info */}
                  {subscription ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Plan</label>
                        <p className="text-lg font-bold text-gray-900 mt-1 capitalize">{subscription?.planType?.replace(/_/g, ' ') || 'Basic'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                        <div className="mt-2">
                          <StatusBadge status={subscription?.status} validUntil={studio.userValidUntil} />
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valid Until</label>
                        <p className={`text-sm font-semibold mt-1 ${new Date(studio.userValidUntil) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(studio.userValidUntil)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Updated</label>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{formatDate(subscription.updatedAt)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No subscription data available.</p>
                  )}

                  {/* Edit Plan Panel */}
                  {editingPlan && (
                    <div className="border border-primary/20 bg-primary/5 rounded-xl p-5 space-y-4">
                      <p className="text-sm font-semibold text-gray-700">Select a new plan:</p>
                      <div className="grid grid-cols-3 gap-3">
                        {PLANS.map(plan => (
                          <button
                            key={plan.value}
                            type="button"
                            onClick={() => setSelectedPlan(plan.value)}
                            className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                              selectedPlan === plan.value
                                ? 'border-primary bg-white shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {selectedPlan === plan.value && (
                              <CheckCircle2 className="w-4 h-4 text-primary absolute top-2 right-2" />
                            )}
                            <p className="font-bold text-gray-900">{plan.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {plan.value === 'basic' && 'Core features'}
                              {plan.value === 'pro' && 'All features'}
                              {plan.value === 'pro_max' && 'All features + priority'}
                            </p>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingPlan(false)}
                          disabled={planLoading}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePlanSave}
                          disabled={planLoading || !selectedPlan}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                          {planLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {planLoading ? 'Saving...' : 'Save Plan'}
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Storage Management */}
              <Card className="border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-primary" />
                    Storage Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {storageError && <Error onClose={() => setStorageError(null)} className="mb-4">{storageError}</Error>}
                  <form onSubmit={handleStorageUpdate} className="space-y-6">
                    {/* Storage Capacity */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <HardDrive size={16} className="text-primary" />
                          Storage Capacity
                        </div>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setStorageMode('add')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${storageMode === 'add' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            <Plus size={12} className="inline mr-1" />Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setStorageMode('reduce')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${storageMode === 'reduce' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            <Minus size={12} className="inline mr-1" />Reduce
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>Current: {currentStorageGB.toFixed(2)} GB</span>
                          <span>Used: {usedStorageGB.toFixed(2)} GB</span>
                        </div>
                        <Input
                          type="number" min="0" step="0.1"
                          value={storageGB}
                          onChange={(e) => setStorageGB(e.target.value)}
                          placeholder={`GB to ${storageMode}`}
                          className="bg-white border-gray-200 font-medium"
                        />
                        {storageMode === 'reduce' && parseFloat(storageGB) > 0 && (
                          <p className="text-xs text-orange-600 mt-2">New total: {(currentStorageGB - parseFloat(storageGB)).toFixed(2)} GB</p>
                        )}
                        {storageMode === 'add' && parseFloat(storageGB) > 0 && (
                          <p className="text-xs text-green-600 mt-2">New total: {(currentStorageGB + parseFloat(storageGB)).toFixed(2)} GB</p>
                        )}
                      </div>
                    </div>

                    {/* Validity Period */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Calendar size={16} className="text-primary" />
                          Validity Period
                        </div>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setDaysMode('add')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${daysMode === 'add' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            <Plus size={12} className="inline mr-1" />Extend
                          </button>
                          <button
                            type="button"
                            onClick={() => setDaysMode('reduce')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${daysMode === 'reduce' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            <Minus size={12} className="inline mr-1" />Reduce
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-2">
                          Current expiry: {studio.userValidUntil ? new Date(studio.userValidUntil).toLocaleDateString() : '—'}
                        </div>
                        <div className="relative">
                          <Input
                            type="number" min="0"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            placeholder={`Days to ${daysMode}`}
                            className="bg-white border-gray-200 pr-12 font-medium"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">DAYS</div>
                        </div>
                        {parseInt(days) > 0 && (
                          <p className={`text-xs mt-2 ${daysMode === 'reduce' ? 'text-orange-600' : 'text-green-600'}`}>
                            New expiry: {(() => {
                              const newDate = new Date(studio.userValidUntil)
                              newDate.setDate(newDate.getDate() + (daysMode === 'reduce' ? -parseInt(days) : parseInt(days)))
                              return newDate.toLocaleDateString()
                            })()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={storageLoading}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {storageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {storageLoading ? 'Updating...' : 'Update Subscription'}
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Feature Matrix */}
              <Card className="border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-primary" />
                      Feature Matrix
                      <span className="ml-1 text-sm font-normal text-gray-400">({featureValues.filter(f => f.value).length}/{featureValues.length} enabled)</span>
                    </span>
                    <div className="flex gap-2">
                      {!editingFeatures ? (
                        <>
                          <button
                            onClick={handleResetFeatures}
                            disabled={featureLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reset Defaults
                          </button>
                          <button
                            onClick={() => { 
                              setEditingFeatures(true); 
                              const currentOverrides = {};
                              SUBSCRIPTION_FEATURE_KEYS.forEach(k => {
                                currentOverrides[k] = Boolean(featureSource[k]);
                              });
                              setFeatureOverrides(currentOverrides);
                              setFeatureError(null);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit Features
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingFeatures(false)}
                            disabled={featureLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveFeatures}
                            disabled={featureLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-md transition-colors disabled:opacity-50"
                          >
                            {featureLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save
                          </button>
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {featureError && <Error onClose={() => setFeatureError(null)} className="mb-4">{featureError}</Error>}
                  {editingFeatures && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                      <strong>Edit Mode:</strong> Click on features to toggle them explicitly for this studio. Overrides persist even if the base plan changes. Use "Reset Defaults" to revert to plan defaults.
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {featureValues.map(f => (
                      <div 
                        key={f.key} 
                        onClick={() => {
                          if (editingFeatures) {
                            setFeatureOverrides(prev => ({ ...prev, [f.key]: !prev[f.key] }));
                          }
                        }}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                          editingFeatures ? 'cursor-pointer hover:shadow-md hover:border-primary/50' : ''
                        } ${
                          f.value 
                            ? 'border-green-100 bg-green-50/50' 
                            : 'border-gray-100 bg-gray-50/50'
                        } ${
                          editingFeatures && featureOverrides[f.key] !== Boolean(featureSource[f.key])
                            ? 'ring-2 ring-primary/20' // Highlight changed items
                            : ''
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-700">{f.label}</span>
                        {f.value
                          ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          : <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        }
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Generic Confirmation Modal */}
      {modalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${modalConfig.isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {modalConfig.isDestructive ? <Trash2 className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
              <p className="text-gray-600 leading-relaxed mb-8">{modalConfig.message}</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isDeleting || featureLoading}
                  onClick={() => setModalConfig(null)}
                  className="px-4 py-2 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting || featureLoading}
                  onClick={modalConfig.onConfirm}
                  className={`flex items-center gap-2 px-4 py-2 font-medium text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 ${modalConfig.isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                >
                  {(isDeleting || featureLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

