import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContexts';
import { LayoutDashboard, Folder, MapPin, FileText, ClipboardList, BarChart3, Settings, LogOut } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
 const menuItems = [
  { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/', roles: ['admin', 'staff', 'public'] },
  { name: 'Records', icon: <Folder size={18} />, path: '/records', roles: ['admin', 'staff'] },
  { name: 'Cemetery Map', icon: <MapPin size={18} />, path: '/map', roles: ['admin', 'staff', 'public'] },
  { name: 'Leases', icon: <FileText size={18} />, path: '/leases', roles: ['admin', 'staff'] },
  { name: 'Permits', icon: <ClipboardList size={18} />, path: '/permits', roles: ['admin', 'staff'] },
  { name: 'Reports', icon: <BarChart3 size={18} />, path: '/reports', roles: ['admin', 'staff'] },
  { name: 'Settings', icon: <Settings size={18} />, path: '/settings', roles: ['admin', 'staff', 'public'] },
];
   

  const getRoleStyle = (role) => {
  switch (role) {
    case "admin":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "staff":
      return "bg-green-100 text-green-700 border-green-300";
    case "public":
      return "bg-blue-100 text-blue-700 border-blue-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

  const getRoleLabel = (role) => {
  switch (role) {
    case "admin":
      return "Admin User";
    case "staff":
      return "Staff User";
    case "public":
      return "Public User";
    default:
      return "User";
  }
};

  return (
    <div className="w-64 h-screen fixed top-0 left-0 flex flex-col bg-[#F2F4F3] border-r border-gray-200">
       <div className="bg-green-600 text-white px-5 py-5 flex items-center gap-3">
        <img
        src="br.png"
        alt="logo"
        className="w-10 h-10 object-contain rounded-lg"
        />
       <div className="flex flex-col leading-tight">
           <h1 className="text-base font-semibold">
           Cemetery Management
          </h1>
          <p className="text-sm opacity-90">
           Local Government Unit
          </p>
      </div>
      </div>

     <nav className="flex-1 p-4">
  {menuItems
    .filter(item => item.roles.includes(user?.role))
    .map((item) => (
      <Link 
        key={item.name} 
        to={item.path}
        className={`flex items-center gap-3 p-3 mb-1 rounded-lg transition-all ${
          location.pathname === item.path 
            ? 'bg-green-100 text-green-700 font-semibold'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span>{item.icon}</span>
        <span className="font-medium text-sm">{item.name}</span>
      </Link>
    ))}
</nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
               <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0) || "A"}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {user?.name || "Administrator"}
            </p>
            <p className="text-xs text-gray-500">
              {user?.email || "admin@cemetery.gov"}
            </p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-md font-medium border ${getRoleStyle(user?.role)}`}>
          {getRoleLabel(user?.role) || "Administrator"}
        </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 w-full p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all text-sm"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;