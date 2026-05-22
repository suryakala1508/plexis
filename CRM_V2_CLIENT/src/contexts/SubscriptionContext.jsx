import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useUser } from './UserContext'
import { getCurrentSubscription, getSubscriptionPlans } from '../services/subscriptionService'

const SubscriptionContext = createContext(undefined)

export function SubscriptionProvider({ children }) {
  const { user, studio, subscription: bootstrappedSubscription } = useUser()
  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      return
    }

    try {
      setLoading(true)
      const [current, allPlans] = await Promise.all([
        getCurrentSubscription(),
        getSubscriptionPlans(),
      ])

      setSubscription(current)
      setPlans(Array.isArray(allPlans) ? allPlans : [])
    } catch (error) {
      // Fallback to bootstrapped data if dedicated API fails temporarily.
      const fallbackSubscription = bootstrappedSubscription || {
        planType: (studio?.subscription?.planType || 'basic').toLowerCase(),
        planName: studio?.subscription?.planType
          ? studio.subscription.planType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          : 'Basic',
        status: studio?.subscription?.status || 'Active',
        storageLimitGb: 500,
        features: {},
      }
      setSubscription(fallbackSubscription)
      console.error('Subscription context fallback:', error)
    } finally {
      setLoading(false)
    }
  }, [bootstrappedSubscription, studio?.subscription?.planType, studio?.subscription?.status, user])

  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

  const canAccess = useCallback(
    (featureKey) => {
      if (!subscription?.features) return true
      return Boolean(subscription.features[featureKey])
    },
    [subscription]
  )

  const value = useMemo(
    () => ({
      subscription,
      plans,
      loading,
      refreshSubscription,
      canAccess,
    }),
    [subscription, plans, loading, refreshSubscription, canAccess]
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
