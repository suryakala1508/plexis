import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { AlertCircle, X } from 'lucide-react'

/**
 * ExpiryBanner Component
 * Displays a dismissible banner on the dashboard showing account expiry status
 * Has 3 states: Expired (red), Expiring Soon ≤3 days (orange), Trial Period 4-7 days (blue)
 */
export const ExpiryBanner = () => {
  const { user, isExpired, daysUntilExpiry } = useUser()
  const navigate = useNavigate()

  const [dismissed, setDismissed] = useState(() => {
    if (!user?.refNo) return false
    const key = `expiry-banner-dismissed-${user.refNo}`
    return localStorage.getItem(key) === 'true'
  })

  const handleDismiss = () => {
    if (!user?.refNo) return
    const key = `expiry-banner-dismissed-${user.refNo}`
    localStorage.setItem(key, 'true')
    setDismissed(true)
  }

  // Don't show if dismissed or if expiry is more than 3 days away
  if (dismissed || (!isExpired && (daysUntilExpiry === null || daysUntilExpiry > 3))) {
    return null
  }

  const getBannerConfig = () => {
    if (isExpired) {
      return {
        bg: 'bg-red-50 border-red-200',
        icon: 'text-red-600',
        title: '🚨 Your Free Trial Has Expired',
        message: `Your account expired on ${new Date(user.validUntil).toLocaleDateString('en-GB')}. Upgrade now to restore access to all features.`,
        actionText: 'Upgrade Now',
        actionClass: 'bg-red-600 hover:bg-red-700'
      }
    } else {
      // 1-3 days remaining
      return {
        bg: 'bg-orange-50 border-orange-200',
        icon: 'text-orange-600',
        title: `⚠️ Trial Expiring in ${daysUntilExpiry} Day${daysUntilExpiry !== 1 ? 's' : ''}`,
        message: `Your trial will expire on ${new Date(user.validUntil).toLocaleDateString('en-GB')}. Upgrade now to avoid service interruption.`,
        actionText: 'Upgrade Now',
        actionClass: 'bg-orange-600 hover:bg-orange-700'
      }
    }
  }

  const config = getBannerConfig()

  return (
    <div className={`${config.bg} border rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm animate-fade-in`}>
      <div className="flex items-start gap-4 flex-1">
        <AlertCircle className={`${config.icon} flex-shrink-0 mt-0.5`} size={24} />
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1">{config.title}</h4>
          <p className="text-sm text-gray-700">{config.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 mt-2 sm:mt-0">
        <button
          onClick={() => navigate('/studio/profile')}
          className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white rounded-lg ${config.actionClass} transition-colors whitespace-nowrap`}
        >
          {config.actionText}
        </button>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <X size={18} className="text-gray-600" />
        </button>
      </div>
    </div>
  )
}
