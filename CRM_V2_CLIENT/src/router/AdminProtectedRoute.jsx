import React from 'react';
import { Navigate } from 'react-router-dom';
import { PageSkeleton } from '../Components/Loading';
import { useUser } from '../contexts/UserContext';

export const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) return <PageSkeleton />;

  // UserContext skips fetching for /superadmin routes (intentionally), so
  // fall back to the role stored in localStorage during admin login.
  const contextRole = user?.role !== undefined ? Number(user.role) : NaN;
  const storedRole = parseInt(localStorage.getItem('user_role') || '0', 10);
  const isAdmin = (!isNaN(contextRole) && contextRole > 10) || storedRole > 10;

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};
