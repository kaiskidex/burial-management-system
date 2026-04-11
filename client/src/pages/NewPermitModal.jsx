import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { X, Search, UserCheck } from "lucide-react";
import { createPermit, getPlots } from "../services/api";

export function NewPermitModal({ isOpen, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [plots, setPlots] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [formData, setFormData] = useState({
    type: "interment",
    requesterName: "",
    requesterContact: "",
    requesterEmail: "",
    deceasedName: "",
    dateOfBirth: "", 
    dateOfDeath: "", 
    plotId: "",
    targetPlotId: "",
    remarks: "",
  });

  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const res = await getPlots();
        setPlots(res.data);
      } catch (err) {
        console.error("Error fetching plots:", err);
      }
    };
    if (isOpen) fetchPlots();
  }, [isOpen]);

  // Search Logic for Exhumation/Transfer
  useEffect(() => {
    if (
      (formData.type === "exhumation" || formData.type === "transfer") &&
      searchTerm.length > 1
    ) {
      const filtered = plots.filter((p) => {
        if (p.status !== "occupied") return false;
        const nameInDatabase = p.occupiedBy?.deceasedName;
        return (
          nameInDatabase &&
          String(nameInDatabase)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      });
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, formData.type, plots]);

  // PULL DATA FROM DATABASE (Date of Birth & Death)
  const handleSelectPerson = (plot) => {
    setFormData({
      ...formData,
      deceasedName: plot.occupiedBy?.deceasedName,
      dateOfBirth: plot.occupiedBy?.dateOfBirth
        ? plot.occupiedBy.dateOfBirth.split("T")[0]
        : "", 
      dateOfDeath: plot.occupiedBy?.dateOfDeath
        ? plot.occupiedBy.dateOfDeath.split("T")[0]
        : "", 
      plotId: plot._id,
    });
    setSearchTerm(plot.occupiedBy?.deceasedName);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPermit(formData);
      onRefresh();
      onClose();
      resetForm();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Server Error"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "interment",
      requesterName: "",
      requesterContact: "",
      requesterEmail: "",
      deceasedName: "",
      dateOfBirth: "",
      dateOfDeath: "",
      plotId: "",
      targetPlotId: "",
      remarks: "",
    });
    setSearchTerm("");
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden border-2 border-gray-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              New Permit Request
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              LGU Burial Management System
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-full p-2"
          >
            <X className="w-5 h-5 text-gray-400" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[80vh] overflow-y-auto"
        >
          {/* Section 1: Application Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Application Type
            </label>
            <select
              className="w-full p-2 rounded-lg border border-gray-300 outline-none"
              value={formData.type}
              onChange={(e) => {
                const val = e.target.value;
                resetForm();
                setFormData((prev) => ({ ...prev, type: val }));
              }}
            >
              <option value="interment">Interment (Burial)</option>
              <option value="exhumation">Exhumation (Removal)</option>
              <option value="transfer">Transfer (Relocation)</option>
            </select>
          </div>

          {/* Section 2: Deceased Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">
              Deceased Information
            </h3>

            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Full Name
              </label>
              {formData.type === "interment" ? (
                <Input
                  required
                  value={formData.deceasedName}
                  onChange={(e) =>
                    setFormData({ ...formData, deceasedName: e.target.value })
                  }
                />
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    required
                    placeholder="Search existing records..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm.length > 1 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {searchResults.map((plot) => (
                        <div
                          key={plot._id}
                          onClick={() => handleSelectPerson(plot)}
                          className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                        >
                          <span className="text-sm font-medium">
                            {plot.occupiedBy?.deceasedName}
                          </span>
                          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded">
                            Plot {plot.section}-{plot.plotNumber}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Date of Birth
                </label>
                <Input
                  required
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Date of Death
                </label>
                <Input
                  required
                  type="date"
                  value={formData.dateOfDeath}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfDeath: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 3: Requester Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">
              Requester Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                required
                placeholder="Requester Name"
                value={formData.requesterName}
                onChange={(e) =>
                  setFormData({ ...formData, requesterName: e.target.value })
                }
              />
              <Input
                required
                placeholder="Contact #"
                value={formData.requesterContact}
                onChange={(e) =>
                  setFormData({ ...formData, requesterContact: e.target.value })
                }
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.requesterEmail}
                onChange={(e) =>
                  setFormData({ ...formData, requesterEmail: e.target.value })
                }
              />
            </div>
          </div>

          {/* Section 4: Plot Assignment */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">
              Plot Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Plot Selection (Target for Interment / Current for Exhumation-Transfer) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  {formData.type === "interment"
                    ? "Target Plot"
                    : "Current Plot"}
                </label>
                <select
                  required
                  className={`w-full p-2 rounded-lg border transition-colors ${
                    formData.type !== "interment"
                      ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  }`}
                  value={formData.plotId}
                  disabled={formData.type !== "interment"}
                  onChange={(e) =>
                    setFormData({ ...formData, plotId: e.target.value })
                  }
                >
                  <option value="">Select Plot...</option>

                  {formData.type === "interment"
                    ? // For Interment: Show ONLY available plots
                      plots
                        .filter((p) => p.status === "available")
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            Section {p.section} - Plot #{p.plotNumber}
                          </option>
                        ))
                    : // For Exhumation/Transfer: Show the specifically selected occupied plot
                      plots
                        .filter((p) => p._id === formData.plotId)
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            Section {p.section} - Plot #{p.plotNumber} (Current)
                          </option>
                        ))}
                </select>
                {formData.type === "interment" && (
                  <p className="text-[10px] text-gray-400 italic">
                    Only available plots are listed for new burials.
                  </p>
                )}
              </div>

              {/* Section for Transfer Destination */}
              {formData.type === "transfer" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                  <label className="text-xs font-bold text-green-600 uppercase">
                    New Destination
                  </label>
                  <select
                    required
                    className="w-full p-2 rounded-lg border border-blue-300 bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.targetPlotId}
                    onChange={(e) =>
                      setFormData({ ...formData, targetPlotId: e.target.value })
                    }
                  >
                    <option value="">Select available...</option>
                    {plots
                      .filter((p) => p.status === "available")
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          Section {p.section} - Plot #{p.plotNumber}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 py-6 bg-green-600 text-white font-bold"
            >
              {loading ? "Submitting..." : "Submit Permit Request"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
