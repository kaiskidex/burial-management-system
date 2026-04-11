import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContexts"; // Make sure this path is correct
import {
  MapPin,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Navigate based on user role if needed
        // You can get the user from localStorage or from the result
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            // Redirect based on role
            if (user.role === 'admin') {
              navigate('/admin/dashboard');
            } else if (user.role === 'staff') {
              navigate('/staff/dashboard');
            } else {
              navigate('/');
            }
          } catch (e) {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } else {
        setError(result.error || "Invalid email or password.");
        setLoading(false);
      }
    } catch (err) {
      // This catches network errors (e.g., server is offline)
      console.error('Login network error:', err);
      setError("Unable to connect to the server. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title from Figma */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4 shadow-md">
            {/* Using local logo file inside the Figma circle */}
            <img
              src="/br.png"
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cemetery Management System
          </h1>
          <p className="text-gray-600 font-medium tracking-wide">
            Local Government Unit
          </p>
        </div>

        {/* Login Card using UI Components */}
        <Card className="p-0 bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Sign In</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Enter your credentials to access the system
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in fade-in duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    // Implement forgot password functionality
                    alert('Please contact your administrator to reset your password.');
                  }}
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-bold shadow-lg shadow-green-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-green-600 hover:text-green-700 font-bold ml-1"
                >
                  Register here
                </Link>
              </p>
            </div>
            
       
           
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-green-800/60 font-medium text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Secure Government Portal</span>
          </div>
          <p className="text-gray-400 text-[10px] text-center">
            © 2026 Local Government Unit. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;