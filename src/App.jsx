import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import UserManagement from './pages/UserManagement';
import VenueModeration from './pages/VenueModeration';
import BookingAnalytics from './pages/BookingAnalytics';

// ProtectedRoute for the admin console: redirects to /login if no admin session.
const ProtectedRoute = ({ children }) => {
  // loading state prevents a flash of the login page before the stored token is checked.
  const { admin, loading } = useAdminAuth();
  
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  if (!admin) return <Navigate to="/login" replace />;
  
  return children;
};

const App = () => {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Overview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="venues" element={<VenueModeration />} />
            <Route path="analytics" element={<BookingAnalytics />} />
          </Route>
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
};

export default App;
