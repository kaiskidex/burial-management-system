import { useState } from "react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Users,
  Key,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/AuthContexts";
import { Badge } from "../components/ui/badge";

const mockUsers = [
  { id: 1, name: "Administrator", email: "admin@cemetery.gov", role: "admin", status: "Active" },
  { id: 2, name: "Maria Santos", email: "maria.santos@cemetery.gov", role: "staff", status: "Active" },
  { id: 3, name: "Juan Dela Cruz", email: "juan.delacruz@cemetery.gov", role: "staff", status: "Active" },
];

export function Settings() {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();

 
  const isAdmin = user?.role === "admin";

  const [verificationCode, setVerificationCode] = useState("LGU2026");
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage system preferences and configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4 bg-white shadow-sm rounded-xl border border-gray-200">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeTab === "profile"
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeTab === "notifications"
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      activeTab === "users"
                        ? "bg-green-100 text-green-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>User Management</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("verification")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      activeTab === "verification"
                        ? "bg-green-100 text-green-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Key className="w-5 h-5" />
                    <span>Verification Code</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab("system")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeTab === "system"
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span>System Info</span>
              </button>
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <Card className="p-6 bg-white shadow-sm rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user?.name} className="mt-2" 
                  readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={user?.email} className="mt-2"
                  readOnly
                   />
                </div>
                <div>
                  <Label>Account Type</Label>
                   <Input
                       value={
                          user?.role === "admin"
                            ? "Administrator"
                            : user?.role === "staff"
                            ? "Staff"
                            : "Public User"
                             }
                            readOnly
                            className="mt-2 bg-gray-100 border-gray-200 cursor-not-allowed"
                            />
                           </div>
              </div>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <Card className="p-6 bg-white shadow-sm rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Notification Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">
                      Receive email alerts for important updates
                    </p>
                  </div>
                  <Switch className="data-[state=checked]:bg-green-600" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Lease Expiration Alerts</p>
                    <p className="text-sm text-gray-500">
                      Get notified when leases are about to expire
                    </p>
                  </div>
                  <Switch className="data-[state=checked]:bg-green-600" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Permit Notifications</p>
                    <p className="text-sm text-gray-500">
                      Alerts for new permit applications
                    </p>
                  </div>
                  <Switch className="data-[state=checked]:bg-green-600" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">System Updates</p>
                    <p className="text-sm text-gray-500">
                      Notifications about system maintenance
                    </p>
                  </div>
                  <Switch className="data-[state=checked]:bg-green-600" />
                </div>
              </div>
            </Card>
          )}

          {/* USER MANAGEMENT */}
{activeTab === "users" && isAdmin && (
  <Card className="p-6 bg-white shadow-sm rounded-xl border border-gray-200">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
      <Button className="bg-green-600 hover:bg-green-700 text-white">
        <Plus className="w-4 h-4 mr-2" />
        Add User
      </Button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>

        <tbody>
  {mockUsers.map((u) => (
    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
      {/* Name */}
      <td className="py-3 px-4 text-sm font-medium text-gray-900">
        {u.name}
      </td>

      {/* Email */}
      <td className="py-3 px-4 text-sm text-gray-600">
        {u.email}
      </td>

      {/* Role */}
      <td className="py-3 px-4">
        <Badge
          className={
            u.role === "admin"
              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
              : "bg-green-100 text-green-800 border-green-300"
          }
        >
          {u.role === "admin" ? "Administrator" : "Staff"}
        </Badge>
      </td>

      
      <td className="py-3 px-4">
        <Badge className="bg-green-100 text-green-700 border-green-300">
          {u.status}
        </Badge>
      </td>

      
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {/* Edit */}
          <button className="text-green-600 hover:text-green-700">
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
      </table>
    </div>
  </Card>
)}

         {/* VERIFICATION */}
{activeTab === "verification" && isAdmin && (
  <Card className="p-6 bg-white shadow-sm rounded-xl border border-gray-200">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">
      Secret Verification Code
    </h2>

    {/* Security Notice */}
    <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
      <p className="text-sm text-yellow-900">
        <span className="font-semibold">Security Notice:</span> This code is required
        for Staff and Admin registration. Keep it confidential and change it regularly.
      </p>
    </div>

    {/* Current Code */}
    <div className="mb-6">
      <Label className="text-gray-900 font-medium">
        Current Verification Code
      </Label>

      <div className="flex items-center gap-3 mt-2">
        <Input
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          className="bg-gray-100 border-gray-200"
        />

        <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
          <Key className="w-4 h-4" />
          Update Code
        </Button>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Staff and Admin users must enter this code during registration
      </p>
    </div>

    {/* Divider */}
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Code Usage Statistics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-500">Last Changed</p>
          <p className="text-lg font-semibold text-gray-900">
            April 1, 2026
          </p>
        </div>

        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-500">Used for Registration</p>
          <p className="text-lg font-semibold text-gray-900">
            12 times
          </p>
        </div>
      </div>
    </div>
  </Card>
)}

{/* SYSTEM */}
{activeTab === "system" && (
  <Card className="p-6 bg-white shadow-sm rounded-xl border border-gray-200">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">
      System Information
    </h2>

    <div className="space-y-4">
      {/* System Version */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <p className="text-gray-600">System Version</p>
        <p className="font-medium text-gray-900">v2.3.1</p>
      </div>

      {/* Last Backup */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <p className="text-gray-600">Last Backup</p>
        <p className="font-medium text-gray-900">
          April 2, 2026 - 02:00 AM
        </p>
      </div>

      {/* Database Size */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <p className="text-gray-600">Database Size</p>
        <p className="font-medium text-gray-900">2.4 GB</p>
      </div>

      {/* Active Users */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <p className="text-gray-600">Active Users</p>
        <p className="font-medium text-gray-900">5</p>
      </div>

      {/* ROLE (DYNAMIC) */}
      <div className="flex justify-between items-center pt-2">
        <p className="text-gray-600">Your Role</p>

        <Badge
  className={
    user?.role === "admin"
      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
      : user?.role === "staff"
      ? "bg-green-100 text-green-800 border-green-300"
      : "bg-blue-100 text-blue-800 border-blue-300"
  }
>
  {user?.role === "admin"
    ? "Administrator"
    : user?.role === "staff"
    ? "Staff"
    : "Public User"}
</Badge>
      </div>
    </div>
  </Card>
)}
          
        </div>
      </div>
    </div>
  );
}