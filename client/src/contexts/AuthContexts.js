import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from './services/api';

const API_URL = api.defaults.baseURL;
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);




const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (!token) return true;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedToken = JSON.parse(window.atob(base64));
        return Date.now() > decodedToken.exp * 1000;
    } catch {
        return true;
    }
};

const clearAuthStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth state on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                const userData = localStorage.getItem('user');
                if (token && userData && !isTokenExpired()) {
                    setUser(JSON.parse(userData));
                }
            } catch (e) {
                clearAuthStorage();
            } finally {
                setLoading(false); // THIS MUST RUN
            }
        };
        initializeAuth();
    }, []);

    // Watch for token expiry while the app is open
    useEffect(() => {
        if (user && isTokenExpired()) {
            logout();
        }
    }, [user]);

    const register = async (name, email, password, role, secretCode) => {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
                name,
                email,
                password,
                role,
                secretCode,
                contactNumber: '',
            });

            const token = response.data?.token;
            if (token) {
                const { token: _token, ...userData } = response.data;
                const userObject = normalizeUser(userData);
                persistAuth(token, userObject);
                return { success: true };
            }

            return { success: false, error: 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed',
            };
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post(
                `${API_URL}/auth/login`,
                { email, password },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Bypass-Tunnel-Reminder': 'true',
                    },
                    timeout: 10000,
                }
            );

            const token = response.data?.token;
            if (token) {
                const { token: _token, ...userData } = response.data;
                const userObject = normalizeUser(userData);
                persistAuth(token, userObject);
                return { success: true, user: userObject };
            }

            return {
                success: false,
                error: response.data?.message || 'Login failed',
            };
        } catch (error) {
            console.error('Login error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                code: error.code,
            });

            let errorMessage = 'Login failed. ';
            if (error.code === 'ECONNABORTED') {
                errorMessage += 'Request timed out. Server might be slow.';
            } else if (error.response?.status === 404) {
                errorMessage += 'Server endpoint not found. Check that the backend is running.';
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage += 'Cannot connect to server. Make sure the backend is running.';
            } else {
                errorMessage += error.response?.data?.message || 'Please check your credentials.';
            }

            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        clearAuthStorage();
        setUser(null);
    };

    const updateUser = (updatedData) => {
        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    // Helpers
    const normalizeUser = (userData) => ({
        id: userData._id || userData.id,
        _id: userData._id || userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isAuthenticated: true,
    });


    const persistAuth = (token, userObject) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userObject));
        setUser(userObject);
    };

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const isAdmin = user?.role === 'admin';
    const isStaff = user?.role === 'staff';
    const getUserRole = () => user?.role || 'guest';
    const hasPermission = (allowedRoles) => {
        if (!user) return false;
        if (!allowedRoles || allowedRoles.length === 0) return true;
        return allowedRoles.includes(user.role);
    };

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
        isTokenExpired,
    };


    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '14px',
                color: 'var(--color-text-secondary, #888)',
            }}>
                Loading...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;