import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import VenueDetail from './pages/VenueDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AddVenue from './pages/AddVenue';
import EditVenue from './pages/EditVenue';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import { HelpCenter, PrivacyPolicy, TermsOfService } from './pages/StaticPages';
import { ConnectProvider } from './context/ConnectContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ConnectProvider>
      <Routes>
        {/* ── Main platform (inside Layout wrapper) ─────────────────────── */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="venue/:id" element={<VenueDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          {/* Protected Routes: Customer Only */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route path="customer-dashboard" element={<CustomerDashboard />} />
          </Route>

          {/* Protected Routes: Owner Only */}
          <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
            <Route path="owner-dashboard" element={<OwnerDashboard />} />
            <Route path="add-venue" element={<AddVenue />} />
            <Route path="edit-venue/:id" element={<EditVenue />} />
          </Route>

          <Route path="settings" element={<Settings />} />
          <Route path="help-center" element={<HelpCenter />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
        </Route>

        {/* ── Admin Console — standalone, no Layout wrapper ─────────────── */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </ConnectProvider>
  );
}

export default App;
