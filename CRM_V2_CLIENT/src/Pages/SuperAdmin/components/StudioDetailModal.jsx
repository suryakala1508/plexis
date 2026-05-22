import React from 'react'
import { X, Building2, Mail, Phone, HardDrive, Calendar, ShieldCheck, BadgeCheck, Users, TrendingUp, FolderOpen } from 'lucide-react'
import { Button } from '../../../Components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../Components/ui/card'
import { SUBSCRIPTION_FEATURE_KEYS, getSubscriptionFeatureLabel } from '../../../utils/subscriptionFeatures'

export const StudioDetailModal = ({ open, onClose, studio }) => {
  if (!open || !studio) return null

  const formatGB = (bytes) => {
    if (!bytes || bytes === 0) return '0 GB'
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const storageUsedBytes = studio.storageUsed || 0
  const storageTotalBytes = studio.storage_data || ((studio.subscription?.storageLimitGb || 500) * 1024 * 1024 * 1024)
  const storageRemainingBytes = Math.max(0, storageTotalBytes - storageUsedBytes)
  const percentage = storageTotalBytes > 0 ? (storageUsedBytes / storageTotalBytes) * 100 : 0
  const subscription = studio.subscription || null
  const featureSource = subscription?.features || subscription || {}
  const featureValues = SUBSCRIPTION_FEATURE_KEYS.map((featureKey) => ({
    key: featureKey,
    label: getSubscriptionFeatureLabel(featureKey),
    value: Boolean(featureSource[featureKey]),
  }))

  const statusLabel = subscription?.status || studio.status || 'active'
  const normalizedStatus = String(statusLabel).toLowerCase()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-semibold text-gray-900">Studio Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Studio Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Studio Name</label>
                  <p className="text-gray-900 mt-1">{studio.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Owner Name</label>
                  <p className="text-gray-900 mt-1">{studio.userName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="text-gray-900 mt-1">{studio.userEmail || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <p className="text-gray-900 mt-1">{studio.userPhone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created At
                  </label>
                  <p className="text-gray-900 mt-1">{formatDate(studio.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference Number</label>
                  <p className="text-gray-900 mt-1 font-mono text-xs">{studio.refNo || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${studio.status === 'active' || !studio.status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {studio.status || 'Active'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-around bg-gray-50/80 border border-gray-100 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Clients</span>
              <span className="text-sm font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{studio.stats?.totalClients || 0}</span>
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leads</span>
              <span className="text-sm font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{studio.stats?.totalLeads || 0}</span>
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Projects</span>
              <span className="text-sm font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{studio.stats?.totalProjects || 0}</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 te
                xt-primary" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${normalizedStatus === 'active'
                            ? 'bg-green-100 text-green-800'
                            : normalizedStatus === 'trial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {statusLabel}
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-500">Feature Matrix</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{featureValues.length} features</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="text-gray-900 mt-1">{formatDate(subscription.updatedAt)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1 mb-3">
                      <BadgeCheck className="w-4 h-4" />
                      Feature Matrix
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {featureValues.map((feature) => (
                        <div key={feature.key} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${feature.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {String(feature.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No subscription data is available for this studio yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-primary" />
                Storage Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-blue-600">Used Storage</label>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{formatGB(storageUsedBytes)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-green-600">Available Storage</label>
                    <p className="text-2xl font-bold text-green-900 mt-1">{formatGB(storageRemainingBytes)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-purple-600">Total Limit</label>
                    <p className="text-2xl font-bold text-purple-900 mt-1">{formatGB(storageTotalBytes)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Storage Usage</span>
                    <span className="text-gray-900 font-medium">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${percentage >= 90
                          ? 'bg-red-500'
                          : percentage >= 70
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {studio.mainAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700 space-y-1">
                  {studio.mainAddress.addressLine1 && <p>{studio.mainAddress.addressLine1}</p>}
                  {studio.mainAddress.addressLine2 && <p>{studio.mainAddress.addressLine2}</p>}
                  <p>
                    {[studio.mainAddress.city, studio.mainAddress.state, studio.mainAddress.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {studio.userValidUntil && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Subscription Validity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-gray-900 ${new Date(studio.userValidUntil) < new Date() ? 'text-red-600 font-semibold' : ''}`}>
                  {formatDate(studio.userValidUntil)}
                  {new Date(studio.userValidUntil) < new Date() && ' (Expired)'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t">
          <Button
            onClick={onClose}
            className="bg-primary p-2 hover:bg-primary-dark text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
