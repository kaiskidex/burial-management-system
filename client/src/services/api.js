import axios from 'axios';

// Dynamic Base URL that works with tunnels and localhost
const getBaseUrl = () => {
  // Check if we're running in a browser environment
  if (typeof window !== 'undefined') {
    // If we're in a dev tunnel, use the tunnel URL for API
    if (window.location.hostname.includes('devtunnels.ms')) {
      // Extract the tunnel ID (e.g., "4ttrrhmz" from "4ttrrhmz-3000.asse.devtunnels.ms")
      const tunnelId = window.location.hostname.split('-')[0];
      return `https://${tunnelId}-5000.asse.devtunnels.ms`;
    }
  }
  
  // Fallback to env variable or localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const BASE_URL = getBaseUrl();

console.log('API Base URL:', BASE_URL); // Helps with debugging

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  // Important for tunnels - allow credentials and longer timeout
  withCredentials: true,
  timeout: 30000,
});

// Interceptor: Automatically attaches the Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add bypass header for tunnel warning page
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server might be slow or unreachable');
    }
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error('Authentication error - please log in again');
      // Optionally redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 500) {
      console.error('Server error:', error.response?.data?.message || 'Internal server error');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (userData) => api.post('/auth/register', userData);
export const getMe = () => api.get('/auth/me');

// Plot & Module Management
export const getPlots = () => api.get('/plots');
export const generatePlots = (data) => api.post('/plots/generate', data);
export const updatePlotStatus = (id, status) => api.put(`/plots/${id}`, { status });
export const getMapData = () => api.get('/plots/map-data');
export const searchOccupiedPlots = (name) => api.get(`/plots/search?name=${name}`);

// Burial Records APIs
export const getBurialRecords = () => api.get('/burials');
export const createBurialRecord = (data) => api.post('/burials', data);
export const updateBurialRecord = (id, data) => api.put(`/burials/${id}`, data);
export const deleteBurialRecord = (id) => api.delete(`/burials/${id}`);

// Permits APIs
export const getPermits = () => api.get('/permits');
export const getPermitById = (id) => api.get(`/permits/${id}`);
export const createPermit = (data) => api.post('/permits', data);
export const updatePermit = (id, data) => api.put(`/permits/${id}`, data);
export const approvePermit = (id, data) => api.put(`/permits/${id}/approve`, data);

// uses the 'api' instance instead of raw axios
export const completePermit = (id, data) => api.put(`/permits/${id}/complete`, data);

export const deletePermit = (id) => api.delete(`/permits/${id}`);

// Lease Management 
export const getLeases = (params) => api.get('/leases', { params });
export const createLease = (data) => api.post('/leases', data);
export const renewLease = (id, data) => api.put(`/leases/${id}/renew`, data);

export const terminateLease = (id, data) => api.delete(`/leases/${id}/terminate`, { data });


export const getMyLeases = () => api.get('/leases/my-leases');

export default api;