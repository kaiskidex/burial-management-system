import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContexts';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import { Register } from './pages/Register';
import { Leases } from './pages/Leases';
import { Permits } from "./pages/Permits";
import { Reports } from "./pages/Reports";
import { Dashboard } from './pages/Dashboard';
import { BurialRecords } from './pages/BurialRecords';
import { CemeteryMap } from "./pages/CemeteryMap";
import { Settings } from "./pages/Settings";
import AddBurialRecord from './pages/AddBurialRecord';
import EditBurial from "./pages/EditBurial";
import EditExhumation from "./pages/EditExhumation";
import EditTransfer from "./pages/EditTransfer";
import api from './services/api';

// Protected route wrapper logic
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, logout } = useAuth();

  // If we are still checking the token, show the spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F9FBFA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // If the bouncer says you aren't logged in, go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If we are authenticated, show the dashboard/content
  return children;
};

// Internal Dashboard Layout (Only accessible if logged in)
const AppContent = () => {
  const [burials, setBurials] = useState([]);
  const { user } = useAuth();

  const fetchBurials = async () => {
    try {
      const res = await api.get('/burials'); 
      setBurials(res.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchBurials();
  }, []); // Runs once when the user logs in and the app content loads

  return (
    <div className="flex bg-[#F9FBFA] min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <Routes>
          <Route path="/" element={<Dashboard burials={burials} />} />
          <Route path="/dashboard" element={<Dashboard burials={burials} />} />
          
          <Route path="/admin/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/staff/dashboard" element={<Navigate to="/" replace />} />

          <Route path="/map" element={<CemeteryMap />} />
          <Route path="/add-burial" element={<AddBurialRecord onSuccess={fetchBurials} />} />
          <Route path="/leases" element={<Leases />} />
          <Route path="/permits" element={<Permits />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/records" element={<BurialRecords />} />
          <Route path="/settings" element={<Settings />} />
          
          <Route path="/edit-burial/:id" element={<EditBurial onSuccess={fetchBurials} />} />
          <Route path="/edit-exhumation/:id" element={<EditExhumation onSuccess={fetchBurials} />} />
          <Route path="/edit-transfer/:id" element={<EditTransfer onSuccess={fetchBurials} />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// Main App Component (Routing Tree)
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes (AppContent is wrapped in ProtectedRoute) */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;