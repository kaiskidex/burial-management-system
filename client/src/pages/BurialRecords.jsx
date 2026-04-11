import { useState, useEffect, useCallback } from "react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, Download, Plus, Edit2, Trash2, Loader2, CheckCircle, ClockIcon } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/AuthContexts";
import { getBurialRecords, deleteBurialRecord, getPermits, completePermit } from "../services/api.js";
import { useNavigate } from "react-router-dom";

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "interment",   label: "Burial Records" },
  { key: "exhumation",  label: "Exhumation Records" },
  { key: "transfer",    label: "Transfer Records" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

const shortId = (id) => `#${id?.slice(-4).toUpperCase()}`;

const plotLabel = (plotId) =>
  plotId ? `${plotId.section}-${plotId.plotNumber}` : "Unassigned";

// ─── Date Modal Component ─────────────────────────────────────────────────────
function DateCompletionModal({ isOpen, onClose, onSubmit, permitType, initialDate = "" }) {
  const [date, setDate] = useState(initialDate);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (permitType) {
      case "interment":
        return "Enter Interment Date";
      case "exhumation":
        return "Enter Exhumation Date";
      case "transfer":
        return "Enter Transfer Date";
      default:
        return "Enter Completion Date";
    }
  };

  const getLabel = () => {
    switch (permitType) {
      case "interment":
        return "Interment Date";
      case "exhumation":
        return "Exhumation Date";
      case "transfer":
        return "Transfer Date";
      default:
        return "Date";
    }
  };

  const handleSubmit = () => {
    if (!date) {
      alert(`Please select a ${getLabel()}`);
      return;
    }
    onSubmit(date);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{getTitle()}</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getLabel()}
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleSubmit}>
            Complete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Pending Permits Block ─────────────────────────────────────────────────────
function PendingPermitsBlock({ permits, onComplete, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-green-600" />
      </div>
    );
  }

  if (permits.length === 0) {
    return (
      <div className="flex items-center gap-2 py-5 px-2 text-sm text-gray-400 italic">
        <CheckCircle className="w-4 h-4 text-green-400" />
        No approved permits awaiting completion.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Permit ID</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Deceased</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Plot</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Requester</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Submitted</th>
            <th className="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {permits.map((permit) => (
            <tr key={permit._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-3 font-mono text-xs text-gray-400">{shortId(permit._id)}</td>
              <td className="py-3 px-3 font-medium text-gray-900">{permit.deceasedName}</td>
              <td className="py-3 px-3 text-gray-600">
                {plotLabel(permit.plotId)}
                {permit.type === "transfer" && permit.targetPlotId && (
                  <span className="text-blue-500 font-medium ml-1">
                    → {plotLabel(permit.targetPlotId)}
                  </span>
                )}
              </td>
              <td className="py-3 px-3 text-gray-600">{permit.requesterName || "—"}</td>
              <td className="py-3 px-3 text-gray-500">{fmt(permit.createdAt)}</td>
              <td className="py-3 px-3 text-right">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-auto shadow-sm"
                  onClick={() => onComplete(permit)}
                >
                  Complete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Burial Records Table ──────────────────────────────────────────────────────
function BurialTable({ records, loading, searchQuery, onEdit, onDelete }) {
  const filtered = records.filter(
    (r) =>
      r.deceasedName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.plotId?.plotNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-7 h-7 animate-spin text-green-600" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-400 italic">
        {searchQuery ? `No records matching "${searchQuery}"` : "No burial records found."}
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
          <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deceased name</th>
          <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of death</th>
          <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Interment date</th>
          <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plot</th>
          <th className="py-3 px-5"></th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((record) => (
          <tr key={record._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
            <td className="py-3 px-5 font-mono text-xs text-gray-400">{shortId(record._id)}</td>
            <td className="py-3 px-5 font-medium text-gray-900">{record.deceasedName}</td>
            <td className="py-3 px-5 text-gray-600">{fmt(record.dateOfDeath)}</td>
            <td className="py-3 px-5 text-gray-600">{record.dateOfInterment ? fmt(record.dateOfInterment) : "-"}</td>
            <td className="py-3 px-5">
              {record.status === 'exhumed' ? (
                <span className="text-red-500 font-medium italic">Exhumed</span>
              ) : (
                <span className="text-gray-700 font-medium">{plotLabel(record.plotId)}</span>
              )}
            </td>
            <td className="py-3 px-5">
              <div className="flex gap-1 justify-end">
                {record.status !== 'exhumed' && onEdit && (
                  <Button
                    size="sm" variant="ghost"
                    className="text-green-600 hover:bg-green-50 p-1.5 h-auto"
                    onClick={() => onEdit(record._id)}
                    title="Edit record"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                {record.status !== 'exhumed' && onDelete && (
                  <Button
                    size="sm" variant="ghost"
                    className="text-red-500 hover:bg-red-50 p-1.5 h-auto"
                    onClick={() => onDelete(record._id)}
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </td>
           </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Completed Permits Table (Exhumation / Transfer) ───────────────────────────
function CompletedPermitsTable({ permits, loading, searchQuery, type, onEdit, onDelete }) {
  const filtered = permits.filter(
    (p) =>
      p.deceasedName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.plotId?.plotNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isTransfer = type === "transfer";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-7 h-7 animate-spin text-green-600" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-400 italic">
        {searchQuery ? `No records matching "${searchQuery}"` : `No completed ${type} records found.`}
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Permit ID</th>
          <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deceased name</th>
          {isTransfer ? (
            <>
              <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">From plot</th>
              <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">To plot</th>
            </>
          ) : (
            <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plot released</th>
          )}
          <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed Date</th>
          <th className="py-3 px-5"></th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((permit) => (
          <tr key={permit._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
            <td className="py-3 px-5 font-mono text-xs text-gray-400">{shortId(permit._id)}</td>
            <td className="py-3 px-5 font-medium text-gray-900">{permit.deceasedName}</td>
            {isTransfer ? (
              <>
                <td className="py-3 px-5 text-gray-600">{plotLabel(permit.plotId)}</td>
                <td className="py-3 px-5 text-blue-600 font-medium">{plotLabel(permit.targetPlotId)}</td>
              </>
            ) : (
              <td className="py-3 px-5 text-gray-600">{plotLabel(permit.plotId)}</td>
            )}
            <td className="py-3 px-5 text-gray-500">
              {type === "exhumation" 
                ? fmt(permit.exhumationCompleted || permit.updatedAt)
                : fmt(permit.transferCompleted || permit.updatedAt)}
            </td>
            <td className="py-3 px-5">
              <div className="flex gap-1 justify-end">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-600 hover:bg-green-50 p-1.5 h-auto"
                    onClick={() => onEdit(permit._id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 p-1.5 h-auto"
                    onClick={() => onDelete(permit._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function BurialRecords() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const [activeTab, setActiveTab] = useState("interment");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [modalInitialDate, setModalInitialDate] = useState("");

  // Burial records (direct CRUD — interment tab)
  const [burialRecords, setBurialRecords] = useState([]);
  const [burialLoading, setBurialLoading] = useState(true);

  // All permits — used for pending blocks & exhumation/transfer tables
  const [permits, setPermits] = useState([]);
  const [permitsLoading, setPermitsLoading] = useState(true);

  // ── Fetch data ────────────────────────────────────────────────────────────
  const fetchBurials = useCallback(async () => {
    setBurialLoading(true);
    try {
      const res = await getBurialRecords();
      setBurialRecords(res.data);
    } catch (err) {
      console.error("Failed to load burial records:", err);
    } finally {
      setBurialLoading(false);
    }
  }, []);

  const fetchPermits = useCallback(async () => {
    setPermitsLoading(true);
    try {
      const res = await getPermits();
      setPermits(res.data);
    } catch (err) {
      console.error("Failed to load permits:", err);
    } finally {
      setPermitsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBurials();
    fetchPermits();
  }, [fetchBurials, fetchPermits]);

  // Reset search when switching tabs
  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  // ── Derived permit lists ──────────────────────────────────────────────────
  const pendingByType = (type) =>
    permits.filter((p) => p.type === type && p.status === "approved");

  const completedByType = (type) =>
    permits.filter((p) => p.type === type && p.status === "completed");

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleComplete = (permit) => {
    if (user?.role !== "staff") {
      alert("Only staff can complete permits");
      return;
    }

    setSelectedPermit(permit);
    
    // Set initial date if exists
    if (permit.type === "interment") {
      setModalInitialDate("");
    } else if (permit.type === "exhumation") {
      setModalInitialDate(permit.exhumationCompleted?.split("T")[0] || "");
    } else if (permit.type === "transfer") {
      setModalInitialDate(permit.transferCompleted?.split("T")[0] || "");
    }
    
    setShowDateModal(true);
  };

  const handleDateSubmit = async (date) => {
    if (!selectedPermit) return;
    
    try {
      // Format date to YYYY-MM-DD
      const formattedDate = new Date(date).toISOString().split("T")[0];
      
      // Call completePermit API with the date
      await completePermit(selectedPermit._id, { date: formattedDate });
      
      // Refresh data
      await Promise.all([fetchPermits(), fetchBurials()]);
      
      // Close modal
      setShowDateModal(false);
      setSelectedPermit(null);
      setModalInitialDate("");
      
    } catch (err) {
      console.error("Error completing permit:", err);
      alert(err.response?.data?.message || "Failed to complete permit");
    }
  };

  const handleDeleteBurial = async (id) => {
    if (!window.confirm("Are you sure? This will also mark the cemetery plot as available.")) return;
    try {
      await deleteBurialRecord(id);
      setBurialRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.message || "Failed to delete record.");
    }
  };

  const handleDeletePermit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      setPermits(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isStaff = user?.role === "staff";
  const showPendingBlock = isStaff;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Records</h1>
        <p className="text-gray-500 mt-1">Burial, exhumation, and transfer records</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {showPendingBlock && pendingByType(tab.key).length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                {pendingByType(tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* BURIAL RECORDS TAB  */}
      {activeTab === "interment" && (
        <div className="space-y-6">
          {showPendingBlock && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide text-xs">
                  Awaiting completion
                </span>
              </div>
              <Card className="bg-white border border-amber-100 shadow-sm">
                <PendingPermitsBlock
                  permits={pendingByType("interment")}
                  onComplete={handleComplete}
                  loading={permitsLoading}
                />
              </Card>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                All burial records
              </span>
              <div className="flex gap-2">
                {hasPermission("generate_reports") && (
                  <Button variant="outline" size="sm" className="border-gray-300 text-sm">
                    <Download className="w-4 h-4 mr-1.5" /> Export
                  </Button>
                )}
              </div>
            </div>

            <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or plot..."
                    className="pl-9 h-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <BurialTable
                  records={burialRecords}
                  loading={burialLoading}
                  searchQuery={searchQuery}
                  onEdit={user?.role === "admin" ? (id) => navigate(`/edit-burial/${id}`) : null}
                  onDelete={hasPermission("delete_burial_records") ? handleDeleteBurial : null}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* EXHUMATION RECORDS TAB */}
      {activeTab === "exhumation" && (
        <div className="space-y-6">
          {showPendingBlock && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Awaiting completion
                </span>
              </div>
              <Card className="bg-white border border-amber-100 shadow-sm">
                <PendingPermitsBlock
                  permits={pendingByType("exhumation")}
                  onComplete={handleComplete}
                  loading={permitsLoading}
                />
              </Card>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                All exhumation records
              </span>
              {hasPermission("generate_reports") && (
                <Button variant="outline" size="sm" className="border-gray-300 text-sm">
                  <Download className="w-4 h-4 mr-1.5" /> Export
                </Button>
              )}
            </div>

            <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or plot..."
                    className="pl-9 h-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <CompletedPermitsTable
                  permits={completedByType("exhumation")}
                  loading={permitsLoading}
                  searchQuery={searchQuery}
                  type="exhumation"
                  onEdit={user?.role === "admin" ? (id) => navigate(`/edit-exhumation/${id}`) : null}
                  onDelete={user?.role === "admin" ? handleDeletePermit : null}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TRANSFER RECORDS TAB */}
      {activeTab === "transfer" && (
        <div className="space-y-6">
          {showPendingBlock && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Awaiting completion
                </span>
              </div>
              <Card className="bg-white border border-amber-100 shadow-sm">
                <PendingPermitsBlock
                  permits={pendingByType("transfer")}
                  onComplete={handleComplete}
                  loading={permitsLoading}
                />
              </Card>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                All transfer records
              </span>
              {hasPermission("generate_reports") && (
                <Button variant="outline" size="sm" className="border-gray-300 text-sm">
                  <Download className="w-4 h-4 mr-1.5" /> Export
                </Button>
              )}
            </div>

            <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or plot..."
                    className="pl-9 h-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <CompletedPermitsTable
                  permits={completedByType("transfer")}
                  loading={permitsLoading}
                  searchQuery={searchQuery}
                  type="transfer"
                  onEdit={user?.role === "admin" ? (id) => navigate(`/edit-transfer/${id}`) : null}
                  onDelete={user?.role === "admin" ? handleDeletePermit : null}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Date Completion Modal */}
      <DateCompletionModal
        isOpen={showDateModal}
        onClose={() => {
          setShowDateModal(false);
          setSelectedPermit(null);
          setModalInitialDate("");
        }}
        onSubmit={handleDateSubmit}
        permitType={selectedPermit?.type}
        initialDate={modalInitialDate}
      />
    </div>
  );
}