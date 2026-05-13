import axios from 'axios';

const API_BASE = '/api';
export const IMG_BASE = typeof window !== 'undefined' ? window.location.origin : '';

export const imgSrc = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&q=80';
  
  // 1) Full URLs (Cloudinary, Unsplash, etc.)
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // 2) Deduplicate and Clean Local Paths
  // Standardize to remove leading slashes and redundant 'uploads/' prefixes
  let cleanPath = path.replace(/^\/+/, ''); // remove leading slashes
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.replace('uploads/', '');
  }
  
  return `${IMG_BASE}/uploads/${cleanPath}`;
};

/**
 * Platform API Instance
 * Used for all customer and owner interactions.
 * Automatically injects the user token from localStorage via interceptors.
 */
export const platformApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

platformApi.interceptors.request.use(
  (config) => {
    // Only inject stored token if no Authorization header is already explicitly set
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('connect_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Admin API Instance
 * Used exclusively for the Admin Console.
 * Automatically injects the admin token from sessionStorage via interceptors.
 */
export const adminApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

adminApi.interceptors.request.use(
  (config) => {
    // Only inject stored token if no Authorization header is already explicitly set
    if (!config.headers.Authorization) {
      const token = sessionStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default platformApi;
