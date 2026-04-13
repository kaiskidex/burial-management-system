import { useState, useEffect, useRef } from "react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

import {
  Search,
  Users,
  MapPin,
  FileWarning,
  ClipboardList,
  Edit2,
  Trash2,
  Loader2,
  Eye,
  User,
  Calendar,
  MapPinned,
  Info,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  FileSignature,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContexts";
import { getBurialRecords, deleteBurialRecord, getPlots, getPermits, getLeases, getMyLeases } from "../services/api.js";
import { useNavigate } from "react-router-dom";


// Then in the fetchUserLeases function:
const res = await getMyLeases();

export function Dashboard({ burials: propBurials }) {
  const { user } = useAuth();
  const role = user?.role;
  const navigate = useNavigate();

  // State for admin/staff dashboard
  const [totalBurials, setTotalBurials] = useState(0);
  const [occupiedPlots, setOccupiedPlots] = useState(0);
  const [expiringLeasesCount, setExpiringLeasesCount] = useState(0);
  const [pendingPermitsCount, setPendingPermitsCount] = useState(0);
  const [permits, setPermits] = useState([]);
  const [expiringLeases, setExpiringLeases] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [plots, setPlots] = useState([]);
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for public dashboard search
  const [publicSearchQuery, setPublicSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [highlightedPlotId, setHighlightedPlotId] = useState(null);
  
  // State for public user's leases
  const [userLeases, setUserLeases] = useState([]);
  const [loadingLeases, setLoadingLeases] = useState(false);
  
  // Refs for scrolling to highlighted plot
  const plotRefs = useRef({});

  const summaryStats = [
    { title: "Total Burials", value: totalBurials, icon: Users },
    { title: "Occupied Plots", value: occupiedPlots, icon: MapPin },
    { title: "Expiring Leases", value: expiringLeasesCount, icon: FileWarning },
    { title: "Pending Permits", value: pendingPermitsCount, icon: ClipboardList },
  ];

  // FETCH CEMETERY MAP (for all roles)
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return; // DON'T FETCH IF NO TOKEN

  const fetchPlots = async () => {
    try {
      const res = await getPlots();
      setPlots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading plots:", err);
    } finally {
      setLoadingPlots(false);
    }
  };
  fetchPlots();
}, []);

// FETCH USER LEASES (for public users)
useEffect(() => {
  const token = localStorage.getItem('token');
  const fetchUserLeases = async () => {
    // Added token check here
    if (token && role === 'public' && user?.email) {
      setLoadingLeases(true);
      try {
        const res = await getMyLeases();
        const leasesData = res.data.data || res.data || [];
        const activeLeases = leasesData.filter(lease => 
          ['Active', 'active', 'Expiring Soon', 'expiring_soon'].includes(lease.status)
        );
        setUserLeases(activeLeases);
      } catch (err) {
        console.error("Error fetching user leases:", err);
      } finally {
        setLoadingLeases(false);
      }
    }
  };
  fetchUserLeases();
}, [role, user?.email]);

  // FETCH RECENT RECORDS (admin/staff only)
  const fetchRecent = async () => {
    try {
      setLoadingRecords(true);
      const res = await getBurialRecords();
      const sorted = res.data
        .sort((a, b) => new Date(b.dateOfInterment) - new Date(a.dateOfInterment))
        .slice(0, 5);
      setRecentRecords(sorted);
    } catch (err) {
      console.error("Failed to fetch recent records", err);
    } finally {
      setLoadingRecords(false);
    }
  };
  
  // FETCH TOTAL BURIAL (admin/staff only)
  const fetchBurials = async () => {
    try {
      const res = await getBurialRecords();
      setTotalBurials(res.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  // FETCH OCCUPIED PLOTS (admin/staff only)
  const fetchPlotsData = async () => {
    try {
      const res = await getPlots();
      const plotsData = res.data;
      setOccupiedPlots(plotsData.filter(p => p.status === "occupied").length);
    } catch (err) {
      console.error(err);
    }
  };

  // FETCH PENDING PERMITS (admin/staff only)
  const fetchPermitsData = async () => {
    try {
      const res = await getPermits();
      const pending = res.data.filter(p => p.status === "pending");
      setPendingPermitsCount(pending.length);
      setPermits(pending.slice(0, 2));
    } catch (err) {
      console.error(err);
    }
  };

  // FETCH EXPIRING LEASES (admin/staff only)
  const fetchExpiringLeases = async () => {
    try {
      const res = await getLeases();
      const leasesData = res.data.data || res.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      const expiring = leasesData.filter(lease => {
        const expiryDate = new Date(lease.expiryDate || lease.endDate);
        expiryDate.setHours(0, 0, 0, 0);
        const isActive = lease.status === 'Active' || lease.status === 'active' || lease.status === 'Expiring Soon' || lease.status === 'expiring_soon';
        const isWithin30Days = expiryDate >= today && expiryDate <= thirtyDaysLater;
        return isActive && isWithin30Days;
      });
      
      setExpiringLeasesCount(expiring.length);
      setExpiringLeases(expiring.slice(0, 3));
    } catch (err) {
      console.error("Error fetching expiring leases:", err);
      setExpiringLeasesCount(0);
      setExpiringLeases([]);
    }
  };

  // Load admin/staff data only for those roles
useEffect(() => {
  const token = localStorage.getItem('token');

  if (token && (role === 'admin' || role === 'staff')) {
    fetchRecent();
    fetchBurials();
    fetchPlotsData();
    fetchPermitsData();
    fetchExpiringLeases();
  }
}, [role, user]);

  // DELETE HANDLER (ADMIN ONLY)
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteBurialRecord(id);
        fetchRecent();
        fetchBurials();
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete record.");
      }
    }
  };

  const getPlotColor = (status) => {
    switch (status) {
      case "available": return "bg-green-500 hover:bg-green-600";
      case "occupied": return "bg-red-500 hover:bg-red-600";
      case "reserved": return "bg-yellow-500 hover:bg-yellow-600";
      default: return "bg-gray-300";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Scroll to highlighted plot
  const scrollToPlot = (plotId) => {
    if (plotRefs.current[plotId]) {
      plotRefs.current[plotId].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  // Public user search handler with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (publicSearchQuery.trim()) {
        handlePublicSearch();
      } else {
        setSearchResults([]);
        setSelectedRecord(null);
        setHighlightedPlotId(null);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [publicSearchQuery]);

  const handlePublicSearch = async () => {
    const token = localStorage.getItem('token');
    if (!publicSearchQuery.trim() || !token) return;
    
    setPublicLoading(true);
    try {
      const res = await getBurialRecords();
      const query = publicSearchQuery.toLowerCase().trim();
      
      const filtered = res.data.filter((record) => {
        const nameMatch = record.deceasedName?.toLowerCase().includes(query);
        const plotString = record.plotId
          ? `${record.plotId.section}-${record.plotId.plotNumber}`.toLowerCase()
          : "";
        const plotMatch = plotString.includes(query);
        return nameMatch || plotMatch;
      });
      
      setSearchResults(filtered);
      if (filtered.length === 1) {
        setSelectedRecord(filtered[0]);
        // Highlight the plot if found
        if (filtered[0].plotId) {
          setHighlightedPlotId(filtered[0].plotId._id);
          setTimeout(() => scrollToPlot(filtered[0].plotId._id), 100);
        }
      } else {
        setSelectedRecord(null);
        setHighlightedPlotId(null);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setPublicLoading(false);
    }
  };

  const handleSelectRecord = (record) => {
    setSelectedRecord(record);
    if (record.plotId) {
      setHighlightedPlotId(record.plotId._id);
      setTimeout(() => scrollToPlot(record.plotId._id), 100);
    }
  };

  // Helper to get lease status color
  const getLeaseStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'active') return 'bg-green-100 text-green-800 border-green-200';
    if (statusLower === 'expiring_soon') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (statusLower === 'expired') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // PUBLIC USER VIEW 
  if (role === 'public') {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        {/* Welcome Banner */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">Welcome, {user?.name || "Guest"}!</h2>
              <p className="text-gray-600 mt-1">
                You have public access to search burial records and view the cemetery map.
                You can also submit permit applications by clicking the button.
              </p>
            </div>
            <Button 
              onClick={() => navigate("/permits")}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Submit Permit Application
            </Button>
          </div>
        </Card>
        
        {/* My Leases Section - Public User */}
        {!loadingLeases && userLeases.length > 0 && (
          <div className="mt-8">
            <Card className="p-6 bg-white shadow-sm border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileSignature className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">My Active Leases</h2>
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {userLeases.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userLeases.map((lease) => (
                  <div key={lease.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <MapPinned className="w-4 h-4 text-green-600" />
                        <span className="font-mono text-sm font-semibold text-gray-900">{lease.plot}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLeaseStatusColor(lease.status)}`}>
                        {lease.status === 'Expiring Soon' ? (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        ) : lease.status === 'Active' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : null}
                        {lease.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">{lease.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          {lease.startDate} → {lease.expiryDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className={`font-medium ${lease.daysLeft <= 90 && lease.daysLeft > 0 ? 'text-amber-600' : lease.daysLeft === 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {lease.daysLeft} days remaining
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">{lease.years} year lease</span>
                      </div>
                    </div>

                    {lease.daysLeft <= 90 && lease.daysLeft > 0 && (
                      <div className="mt-3 pt-2 border-t border-amber-100">
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Your lease is expiring soon. Please contact the office for renewal.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

             
            </Card>
          </div>
        )}

        {!loadingLeases && userLeases.length === 0 && role === 'public' && (
          <div className="mt-8">
            <Card className="p-6 bg-white shadow-sm border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <FileSignature className="w-5 h-5 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-700">My Leases</h2>
              </div>
              <p className="text-gray-400 text-sm text-center py-4">
                You don't have any active leases at the moment.
              </p>
            </Card>
          </div>
        )}
       
        {/* Search Bar - Prominent at the top */}
        <Card className="p-6 mb-8 mt-8 shadow-sm">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by deceased name or plot number (e.g., Juan, A-001)..."
                  className="pl-10 h-12 text-base"
                  value={publicSearchQuery}
                  onChange={(e) => setPublicSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePublicSearch()}
                />
              </div>
              <Button 
                onClick={handlePublicSearch} 
                className="h-12 px-6 bg-green-600 hover:bg-green-700"
                disabled={publicLoading}
              >
                {publicLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Search by full or partial name, or plot number (e.g., A-001)
            </p>
          </div>
        </Card>

        {/* Results Count */}
        {publicSearchQuery && !publicLoading && (
          <div className="mb-4 text-sm text-gray-500">
            Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{publicSearchQuery}"
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cemetery Map */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white shadow-sm border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Cemetery Map
                </h2>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Available</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm"></div> Reserved</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Occupied</span>
                </div>
              </div>

              {loadingPlots ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin w-6 h-6 text-green-600" /></div>
              ) : (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {Object.keys(plots.reduce((acc, plot) => {
                    const section = plot.section;
                    if (!acc[section]) acc[section] = [];
                    acc[section].push(plot);
                    return acc;
                  }, {})).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((sectionName) => {
                    const sectionPlots = plots.filter((p) => p.section === sectionName);
                    return (
                      <div key={sectionName}>
                        <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase">{sectionName}</h3>
                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                          {sectionPlots.sort((a, b) => a.plotNumber.localeCompare(b.plotNumber, undefined, { numeric: true })).map((plot) => (
                            <div
                              key={plot._id}
                              ref={el => plotRefs.current[plot._id] = el}
                              className={`${getPlotColor(plot.status)} aspect-square rounded-lg text-white text-[9px] font-bold flex items-center justify-center transition-all duration-300 ${
                                highlightedPlotId === plot._id 
                                  ? 'ring-4 ring-blue-500 scale-110 z-10 shadow-lg' 
                                  : 'hover:scale-110'
                              }`}
                              title={`Plot ${plot.plotNumber} - ${plot.status.toUpperCase()} ${
                                plot.status === 'occupied'
                                ? `(Deceased: ${plot.occupiedBy?.deceasedName || 'Unknown'})`
                                : plot.status === 'reserved'
                                ? `(Reserved by: ${plot.reservedBy?.reservantName || plot.reservedBy?.requesterName || 'Unknown'})`
                                : ''
                              }`}
                            >
                              {plot.plotNumber}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
          
          

          {/* Search Results / Details Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white shadow-sm border-gray-100 sticky top-8">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-blue-500" />
                Burial Information
              </h2>

              {publicLoading && (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin w-6 h-6 text-green-600" /></div>
              )}

              {!publicLoading && searchResults.length === 0 && publicSearchQuery && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm">No burial records found matching "{publicSearchQuery}".</p>
                  <p className="text-gray-400 text-xs mt-2">Try searching by name or plot number.</p>
                </div>
              )}

              {!publicLoading && searchResults.length > 0 && !selectedRecord && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-3">Click on a record below to view details:</p>
                  {searchResults.map((record) => (
                    <button 
                      key={record._id} 
                      onClick={() => handleSelectRecord(record)} 
                      className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{record.deceasedName}</p>
                      <p className="text-xs text-gray-500 mt-1">Plot: {record.plotId ? `${record.plotId.section}-${record.plotId.plotNumber}` : "N/A"}</p>
                      <p className="text-xs text-gray-400">Interment: {formatDate(record.dateOfInterment)}</p>
                    </button>
                  ))}
                </div>
              )}

              {!publicLoading && selectedRecord && (
                <div className="space-y-4">
                  <button onClick={() => setSelectedRecord(null)} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">← Back to results</button>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] text-blue-400 font-bold uppercase mb-2 flex items-center gap-1"><User className="w-3 h-3" /> Deceased Information</p>
                    <p className="text-lg font-bold text-blue-900 leading-tight mb-1">{selectedRecord.deceasedName}</p>
                    {selectedRecord.dateOfDeath && <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" /> Died: {formatDate(selectedRecord.dateOfDeath)}</p>}
                    {selectedRecord.dateOfBirth && <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" /> Born: {formatDate(selectedRecord.dateOfBirth)}</p>}
                  </div>

                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-[10px] text-green-500 font-bold uppercase mb-2 flex items-center gap-1"><MapPinned className="w-3 h-3" /> Plot Information</p>
                    {selectedRecord.plotId ? (
                      <>
                        <p className="text-sm font-bold text-green-900">{selectedRecord.plotId.section}-{selectedRecord.plotId.plotNumber}</p>
                        <p className="text-xs text-green-700 mt-1">Status: {selectedRecord.status === 'exhumed' ? 'Exhumed' : 'Occupied'}</p>
                      </>
                    ) : <p className="text-sm text-green-700 italic">No plot assigned</p>}
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[10px] text-amber-600 font-bold uppercase mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Interment Information</p>
                    {selectedRecord.dateOfInterment ? (
                      <>
                        <p className="text-sm font-bold text-amber-900">{formatDate(selectedRecord.dateOfInterment)}</p>
                        <p className="text-xs text-amber-700 mt-1">This burial has been completed.</p>
                      </>
                    ) : <p className="text-sm text-amber-700 italic">Interment date not available</p>}
                  </div>

                  {selectedRecord.status === 'exhumed' && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                      <p className="text-xs text-red-600 font-medium">⚠️ This record has been exhumed</p>
                    </div>
                  )}
                </div>
              )}

              {!publicLoading && !publicSearchQuery && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400 text-sm">Enter a name or plot number above to search</p>
                  <p className="text-gray-400 text-xs mt-2">Example: "Juan" or "A-001"</p>
                </div>
              )}
            </Card>
          </div>
        </div>
 
      </div>
    );
  }
        

  // ADMIN & STAFF VIEW 
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Cemetery Records Management System</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {summaryStats.map((stat, i) => (
          <Card key={i} className="p-6 !flex-row items-center justify-between rounded-xl shadow-sm">
            <div>
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${i === 0 ? "bg-blue-500" : i === 1 ? "bg-red-500" : i === 2 ? "bg-orange-500" : "bg-purple-500"}`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-8 mb-8">
        {/* MAP */}
        <Card className="p-6 col-span-2 bg-white shadow-sm border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2"><MapPin className="w-5 h-5 text-green-600" /> Cemetery Map</h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Available</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm"></div> Reserved</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Occupied</span>
            </div>
          </div>

          {loadingPlots ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin w-6 h-6 text-green-600" /></div>
          ) : (
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
              {Object.keys(plots.reduce((acc, plot) => {
                const section = plot.section;
                if (!acc[section]) acc[section] = [];
                acc[section].push(plot);
                return acc;
              }, {})).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((sectionName) => {
                const sectionPlots = plots.filter((p) => p.section === sectionName);
                return (
                  <div key={sectionName}>
                    <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase">{sectionName}</h3>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {sectionPlots.sort((a, b) => a.plotNumber.localeCompare(b.plotNumber, undefined, { numeric: true })).map((plot) => (
                        <div key={plot._id} className={`${getPlotColor(plot.status)} aspect-square rounded-lg text-white text-[9px] font-bold flex items-center justify-center`} title={`Plot ${plot.plotNumber} - ${plot.status}`}>
                          {plot.plotNumber}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="col-span-1">
          {/* EXPIRING LEASES */}
          <Card className="p-5 mb-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2"><div className="bg-orange-100 p-2 rounded-lg"><FileWarning className="w-4 h-4 text-orange-600" /></div><h3 className="font-semibold text-gray-800">Expiring Leases</h3></div>
              <Button variant="outline" size="sm" onClick={() => navigate("/leases")}>View All</Button>
            </div>
            {expiringLeases.length === 0 ? <div className="text-center py-6 text-gray-400 text-sm">No expiring leases found.</div> : expiringLeases.map((l, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b last:border-none">
                <div><p className="font-medium text-gray-900">{l.name}</p><p className="text-sm text-gray-500">Plot: {l.plot}</p></div>
                <span className="bg-orange-100 text-orange-700 border border-orange-300 px-3 py-1 rounded-full text-xs font-medium">{new Date(l.expiryDate).toLocaleDateString()}</span>
              </div>
            ))}
          </Card>

          {/* PENDING PERMITS */}
          <Card className="p-5 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2"><div className="bg-purple-100 p-2 rounded-lg"><ClipboardList className="w-4 h-4 text-purple-600" /></div><h3 className="font-semibold text-gray-800">Pending Permits</h3></div>
              <Button variant="outline" size="sm" onClick={() => navigate("/permits")}>Manage</Button>
            </div>
            {permits.length === 0 ? <div className="text-center py-6 text-gray-400 text-sm">No pending permits.</div> : permits.map((p) => (
              <div key={p._id} className="flex justify-between items-center py-3 border-b last:border-none">
                <div><p className="font-medium text-gray-900">{p.deceasedName}</p><p className="text-sm text-gray-500">{p.type || "Burial Permit"}</p></div>
                <span className="bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1 rounded-full text-xs font-medium">{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* RECENT RECORDS */}
      <Card className="p-6 mb-8 bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-semibold text-gray-900">Recent Burial Records</h2></div>
        {loadingRecords ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Date of Death</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Date of Burial</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Plot Number</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr></thead>
              <tbody>
                {recentRecords.map((r) => (
                  <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-5 px-4 font-medium text-gray-900">{r.deceasedName}</td>
                    <td className="py-5 px-4 text-gray-600">{new Date(r.dateOfDeath).toLocaleDateString()}</td>
                    <td className="py-5 px-4 text-gray-600">{new Date(r.dateOfInterment).toLocaleDateString()}</td>
                    <td className="py-5 px-4 font-semibold text-gray-900">{r.status === 'exhumed' ? <span className="text-red-500 italic">Exhumed</span> : r.plotId ? `${r.plotId.section}-${r.plotId.plotNumber}` : "N/A"}</td>
                    <td className="py-5 px-4">{r.status === 'exhumed' ? <span className="bg-red-100 text-red-700 border border-red-300 px-3 py-1 rounded-full text-sm font-medium">Exhumed</span> : <span className="bg-green-100 text-green-700 border border-green-300 px-3 py-1 rounded-full text-sm font-medium">Completed</span>}</td>
                    <td className="py-5 px-4 flex gap-2">
                      <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={() => navigate(`/records`)} title="View Record"><Eye className="w-4 h-4" /></Button>
                      {role === "admin" && r.status !== 'exhumed' && (<Button size="sm" variant="ghost" className="text-green-600" onClick={() => navigate(`/edit-burial/${r._id}`)}><Edit2 className="w-4 h-4" /></Button>)}
                      {role === "admin" && r.status !== 'exhumed' && (<Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(r._id)}><Trash2 className="w-4 h-4" /></Button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SEARCH */}
      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Search Burial Records</h2>
        <div className="flex gap-2">
          <Input placeholder="Search by name or plot..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePublicSearch()} />
          <Button onClick={handlePublicSearch}><Search className="w-4 h-4 mr-1" /> Search</Button>
        </div>
      </Card>
    </div>
  );
}