import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ConnectContext = createContext();
export const useConnect = () => useContext(ConnectContext);

const API_BASE = 'http://localhost:5000/api';

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

  // ── Persist session ─────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('connect_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  // ── Fetch venues (always) and bookings (when user changes) ─────────────────
  const fetchVenues = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/venues`);
      setVenues(data);
    } catch (e) { console.error('fetchVenues:', e.message); }
  }, []);

  const fetchBookingsForUser = useCallback(async (user) => {
    if (!user) { setBookings([]); return; }
    try {
      const endpoint = user.role === 'owner'
        ? `${API_BASE}/bookings/owner/${user.id}`
        : `${API_BASE}/bookings/user/${user.id}`;
      const { data } = await axios.get(endpoint);
      setBookings(data.map(mapBooking));
    } catch (e) { console.error('fetchBookings:', e.message); }
  }, []);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);
  useEffect(() => { fetchBookingsForUser(currentUser); }, [currentUser, fetchBookingsForUser]);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const registerUser = async (userData) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/register`, userData);
      setCurrentUser(data);
      return data;
    } catch (e) {
      alert(e.response?.data?.message || 'Registration failed');
      return null;
    }
  };

  const loginUser = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setCurrentUser(data);
      return data;
    } catch {
      return null;
    }
  };

  const logoutUser = () => { setCurrentUser(null); setBookings([]); };

  // ── Venues ──────────────────────────────────────────────────────────────────
  const addVenue = async (formData) => {
    // formData is a FormData object (because of multi-file upload)
    try {
      // 1) Upload images first
      let galleryUrls = [];
      let primaryImg  = '';
      if (formData.get('images') || (formData instanceof FormData && formData.has('images'))) {
        const uploadRes = await axios.post(`${API_BASE}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        galleryUrls = uploadRes.data.urls; // ["/uploads/xxx.jpg", …]
        primaryImg  = galleryUrls[0] ?? '';
      } else if (formData instanceof FormData) {
        primaryImg = '';
      }

      // 2) Build venue JSON payload
      const rawPrice = formData.get('price') || '0';
      const payload = {
        name:        formData.get('name'),
        type:        formData.get('type'),
        facilityType: formData.get('facilityType') || '',
        location:    formData.get('location'),
        description: formData.get('description'),
        price:       `LKR ${rawPrice}/hr`,
        priceNum:    parseFloat(rawPrice) || 0,
        category:    ['Music Studio', 'Music Practice'].includes(formData.get('type')) ? 'Entertainment' : 'Sports',
        time:        '6 AM - 10 PM',
        img:         primaryImg,
        gallery:     galleryUrls,
        ownerId:     currentUser.id,
        rating:      0,
      };

      const { data } = await axios.post(`${API_BASE}/venues`, payload);
      setVenues(prev => [data, ...prev]);
      return data;
    } catch (e) {
      console.error('addVenue:', e);
      alert('Failed to add venue.');
      return null;
    }
  };

  const updateVenue = async (id, updates) => {
    try {
      const { data } = await axios.put(`${API_BASE}/venues/${id}`, { ...updates, ownerId: currentUser.id });
      setVenues(prev => prev.map(v => v.id === id ? data : v));
      return data;
    } catch (e) {
      console.error('updateVenue:', e);
      alert('Failed to update venue.');
      return null;
    }
  };

  const deleteVenue = async (id) => {
    try {
      await axios.delete(`${API_BASE}/venues/${id}`);
      setVenues(prev => prev.filter(v => v.id !== id));
    } catch (e) { console.error('deleteVenue:', e); }
  };

  const incrementVenueViews = async (id) => {
    try {
      await axios.post(`${API_BASE}/venues/${id}/view`);
    } catch (e) { console.error('incrementVenueViews:', e); }
  };

  // ── Bookings ─────────────────────────────────────────────────────────────────
  const createBooking = async (bookingData) => {
    if (!currentUser) { alert('Please log in to book.'); return null; }
    try {
      const payload = {
        ...bookingData,
        userId:      currentUser.id,
        totalAmount: bookingData.totalPrice,
        status:      'Confirmed',
        timeSlots:   Array.isArray(bookingData.timeSlots) ? bookingData.timeSlots : [bookingData.timeSlot],
      };
      const { data } = await axios.post(`${API_BASE}/bookings`, payload);
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
      const { data } = await axios.put(`${API_BASE}/bookings/${bookingId}/cancel`, { reason });
      const mapped = mapBooking(data);
      setBookings(prev => prev.map(b => b.id === bookingId ? mapped : b));
    } catch (e) { console.error('cancelBooking:', e); }
  };

  const updateBooking = async (bookingId, updates) => {
    try {
      const { data } = await axios.put(`${API_BASE}/bookings/${bookingId}`, updates);
      const mapped = mapBooking(data);
      setBookings(prev => prev.map(b => b.id === bookingId ? mapped : b));
    } catch (e) { console.error('updateBooking:', e); }
  };

  const value = {
    venues, bookings, currentUser,
    registerUser, loginUser, logoutUser,
    addVenue, updateVenue, deleteVenue, incrementVenueViews,
    createBooking, cancelBooking, updateBooking,
    refreshVenues: fetchVenues,
    refreshBookings: () => fetchBookingsForUser(currentUser),
  };

  return <ConnectContext.Provider value={value}>{children}</ConnectContext.Provider>;
};
