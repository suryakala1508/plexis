import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { fetchUserData } from '../services/authService'


const UserContext = createContext(undefined)

/**
 * UserProvider Component
 * Fetches user and studio data once and provides it to all child components
 * Handles loading and error states
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [studio, setStudio] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [jwtUser, setJwtUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Compute expiry state
  const isExpired = useMemo(() => {
    if (!user?.validUntil) return false
    return new Date(user.validUntil) < new Date()
  }, [user?.validUntil])

  const daysUntilExpiry = useMemo(() => {
    if (!user?.validUntil) return null
    const diff = new Date(user.validUntil) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [user?.validUntil])

  // Fetch user and studio data on mount
  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Backend returns: { success: true, data: { user: {...}, studio: {...} } }
      const response = await fetchUserData()

      // If response is null, user is not authenticated
      if (response === null) {
        setUser(null)
        setStudio(null)
        setLoading(false)
        return
      }

      // Extract user and studio from response
      const userData = response.user || response
      const studioData = response.studio || null
      const subscriptionData = response.subscription || null
      const jwtData = response.session || null

      setUser(userData)
      setStudio(studioData)
      setSubscription(subscriptionData)
      setJwtUser(jwtData)
      setLoading(false)

    } catch (err) {
      console.error('Error loading user data:', err)
      setError(err)
      setUser(null)
      setStudio(null)
      setSubscription(null)
      setJwtUser(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    // Skip user data fetching for public routes and superadmin routes
    const publicRoutes = ['/confirm-quotation', '/quotation-confirmed', '/quotation-rejected', '/gallery/', '/superadmin', '/forgot-password', '/reset-password', '/invite', '/foundingStudioOnboard']
    const currentPath = window.location.pathname
    const isPublicOrAdminRoute = publicRoutes.some(route =>
      currentPath.startsWith(route)
    ) || currentPath.includes('/leadform') ||  currentPath.startsWith('/gallery/')

    if (!isPublicOrAdminRoute) {
      loadUserData()
    } else {
      setLoading(false)
    }
  }, [])

  const refreshUser = async () => {
    await loadUserData()
  }

  // Function to clear user data (useful for logout)
  const clearUser = () => {
    setUser(null)
    setStudio(null)
    setSubscription(null)
    setJwtUser(null)
  }

  const value = useMemo(() => ({
    user,
    studio,
    subscription,
    jwtUser,
    loading,
    error,
    isExpired,
    daysUntilExpiry,
    refreshUser,
    clearUser,
  }), [user, studio, subscription, jwtUser, loading, error, isExpired, daysUntilExpiry])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

