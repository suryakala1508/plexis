import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useSession } from '../contexts/SessionContext'
import { PageSkeleton } from '../Components/Loading'
import { getFirstAccessiblePath } from '../Pages/utils/permissions'

// Pages that require the user to be admin (role === "1") to access
const ADMIN_ONLY_PATHS = ['/dashboard']

/**
 * Protected Route Component - Cookie-based authentication
 * Uses UserContext to check if user is authenticated and onboarded.
 * For RBA (non-admin) users, redirects them away from admin-only routes
 * to their first accessible page.
 */
export const ProtectedRoute = ({ children, requireOnboardingComplete = true }) => {
  const { user, loading, error } = useUser()
  const { session, loadingSession } = useSession()
  const location = useLocation()

  if (loading || loadingSession) {
    return <PageSkeleton />
  }

  if (error || !user) {
    return <Navigate to='/' replace />
  }

  // SuperAdmin redirection
  const role = parseInt(String(user.role));
  if (!isNaN(role) && role > 10) {
    return <Navigate to='/superadmin' replace />;
  }

  if (!requireOnboardingComplete) {
    return children
  }

  const onboardingComplete = user?.isOnboarded === true || user?.isOnboared === true
  if (!onboardingComplete) {
    return <Navigate to='/onboarding' replace />
  }

  // RBA check: if a non-admin user tries to access an admin-only page,
  // redirect them to their first accessible route.
  const isAdmin = String(user.role) === '1'
  if (!isAdmin && ADMIN_ONLY_PATHS.some(p => location.pathname === p)) {
    const destination = getFirstAccessiblePath(session)
    // Avoid redirect loops: only redirect if destination differs
    if (destination !== location.pathname) {
      return <Navigate to={destination} replace />
    }
  }

  return children
}