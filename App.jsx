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
import { HelpCenter, PrivacyPolicy, TermsOfService } from './pages/StaticPages';
import { ConnectProvider } from './context/ConnectContext';

function App() {
  return (
    <ConnectProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="venue/:id" element={<VenueDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="customer-dashboard" element={<CustomerDashboard />} />
          <Route path="owner-dashboard" element={<OwnerDashboard />} />
          <Route path="add-venue" element={<AddVenue />} />
          <Route path="help-center" element={<HelpCenter />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
        </Route>
      </Routes>
    </ConnectProvider>
  );
}

export default App;
