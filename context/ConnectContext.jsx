import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { platformApi } from '../utils/api';

const ConnectContext = createContext();
export const useConnect = () => useContext(ConnectContext);

// ── Field mapper: normalise backend rows for the frontend ─────────────────────
const mapBooking = (b) => ({
  ...b,
  totalPrice:    b.totalAmount  ?? b.totalPrice,
  customerId:    b.userId       ?? b.customerId,
  img:           b.Venue?.img   ?? b.img,
  location:      b.Venue?.location ?? b.location ?? 'Colombo',
});

export const ConnectProvider = ({ children }) => {
  const [venues,   setVenues]   = useState([]);
  const [bookings, setBookings] = useState([]);

  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('connect_currentUser')); }
    catch { return null; }
  });
  const [token, setToken] = useState(localStorage.getItem('connect_token'));

  // ── Persist session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('connect_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('connect_currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('connect_token', token);
    } else {
      localStorage.removeItem('connect_token');
    }
  }, [token]);

  // ── Fetch venues (always) and bookings (when user changes) ─────────────────
  const fetchVenues = useCallback(async () => {
    try {
      const { data } = await platformApi.get(`/venues`);
      setVenues(data);
    } catch (e) { console.error('fetchVenues:', e.message); }
  }, []);

  const fetchBookingsForUser = useCallback(async (user) => {
    if (!user) { setBookings([]); return; }
    try {
      const endpoint = user.role === 'owner'
        ? `/bookings/owner/${user.id}`
        : `/bookings/user/${user.id}`;
      const { data } = await platformApi.get(endpoint);
      setBookings(data.map(mapBooking));
    } catch (e) { console.error('fetchBookings:', e.message); }
  }, []);

  const fetchVenueById = async (id) => {
    try {
      const { data } = await platformApi.get(`/venues/${id}`);
      return data;
    } catch (e) {
      console.error('fetchVenueById:', e.message);
      return null;
    }
  };


  useEffect(() => { 
    fetchVenues();
    // ── Background Polling: industry-level real-time data (Instant Sync) ─────
    const venueInterval = setInterval(fetchVenues, 5000); // 5s
    return () => clearInterval(venueInterval);
  }, [fetchVenues]);

  useEffect(() => { 
    fetchBookingsForUser(currentUser);
    const bookingInterval = setInterval(() => fetchBookingsForUser(currentUser), 10000); // 10s
    return () => clearInterval(bookingInterval);
  }, [currentUser, fetchBookingsForUser]);


  // ── Auth ────────────────────────────────────────────────────────────────────
  const registerUser = async (userData) => {
    try {
      const { data } = await platformApi.post(`/auth/register`, userData);
      // Backend now returns only user for register, login gives token
      // We'll perform an auto-login for a better UX
      return await loginUser(userData.email, userData.password);
    } catch (e) {
      alert(e.response?.data?.message || 'Registration failed');
      return null;
    }
  };

  const loginUser = async (email, password, totpToken = null) => {
    try {
      const payload = { email, password };
      if (totpToken) payload.totpToken = totpToken;

      const { data } = await platformApi.post(`/auth/login`, payload);
      setCurrentUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (e) {
      if (e.response?.data?.requires2FA) {
        return { requires2FA: true };
      }
      // Return a structured error object so callers can display the message
      return { error: true, message: e.response?.data?.message || 'Login failed. Please try again.' };
    }
  };

  const logoutUser = () => { 
    setCurrentUser(null); 
    setToken(null);
    setBookings([]); 
  };

  const updateProfile = async (updateData) => {
    try {
      const res = await platformApi.put(`/auth/profile`, updateData);
      setCurrentUser(res.data);
      return res.data;
    } catch { return null; }
  };

  const updatePassword = async (data) => {
    try {
      await platformApi.put(`/auth/password`, data);
      return true;
    } catch (e) { 
      alert(e.response?.data?.message || 'Password update failed');
      return false; 
    }
  };

  const setup2FA = async () => {
    try {
      const { data } = await platformApi.post(`/auth/2fa/setup`);
      return data;
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to initialize 2FA setup');
      return null;
    }
  };

  const verify2FA = async (token) => {
    try {
      const { data } = await platformApi.post(`/auth/2fa/verify`, { token });
      setCurrentUser(prev => ({ ...prev, isTwoFactorEnabled: true }));
      return data;
    } catch (e) {
      alert(e.response?.data?.message || 'Invalid 2FA code');
      return null;
    }
  };

  const deleteAccount = async () => {
    try {
      await platformApi.delete(`/auth/account`);
      logoutUser();
      return true;
    } catch { return false; }
  };

  const forgotPassword = async (email) => {
    try {
      await platformApi.post(`/auth/forgot-password`, { email });
      return true;
    } catch { return false; }
  };

  const resetPassword = async (data) => {
    try {
      await platformApi.post(`/auth/reset-password`, data);
      return true;
    } catch (e) {
      alert(e.response?.data?.message || 'Reset failed');
      return false;
    }
  };

  // ── Venues ──────────────────────────────────────────────────────────────────
  const addVenue = async (formData) => {
    // formData is a FormData object (because of multi-file upload)
    try {
      // 1) Upload images first
      let galleryUrls = [];
      let primaryImg  = '';
      if (formData.has('images')) {
        const imageFormData = new FormData();
        for (let img of formData.getAll('images')) {
          imageFormData.append('images', img);
        }
        
        const uploadRes = await platformApi.post(`/upload`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        galleryUrls = uploadRes.data.urls;
        primaryImg  = galleryUrls[0] ?? '';
      }

      // 1.5) Upload verification document
      let docUrl = '';
      if (formData.has('verificationDoc')) {
        const docFormData = new FormData();
        docFormData.append('document', formData.get('verificationDoc'));
        const docRes = await platformApi.post(`/upload/document`, docFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        docUrl = docRes.data.url;
      }

      // 2) Build venue JSON payload
      const rawPrice = formData.get('price') || '0';
      const venueData = {
        name:        formData.get('name'),
        type:        formData.get('type'),
        facilityType: formData.get('facilityType') || '',
        location:    formData.get('location'),
        fullAddress: formData.get('fullAddress'),
        description: formData.get('description'),
        price:       `LKR ${rawPrice}/hr`,
        priceNum:    parseFloat(rawPrice) || 0,
        category:    ['Music Studio', 'Music Practice'].includes(formData.get('type')) ? 'Entertainment' : 'Sports',
        time:        '6 AM - 10 PM',
        img:         primaryImg,
        gallery:     galleryUrls,
        ownerId:     currentUser.id,
        rating:      0,
        capacity:    parseInt(formData.get('capacity')) || 10,
        amenities:   formData.get('amenities') ? formData.get('amenities').split(',').map(s=>s.trim()) : [],
        matchPrice:  parseFloat(formData.get('matchPrice')) || 0,
        verificationDoc: docUrl,
        docType:     formData.get('docType'),
      };

      const { data } = await platformApi.post(`/venues`, venueData);
      setVenues(prev => [data, ...prev]);
      return data;
    } catch (e) {
      console.error('addVenue:', e);
      alert(`Failed to add venue: ${e.response?.data?.message || e.message}`);
      return null;
    }
  };

  const updateVenue = async (id, updates, newFiles = []) => {
    try {
      let finalImg = updates.img;
      let finalGallery = updates.gallery || [];

      // 1) Handle new image uploads if any
      if (newFiles.length > 0) {
        const imageFormData = new FormData();
        newFiles.forEach(file => imageFormData.append('images', file));
        
        const uploadRes = await platformApi.post(`/upload`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        const newUrls = uploadRes.data.urls;
        finalGallery = [...finalGallery, ...newUrls];
        if (!finalImg) finalImg = newUrls[0];
      }

      // 2) Formatting fields for robust backend processing
      const payload = {
        ...updates,
        img: finalImg,
        gallery: finalGallery,
        ownerId: String(currentUser.id),
        priceNum: parseFloat(updates.price) || 0,
        price: `LKR ${updates.price}/hr`,
        // Ensure arrays are sent correctly
        amenities: typeof updates.amenities === 'string' 
          ? updates.amenities.split(',').map(s=>s.trim()).filter(Boolean) 
          : updates.amenities,
        blockedSlots: typeof updates.blockedSlots === 'string'
          ? updates.blockedSlots.split(',').map(s=>s.trim()).filter(Boolean)
          : updates.blockedSlots
      };

      const { data } = await platformApi.put(`/venues/${id}`, payload);
      setVenues(prev => (prev || []).map(v => String(v.id) === String(id) ? data : v));
      return data;
    } catch (e) {
      console.error('updateVenue:', e);
      alert(`Failed to update venue: ${e.response?.data?.message || e.message}`);
      return null;
    }
  };

  const deleteVenue = async (id) => {
    try {
      await platformApi.delete(`/venues/${id}`);
      setVenues(prev => (prev || []).filter(v => String(v.id) !== String(id)));
    } catch (e) { console.error('deleteVenue:', e); }
  };

  const incrementVenueViews = async (id) => {
    try {
      await platformApi.post(`/venues/${id}/view`);
    } catch (e) { console.error('incrementVenueViews:', e); }
  };

  // ── Bookings ─────────────────────────────────────────────────────────────────
  const createBooking = async (bookingData) => {

    if (!currentUser) { alert('Please log in to book.'); return null; }
    try {
      const payload = {
        venueId:       bookingData.venueId,
        userId:        currentUser.id,
        ownerId:       bookingData.ownerId,
        customerName:  bookingData.customerName || `${currentUser.firstName} ${currentUser.lastName}` || 'Guest',
        customerEmail: bookingData.customerEmail || currentUser.email || '—',
        customerPhone: bookingData.customerPhone || currentUser.phone || '—',
        venueName:     bookingData.venueName,
        date:          bookingData.date,
        timeSlots:     Array.isArray(bookingData.timeSlots) ? bookingData.timeSlots : [bookingData.timeSlot],
        totalAmount:   Number(bookingData.totalPrice),
        status:        'Confirmed',
        idempotencyKey: crypto.randomUUID()
      };
      const { data } = await platformApi.post(`/bookings`, payload);
      const mapped = mapBooking(data);
      setBookings(prev => [mapped, ...prev]);
      return mapped;
    } catch (e) {
      console.error('createBooking:', e);
      alert('Failed to create booking. Please try again.');
      return null;
    }
  };

  const cancelBooking = async (bookingId, reason) => {
    try {
      const { data } = await platformApi.put(`/bookings/${bookingId}/cancel`, { reason });
      const mapped = mapBooking(data);
      setBookings(prev => prev.map(b => b.id === bookingId ? mapped : b));
    } catch (e) { console.error('cancelBooking:', e); }
  };

  const updateBooking = async (bookingId, updates) => {
    try {
      const { data } = await platformApi.put(`/bookings/${bookingId}`, updates);
      const mapped = mapBooking(data);
      setBookings(prev => prev.map(b => b.id === bookingId ? mapped : b));
      setBookings(prev => prev.map(b => b.id === bookingId ? mapped : b));
    } catch (e) { console.error('updateBooking:', e); }
  };

  // ── Reviews ──────────────────────────────────────────────────────────────────
  const fetchVenueReviews = async (venueId) => {
    try {
      const { data } = await platformApi.get(`/venues/${venueId}/reviews`);
      return data;
    } catch (e) { console.error('fetchVenueReviews:', e); return []; }
  };

  const addReview = async (venueId, reviewData) => {
    try {
      const resp = await fetch(`${API_BASE}/api/venues/${venueId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(reviewData)
      });
      if (!resp.ok) throw new Error('Failed to add review');
      const data = await resp.json(); // { review, newRating, reviewCount }
      
      // Real-time Sync: Update the venues list in mass context
      setVenues(prev => prev.map(v => 
        String(v.id) === String(venueId) 
          ? { ...v, rating: data.newRating, reviewCount: data.reviewCount } 
          : v
      ));

      return data.review;
    } catch (err) {
      console.error('Add review error:', err);
      return null;
    }
  };

  const value = {
    venues, bookings, currentUser, token,
    registerUser, loginUser, logoutUser,
    updateProfile, updatePassword, deleteAccount, forgotPassword, resetPassword,
    setup2FA, verify2FA,
    addVenue, updateVenue, deleteVenue, incrementVenueViews,
    fetchVenueById,
    createBooking, cancelBooking, updateBooking,
    fetchVenueReviews, addReview,
    refreshVenues: fetchVenues,
    refreshBookings: () => fetchBookingsForUser(currentUser),
  };



  return <ConnectContext.Provider value={value}>{children}</ConnectContext.Provider>;
};
