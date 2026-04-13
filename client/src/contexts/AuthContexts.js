import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);


const getApiUrl = () => {
  const host = window.location.hostname;
  
  // Only use dev tunnel logic if we are actually in a dev tunnel
  if (host.includes('devtunnels.ms')) {
    const backendHost = host.replace('-3000', '-5000');
    return `https://${backendHost}/api`;
  }
  
 
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

console.log('AuthContext using API_URL:', API_URL);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const initializeAuth = async () => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                // Check if token is actually expired before setting user
                if (!isTokenExpired()) {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } else {
                    logout(); // Clean up if it's old
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
                logout();
            }
        }
        setLoading(false); 
    };

    initializeAuth();
}, []);

    const register = async (name, email, password, role, secretCode) => {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
                name,
                email,
                password,
                role,
                secretCode, 
                contactNumber: ""
            });

            if (response.data.success && response.data.token) {
                const { token, ...userData } = response.data;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(userData);

                return { success: true };
            } else if (response.data.token) {
                const { token, ...userData } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(userData);
                return { success: true };
            }
            
            return { success: false, error: 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const login = async (email, password) => {
        try {
            const url = `${API_URL}/auth/login`;
            console.log('Login attempt to:', url);
            
            const response = await axios.post(url, {
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                timeout: 10000 // 10 second timeout
            });

            console.log('Login response status:', response.status);
            console.log('Login response data:', response.data);

            if (response.data.success && response.data.token) {
                const { token, ...userData } = response.data;
                
                const userObject = {
                    id: userData._id,
                    _id: userData._id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    isAuthenticated: true
                };

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userObject));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(userObject);

                return { success: true, user: userObject };
            } else {
                return {
                    success: false,
                    error: response.data?.message || 'Login failed'
                };
            }
        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                method: error.config?.method,
                code: error.code
            });
            
            let errorMessage = 'Login failed. ';
            if (error.code === 'ECONNABORTED') {
                errorMessage += 'Request timed out. Server might be slow.';
            } else if (error.response?.status === 404) {
                errorMessage += 'Server endpoint not found. Please check if backend is running on port 5000.';
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage += 'Cannot connect to server. Make sure backend is running on port 5000.';
            } else {
                errorMessage += error.response?.data?.message || 'Please check your credentials.';
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const updateUser = (updatedData) => {
        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const isTokenExpired = () => {
        const token = localStorage.getItem('token');
        if (!token) return true;
        
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decodedToken = JSON.parse(window.atob(base64));
            const expiry = decodedToken.exp * 1000;
            return Date.now() > expiry;
        } catch (e) {
            return true;
        }
    };

    const isAdmin = user?.role === 'admin';
    const isStaff = user?.role === 'staff';
    const getUserRole = () => user?.role || 'guest';
    const hasPermission = (allowedRoles) => {
        if (!user) return false;
        if (!allowedRoles || allowedRoles.length === 0) return true;
        return allowedRoles.includes(user.role);
    };

    useEffect(() => {
        if (user && isTokenExpired()) {
            logout();
        }
    }, [user]);

    const value = {
        user,
        loading,
        login,
        logout,
        register,
        updateUser,
        isAuthenticated: !!user,
        isAdmin,
        isStaff,
        getUserRole,
        hasPermission,
        getAuthHeader,
        isTokenExpired
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;