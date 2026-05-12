import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useConnect } from '../context/ConnectContext';

/**
 * ProtectedRoute Component
 * Enforces role-based access control and session verification.
 * Redirects unauthorized users to the appropriate dashboard or login page.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser, token } = useConnect();

  // 1. Not logged in -> Go to login
  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. Role not allowed -> Redirect to their correct dashboard
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Superuser: Admin can visit all dashboards for monitoring/debugging
    if (currentUser.role === 'admin') return <Outlet />;

    console.warn(`[Protected] Access Denied: Role '${currentUser.role}' attempted to access restricted route.`);
    
    if (currentUser.role === 'owner') return <Navigate to="/owner-dashboard" replace />;
    
    // Default fallback for 'user' role or unknown roles
    return <Navigate to="/customer-dashboard" replace />;
  }

  // 3. Authorized -> Render children
  return <Outlet />;
};

export default ProtectedRoute;
