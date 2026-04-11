import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../contexts/AuthContexts";
import { MapPin, AlertCircle, CheckCircle, Shield } from "lucide-react";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Role Selection Validation
    if (!userRole) {
      setError("Please select a user role");
      return;
    }

    // Secret Verification Logic (Only for Staff/Admin)
    // Only check if they provided a code; don't hardcode "LGU2026" here!
    if ((userRole === "staff" || userRole === "admin") && !verificationCode) {
      setError("Please enter the LGU authorization code");
      return;
    }

    // Password Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Note: verificationCode is sent as the 5th argument, 
      // which matches 'secretCode' in your AuthContexts.js
      const result = await register(name, email, password, userRole, verificationCode);

      if (result.success) {
        navigate("/dashboard");
      } else {
        // This will now show the actual error from the backend (e.g., "Invalid secret code")
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Title from Figma */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4 shadow-md">
                        {/* Using local logo file inside the Figma circle */}
                        <img src="/br.png" alt="Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Cemetery Management System</h1>
                    <p className="text-gray-600 font-medium tracking-wide">Local Government Unit</p>
                </div>

        {/* Register Card */}
        <Card className="p-8 bg-white shadow-xl rounded-2xl border border-gray-200">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Create Account</h2>
            <p className="text-gray-500 text-sm mt-1">Select your role to get started</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded flex items-start gap-3 animate-in fade-in zoom-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan.delacruz@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userRole">Account Type</Label>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Identify your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public (Viewer/Applicant)</SelectItem>
                  <SelectItem value="staff">Cemetery Staff (Clerk)</SelectItem>
                  <SelectItem value="admin">System Administrator</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2 p-2 bg-gray-50 rounded text-[11px] text-gray-500 leading-tight border border-gray-100 italic">
                {userRole === "public" && "Access: Search map, view records, and submit burial permits."}
                {userRole === "staff" && "Access: Verify permits, update plot status, and generate reports."}
                {userRole === "admin" && "Access: Full control, delete records, and manage user accounts."}
                {!userRole && "Please choose a role to see permission details."}
              </div>
            </div>

            {/* Secret Field - Dynamic Reveal */}
            {(userRole === "staff" || userRole === "admin") && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3 animate-in slide-in-from-top-4 duration-500">
                <Label htmlFor="verificationCode" className="flex items-center gap-2 text-yellow-900 font-bold">
                  <Shield className="w-4 h-4" />
                  Authorization Required
                </Label>
                <Input
                  id="verificationCode"
                  type="password"
                  placeholder="Enter 6-digit Secret Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="border-yellow-300 focus:ring-yellow-400 bg-white"
                />
                <p className="text-[10px] text-yellow-700 font-medium">
                  Input the code provided by the LGU head office.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 font-semibold py-6 transition-all"
            >
              {isLoading ? "Processing..." : "Create Account"}
            </Button>

            

            
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/" className="text-green-600 hover:text-green-700 font-bold">
                Sign in
              </Link>
            </p>
          </div>
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
}