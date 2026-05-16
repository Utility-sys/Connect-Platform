import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  // Restore admin session from localStorage on app mount.
  useEffect(() => {
    if (token) {
      // Set the shared axios Authorization header so all subsequent requests are authenticated.
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // In a real app, we might verify the token with the backend here
      const storedAdmin = localStorage.getItem('admin_user');
      if (storedAdmin) {
        setAdmin(JSON.parse(storedAdmin));
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  // Verify the role is "admin" before accepting the login.
  const login = async (email, password) => {
  // A valid customer or owner login is rejected here with a clear error message.
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      
      if (data.user.role !== 'admin') {
        throw new Error('Access denied: You are not an administrator.');
      }

      setAdmin(data.user);
      setToken(data.token);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  // logout: wipe all traces of the admin session from memory, storage, and axios headers.
  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
