import React from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useSession } from '../contexts/SessionContext'
import Landing from '../Pages/Landing/Landing'
import { LoadingSpinner } from '../Components/Loading'
import { getFirstAccessiblePath } from '../Pages/utils/permissions'

export const HomeRoute = () => {
  const { user, loading: loadingUser } = useUser()
  const { session, loadingSession } = useSession()

  // Wait for both user AND session to load so we can make the right decision
  if (loadingUser || loadingSession) {
    return <LoadingSpinner />
  }

  if (user) {
    // SuperAdmin: redirect to /superadmin
    const role = parseInt(String(user.role));
    if (!isNaN(role) && role > 10) {
      return <Navigate to='/superadmin' replace />;
    }

    // For everyone else, use session to find the first permitted page
    // (admins go to /dashboard, RBA users go to their first accessible route)
    const destination = getFirstAccessiblePath(session);
    return <Navigate to={destination} replace />;
  }

  // Not logged in — show landing page
  return <Landing />
}