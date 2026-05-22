import React from 'react'
import { X, Building2, Mail, Phone, HardDrive, Calendar, ShieldCheck, BadgeCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../Components/ui/card'
import { SUBSCRIPTION_FEATURE_KEYS, getSubscriptionFeatureLabel } from '../../../utils/subscriptionFeatures'

export const StudioDetailSidebar = ({ isOpen, onClose, studio }) => {
  if (!isOpen || !studio) return null

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

  // Use storageUsed and storage_data (capacity)
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
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-150 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-semibold text-gray-900">Studio Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Studio Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Studio Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
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
                  <p className="text-gray-900 mt-1">{formatDate(studio.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference Number</label>
                  <p className="text-gray-900 mt-1 font-mono text-xs">{studio.refNo || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
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
              ) : (
                <p className="text-sm text-gray-500">No subscription data is available for this studio yet.</p>
              )}

              <div className="mt-5 space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1 mb-3">
                    <BadgeCheck className="w-4 h-4" />
                    Feature Matrix
                  </label>
                  <div className="grid grid-cols-1 gap-3">
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
            </CardContent>
          </Card>

          {/* Storage Information */}
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

          {/* Address */}
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

          {/* Subscription Validity */}
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
      </div>
    </>
  )
}
