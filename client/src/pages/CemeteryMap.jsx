import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { MapPin, Info, Loader2, Plus, X, AlertTriangle } from "lucide-react";
import { getPlots, generatePlots } from "../services/api.js";
import { useAuth } from "../contexts/AuthContexts";

const computeNextModuleName = (existingSections) => {
  if (!existingSections || existingSections.length === 0) return "Module 1A";

  const sorted = [...existingSections].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
  const lastModule = sorted[sorted.length - 1];
  const code = lastModule.replace("Module ", "");

  const numericPart = parseInt(code.slice(0, -1));
  const letterPart = code.slice(-1);

  if (isNaN(numericPart)) {
    return code === "Z" ? "Module 2A" : `Module ${String.fromCharCode(code.charCodeAt(0) + 1)}`;
  }

  return letterPart === "Z"
    ? `Module ${numericPart + 1}A`
    : `Module ${numericPart}${String.fromCharCode(letterPart.charCodeAt(0) + 1)}`;
};

const PLOTS_PER_MODULE = 20;

// ── Confirmation Modal ─────────────────────────────────────────────────────────
function ConfirmModuleModal({ existingSections, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const nextModule = computeNextModuleName(existingSections);

  const handleGenerate = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      const res = await generatePlots({});
      if (res.data.success) {
        onSuccess(res.data.moduleName);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate module.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-gray-900">New module</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module name preview */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-0.5">
              Next module
            </p>
            <p className="text-base font-bold text-blue-900">{nextModule}</p>
          </div>
        </div>

        {/* Fixed info */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
          <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">
            This will generate <span className="font-semibold text-gray-700">{PLOTS_PER_MODULE} plots</span> under <span className="font-semibold text-gray-700">{nextModule}</span>. This action cannot be undone.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 mb-4 text-center">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Plus className="w-4 h-4" />
            }
            Generate module
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function CemeteryMap() {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { user } = useAuth();
  const role = user?.role;

  const fetchMapData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPlots();
      setPlots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading map:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Fixed: Only update if plot data actually changed to prevent infinite loop
  useEffect(() => {
    if (selectedPlot) {
      const updatedPlot = plots.find(p => p._id === selectedPlot._id);
      if (updatedPlot && JSON.stringify(updatedPlot) !== JSON.stringify(selectedPlot)) {
        setSelectedPlot(updatedPlot);
      }
    }
  }, [plots, selectedPlot]);

  const handleSuccess = async (moduleName) => {
    setShowModal(false);
    await fetchMapData();
  };

  const getPlotColor = (status) => {
    switch (status) {
      case "available": return "bg-green-500 hover:bg-green-600";
      case "occupied":  return "bg-red-500 hover:bg-red-600";
      case "reserved":  return "bg-yellow-500 hover:bg-yellow-600";
      default:          return "bg-gray-300";
    }
  };

  // Memoized calculations for performance
  const groupedSections = useMemo(() => 
    plots.reduce((acc, plot) => {
      const section = plot.section;
      if (!acc[section]) acc[section] = [];
      acc[section].push(plot);
      return acc;
    }, {}), [plots]
  );

  const sortedSectionNames = useMemo(() => 
    Object.keys(groupedSections).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    ), [groupedSections]
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8 text-green-600" />
    </div>
  );

  return (
    <>
      {showModal && (role === "admin" || role === "staff") && (
        <ConfirmModuleModal
          existingSections={sortedSectionNames}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="p-8 bg-[#F9FBFA] min-h-screen">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Cemetery Map</h1>
            <p className="text-gray-500">Real-time status of all cemetery modules</p>
          </div>
          {(role === "admin" || role === "staff") && (
            <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Module
          </button>
          )}
         
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-white shadow-sm border-gray-100">
            <p className="text-gray-500 text-xs font-medium uppercase">Total Plots</p>
            <p className="text-2xl font-bold text-gray-900">{plots.length}</p>
          </Card>
          <Card className="p-4 bg-white shadow-sm border-gray-100 border-l-4 border-l-green-500">
            <p className="text-gray-500 text-xs font-medium uppercase">Available</p>
            <p className="text-2xl font-bold text-green-600">{plots.filter(p => p.status === "available").length}</p>
          </Card>
          <Card className="p-4 bg-white shadow-sm border-gray-100 border-l-4 border-l-yellow-500">
            <p className="text-gray-500 text-xs font-medium uppercase">Reserved</p>
            <p className="text-2xl font-bold text-yellow-600">{plots.filter(p => p.status === "reserved").length}</p>
          </Card>
          <Card className="p-4 bg-white shadow-sm border-gray-100 border-l-4 border-l-red-500">
            <p className="text-gray-500 text-xs font-medium uppercase">Occupied</p>
            <p className="text-2xl font-bold text-red-600">{plots.filter(p => p.status === "occupied").length}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white shadow-sm border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" /> Interactive Grid
                </h2>
                <div className="flex gap-3 text-[10px] font-bold uppercase text-gray-400">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Available</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Reserved</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Occupied</span>
                </div>
              </div>

              <div className="space-y-10">
                {sortedSectionNames.map(sectionName => (
                  <div key={sectionName} className="animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em] border-b pb-2">
                      {sectionName}
                    </h3>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {groupedSections[sectionName]
                        .sort((a, b) => a.plotNumber.localeCompare(b.plotNumber, undefined, { numeric: true }))
                        .map(plot => (
                          <button
                            key={plot._id}
                            onClick={() => setSelectedPlot(plot)}
                            className={`${getPlotColor(plot.status)} aspect-square rounded-lg shadow-sm text-white text-[9px] font-bold transition-all active:scale-90 hover:scale-110 flex items-center justify-center border-2 border-transparent ${selectedPlot?._id === plot._id ? "border-blue-500 ring-2 ring-blue-200" : ""}`}
                          >
                            {plot.plotNumber}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {sortedSectionNames.length === 0 && (
                  <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-2xl">
                    <p className="text-gray-400">No modules generated yet. Click "+ New Module" to begin.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white shadow-sm border-gray-100 sticky top-8">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-blue-500" /> Plot Details
              </h2>

              {selectedPlot ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Location</p>
                      <p className="text-2xl font-bold">{selectedPlot.section}</p>
                      <p className="text-sm text-gray-500 font-medium">Plot #{selectedPlot.plotNumber}</p>
                    </div>
                    <Badge className={`${getPlotColor(selectedPlot.status)} text-white border-none px-3 py-1 rounded-full text-[10px]`}>
                      {selectedPlot.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="h-px bg-gray-100 w-full" />

                  {/* Occupied Plot with Lease Details */}
                  {selectedPlot.status === "occupied" && selectedPlot.occupiedBy ? (
                    <div className="space-y-4">
                      {/* Occupant Information */}
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">
                          Occupant Information
                        </p>
                        <p className="text-lg font-bold text-blue-900 leading-tight mb-1">
                          {selectedPlot.occupiedBy.deceasedName}
                        </p>
                        {selectedPlot.occupiedBy.dateOfDeath && (
                          <p className="text-xs text-blue-600 font-medium">
                            Died: {new Date(selectedPlot.occupiedBy.dateOfDeath).toLocaleDateString(undefined, { dateStyle: "long" })}
                          </p>
                        )}
                        {selectedPlot.occupiedBy.dateOfInterment && (
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            Interment: {new Date(selectedPlot.occupiedBy.dateOfInterment).toLocaleDateString(undefined, { dateStyle: "long" })}
                          </p>
                        )}
                      </div>

                      {/* Lease Information */}
                      {selectedPlot.currentLease ? (
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                          <p className="text-[10px] text-green-600 font-bold uppercase mb-2 flex items-center gap-1">
                            📋 Lease Information
                          </p>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-[10px] text-green-500 font-semibold uppercase">Lessee</p>
                              <p className="text-sm font-bold text-green-900">{selectedPlot.currentLease.ownerName}</p>
                              {selectedPlot.currentLease.ownerEmail && (
                                <p className="text-xs text-green-700">{selectedPlot.currentLease.ownerEmail}</p>
                              )}
                              {selectedPlot.currentLease.ownerContact && (
                                <p className="text-xs text-green-700">{selectedPlot.currentLease.ownerContact}</p>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div>
                                <p className="text-[10px] text-green-500 font-semibold uppercase">Start Date</p>
                                <p className="text-xs text-green-900">
                                  {selectedPlot.currentLease.startDate ? new Date(selectedPlot.currentLease.startDate).toLocaleDateString() : "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-green-500 font-semibold uppercase">Expiry Date</p>
                                <p className="text-xs text-green-900">
                                  {selectedPlot.currentLease.endDate ? new Date(selectedPlot.currentLease.endDate).toLocaleDateString() : "N/A"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[10px] text-green-500 font-semibold uppercase">Duration</p>
                                <p className="text-xs font-semibold text-green-900">{selectedPlot.currentLease.durationYears || 0} years</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-green-500 font-semibold uppercase">Days Left</p>
                                <p className={`text-xs font-semibold ${selectedPlot.currentLease.daysLeft <= 90 && selectedPlot.currentLease.daysLeft > 0 ? 'text-amber-600' : selectedPlot.currentLease.daysLeft === 0 ? 'text-red-600' : 'text-green-900'}`}>
                                  {selectedPlot.currentLease.daysLeft?.toLocaleString() || 0} days
                                </p>
                              </div>
                            </div>
                            
                            {selectedPlot.currentLease.status && (
                              <div>
                                <p className="text-[10px] text-green-500 font-semibold uppercase">Lease Status</p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                                  selectedPlot.currentLease.status === 'active' ? 'bg-green-200 text-green-800' :
                                  selectedPlot.currentLease.status === 'expiring_soon' ? 'bg-amber-200 text-amber-800' :
                                  selectedPlot.currentLease.status === 'expired' ? 'bg-red-200 text-red-800' :
                                  'bg-gray-200 text-gray-800'
                                }`}>
                                  {selectedPlot.currentLease.status === 'expiring_soon' ? 'Expiring Soon' :
                                   selectedPlot.currentLease.status?.charAt(0).toUpperCase() + selectedPlot.currentLease.status?.slice(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-xs text-gray-500 text-center italic">
                            No lease information available for this plot.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : selectedPlot.status === "reserved" && selectedPlot.reservedBy ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                        <p className="text-[10px] text-yellow-500 font-bold uppercase mb-2">
                          Reserved Information
                        </p>
                        <p className="text-lg font-bold text-yellow-900 leading-tight mb-1">
                          {selectedPlot.reservedBy.deceasedName}
                        </p>
                        <p className="text-xs text-yellow-600 font-medium">
                          Reserved by: {selectedPlot.reservedBy.requesterName || "N/A"}
                        </p>
                        <p className="text-xs text-yellow-600 font-medium mt-2">
                          Status: Awaiting interment completion
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-500 text-center italic">
                        This plot is currently {selectedPlot.status}.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400 text-sm">Select a plot from the grid to see burial information</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}