import { useState, useEffect, useCallback } from "react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, Plus, Filter, Clock, CheckCircle, XCircle, Play, User, MapPin, Calendar, FileText, Eye } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { getPermits, approvePermit, completePermit, updatePermit } from "../services/api.js"; 
import { NewPermitModal } from "../pages/NewPermitModal.jsx";
import { useAuth } from "../contexts/AuthContexts.js";
import { useNavigate } from "react-router-dom";

// ─── Tab Configuration ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "All Permits" },
  { key: "interment", label: "Burial Permits" },
  { key: "exhumation", label: "Exhumation Permits" },
  { key: "transfer", label: "Transfer Permits" },
];

const STATUS_FILTERS = [
  { key: "all", label: "All Status" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

// ─── Helper Functions ────────────────────────────────────────────────────────────────
const fmt = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

const shortId = (id) => `#${id?.slice(-4).toUpperCase()}`;

const plotLabel = (plotId) =>
  plotId ? `${plotId.section}-${plotId.plotNumber}` : "Unassigned";

// ─── Unified Permit Details Modal (View Only + Approve/Reject for Admin) ─────────────
function PermitDetailsModal({ permit, isOpen, onClose, onApprove, onReject, userRole, onRefresh }) {
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !permit) return null;

  const isPending = permit.status === 'pending';
  const canTakeAction = userRole === 'admin' && isPending;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(permit._id, remarks);
      onClose();
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error approving permit:", err);
    } finally {
      setIsProcessing(false);
      setAction(null);
      setRemarks("");
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(permit._id, remarks);
      onClose();
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error rejecting permit:", err);
    } finally {
      setIsProcessing(false);
      setAction(null);
      setRemarks("");
    }
  };

  const handleConfirm = () => {
    if (action === 'approve') {
      handleApprove();
    } else if (action === 'reject') {
      handleReject();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Permit Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            {/* Header Info */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Permit ID</p>
                <p className="font-mono text-sm font-semibold">{permit._id}</p>
              </div>
              <Badge className={`text-sm px-3 py-1 ${
                permit.status === 'pending' ? 'bg-purple-100 text-purple-700' :
                permit.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                permit.status === 'completed' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {permit.status.toUpperCase()}
              </Badge>
            </div>

            {/* Deceased Information */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Deceased Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium">{permit.deceasedName}</p>
                </div>
                {permit.dateOfDeath && (
                  <div>
                    <p className="text-xs text-gray-500">Date of Death</p>
                    <p className="text-sm">{fmt(permit.dateOfDeath)}</p>
                  </div>
                )}
                {permit.age && (
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="text-sm">{permit.age}</p>
                  </div>
                )}
                {permit.gender && (
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-sm">{permit.gender}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Permit Type Specific Details */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Permit Details
              </h3>
              
              {permit.type === 'interment' && (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Requested Plot</p>
                    <p className="text-sm font-medium">{plotLabel(permit.plotId)}</p>
                  </div>
                  {permit.dateOfInterment && (
                    <div>
                      <p className="text-xs text-gray-500">Requested Interment Date</p>
                      <p className="text-sm">{fmt(permit.dateOfInterment)}</p>
                    </div>
                  )}
                </div>
              )}

              {permit.type === 'exhumation' && (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Plot to Exhume</p>
                    <p className="text-sm font-medium">{plotLabel(permit.plotId)}</p>
                  </div>
                  {permit.exhumationDate && (
                    <div>
                      <p className="text-xs text-gray-500">Requested Exhumation Date</p>
                      <p className="text-sm">{fmt(permit.exhumationDate)}</p>
                    </div>
                  )}
                  {permit.reason && (
                    <div>
                      <p className="text-xs text-gray-500">Reason for Exhumation</p>
                      <p className="text-sm whitespace-pre-wrap">{permit.reason}</p>
                    </div>
                  )}
                </div>
              )}

              {permit.type === 'transfer' && (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Current Plot</p>
                    <p className="text-sm font-medium">{plotLabel(permit.plotId)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Requested Transfer Plot</p>
                    <p className="text-sm font-medium text-blue-600">{plotLabel(permit.targetPlotId)}</p>
                  </div>
                  {permit.transferDate && (
                    <div>
                      <p className="text-xs text-gray-500">Requested Transfer Date</p>
                      <p className="text-sm">{fmt(permit.transferDate)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Requester Information */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Requester Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium">{permit.requesterName || "—"}</p>
                </div>
                {permit.requesterContact && (
                  <div>
                    <p className="text-xs text-gray-500">Contact Number</p>
                    <p className="text-sm">{permit.requesterContact}</p>
                  </div>
                )}
                {permit.requesterEmail && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm">{permit.requesterEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Remarks Section */}
            {permit.adminRemarks && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Admin Remarks</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{permit.adminRemarks}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t pt-4 text-xs text-gray-400">
              <p>Created: {fmt(permit.createdAt)}</p>
              {permit.updatedAt && permit.updatedAt !== permit.createdAt && (
                <p>Last Updated: {fmt(permit.updatedAt)}</p>
              )}
            </div>

            {/* Admin Action Section */}
            {canTakeAction && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Admin Decision</h3>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Add remarks (optional)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <Button onClick={onClose} variant="outline">Close</Button>
            {canTakeAction && (
              <>
                <Button 
                  onClick={() => setAction('reject')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isProcessing}
                >
                  Reject Permit
                </Button>
                <Button 
                  onClick={() => setAction('approve')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isProcessing}
                >
                  Approve Permit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {action === 'approve' ? 'Approve Permit?' : 'Reject Permit?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {action === 'approve' 
                ? 'This permit will be approved and ready for staff to complete.' 
                : 'This permit will be rejected. The requester will be notified.'}
            </p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setAction(null)} variant="outline">Cancel</Button>
              <Button onClick={handleConfirm} className={action === 'approve' ? 'bg-green-600' : 'bg-red-600'}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Permits Table Component ─────────────────────────────────────────────────────────
function PermitsTable({ permits, loading, searchQuery, onViewDetails, onCheck, userRole, checkedPermits }) {
  const filtered = permits.filter(p => 
    p.deceasedName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plotLabel(p.plotId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.type === 'transfer' && plotLabel(p.targetPlotId).toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.requesterName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-purple-100 text-purple-700 border-purple-300",
      approved: "bg-blue-100 text-blue-700 border-blue-300",
      completed: "bg-green-100 text-green-700 border-green-300",
      rejected: "bg-red-100 text-red-700 border-red-300",
    };
    return <Badge className={styles[status] || "bg-gray-100"}>{status.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type) => {
    const colors = {
      interment: "bg-blue-100 text-blue-700",
      exhumation: "bg-amber-100 text-amber-700",
      transfer: "bg-cyan-100 text-cyan-700",
    };
    return <Badge className={colors[type] || "bg-gray-100"}>{type.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="mt-2 text-gray-500">Loading permits...</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 italic">
        {searchQuery ? `No permits matching "${searchQuery}"` : "No permits found."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Permit ID</th>
            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Deceased</th>
            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Type</th>
            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Details</th>
            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Requester</th>
            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Submitted</th>
            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Status</th>
            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((permit) => {
            const isChecked = checkedPermits.includes(permit._id);
            const showCheckButton = userRole === 'admin' && permit.status === 'pending';
            
            return (
              <tr key={permit._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <span className="font-mono text-xs text-gray-600">
                    {shortId(permit._id)}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="font-medium text-gray-900">{permit.deceasedName}</div>
                  {permit.dateOfDeath && (
                    <div className="text-xs text-gray-400">Died: {fmt(permit.dateOfDeath)}</div>
                  )}
                </td>
                <td className="py-4 px-6">{getTypeBadge(permit.type)}</td>
                <td className="py-4 px-6">
                  {permit.type === 'interment' && (
                    <div className="text-sm">
                      <span className="text-gray-600">Plot: </span>
                      <span className="font-medium">{plotLabel(permit.plotId)}</span>
                      {permit.dateOfInterment && (
                        <div className="text-xs text-gray-400">Interment: {fmt(permit.dateOfInterment)}</div>
                      )}
                    </div>
                  )}
                  
                  {permit.type === 'exhumation' && (
                    <div className="text-sm">
                      <span className="text-gray-600">Exhume from: </span>
                      <span className="font-medium">{plotLabel(permit.plotId)}</span>
                      {permit.reason && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]" title={permit.reason}>
                          Reason: {permit.reason.length > 50 ? permit.reason.substring(0, 50) + '...' : permit.reason}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {permit.type === 'transfer' && (
                    <div className="text-sm">
                      <div><span className="text-gray-600">From: </span><span className="font-medium">{plotLabel(permit.plotId)}</span></div>
                      <div><span className="text-gray-600">To: </span><span className="font-medium text-blue-600">{plotLabel(permit.targetPlotId)}</span></div>
                    </div>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm font-medium">{permit.requesterName || "—"}</div>
                  {permit.relationshipToDeceased && (
                    <div className="text-xs text-gray-400">{permit.relationshipToDeceased}</div>
                  )}
                 </td>
                <td className="py-4 px-6 text-sm text-gray-500">{fmt(permit.createdAt)}</td>
                <td className="py-4 px-6">{getStatusBadge(permit.status)}</td>
                <td className="py-4 px-6">
                  <div className="flex gap-2">
                    {/* View Icon - Shows permit details (Visible to all authenticated users) */}
                    <Button 
                      size="sm" variant="ghost" 
                      onClick={() => onViewDetails(permit)} 
                      className="text-gray-600 hover:bg-gray-100 p-1"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>

                    {/* Check Button - For admin to approve/reject */}
                    {showCheckButton && (
                      <Button 
                        size="sm" 
                        onClick={() => onCheck(permit)} 
                        className={`text-white text-xs px-3 py-1 h-auto shadow-sm ${
                          isChecked 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                        disabled={isChecked}
                      >
                        {isChecked ? 'Checked' : 'Check'}
                      </Button>
                    )}

                    {/* Status indicators for non-pending permits */}
                    {permit.status === 'approved' && (
                      <span className="text-xs text-amber-600 italic whitespace-nowrap">Awaiting completion</span>
                    )}
                    {permit.status === 'completed' && (
                      <span className="text-xs text-green-600 italic">Completed</span>
                    )}
                    {permit.status === 'rejected' && (
                      <span className="text-xs text-red-600 italic">Rejected</span>
                    )}
                    {permit.status === 'pending' && userRole !== 'admin' && userRole !== 'public' && (
                      <span className="text-xs text-purple-600 italic">Pending approval</span>
                    )}
                  </div>
                 </td>
               </tr>
            );
          })}
        </tbody>
       </table>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────────
export function Permits() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [checkedPermits, setCheckedPermits] = useState([]);

  const userRole = user?.role;

  // 🔒 PROTECTION: Redirect public users away from permits page
  useEffect(() => {
    if (userRole === 'public') {
      navigate('/dashboard', { replace: true });
    }
  }, [userRole, navigate]);

  const fetchPermits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPermits();
      setPermits(res.data);
    } catch (err) {
      console.error("Error fetching permits:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermits();
  }, [fetchPermits]);

  // Reset search when changing tabs or status filter
  useEffect(() => {
    setSearchQuery("");
  }, [activeTab, statusFilter]);

  const handleApprove = async (id, remarks) => {
    try {
      await approvePermit(id, { status: 'approved', adminRemarks: remarks });
      setCheckedPermits(prev => [...prev, id]);
      await fetchPermits();
    } catch (err) {
      console.error("Error approving permit:", err);
      alert(err.response?.data?.message || "Error approving permit");
    }
  };

  const handleReject = async (id, remarks) => {
    try {
      await approvePermit(id, { status: 'rejected', adminRemarks: remarks });
      setCheckedPermits(prev => [...prev, id]);
      await fetchPermits();
    } catch (err) {
      console.error("Error rejecting permit:", err);
      alert(err.response?.data?.message || "Error rejecting permit");
    }
  };

  const handleComplete = async (id, deceasedName) => {
    if (!window.confirm(`Mark ${deceasedName}'s permit as physically completed?`)) return;
    try {
      const res = await completePermit(id);
      if (res.status === 200) {
        await fetchPermits();
      }
    } catch (err) {
      console.error("Error completing permit:", err);
      alert(err.response?.data?.message || "Could not complete the permit.");
    }
  };

  const handleViewDetails = (permit) => {
    setSelectedPermit(permit);
    setIsDetailsModalOpen(true);
  };

  const handleCheck = (permit) => {
    setSelectedPermit(permit);
    setIsDetailsModalOpen(true);
  };

  // Filter permits by tab and status
  const filteredByTab = activeTab === "all" 
    ? permits 
    : permits.filter(p => p.type === activeTab);

  const filteredByStatus = statusFilter === "all"
    ? filteredByTab
    : filteredByTab.filter(p => p.status === statusFilter);

  // Summary counts
  const getSummaryCounts = () => {
    const total = permits.length;
    const pending = permits.filter(p => p.status === 'pending').length;
    const approved = permits.filter(p => p.status === 'approved').length;
    const completed = permits.filter(p => p.status === 'completed').length;
    const rejected = permits.filter(p => p.status === 'rejected').length;
    return { total, pending, approved, completed, rejected };
  };

  const counts = getSummaryCounts();

  // If public user somehow gets through, show nothing
  if (userRole === 'public') {
    return null;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Permits Management</h1>
          <p className="text-gray-500 mt-1">Manage burial, exhumation, and transfer permits</p>
        </div>

        {/* Only Staff and Admin can create new permits */}
        {(userRole === 'staff' || userRole === 'admin') && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> New Permit
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4 bg-white border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
          <p className="text-gray-500 text-xs font-medium">Total Permits</p>
          <p className="text-2xl font-bold text-gray-700">{counts.total}</p>
        </Card>
        <Card className="p-4 bg-white border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("pending")}>
          <p className="text-gray-500 text-xs font-medium">Pending</p>
          <p className="text-2xl font-bold text-purple-600">{counts.pending}</p>
        </Card>
        <Card className="p-4 bg-white border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("approved")}>
          <p className="text-gray-500 text-xs font-medium">Approved</p>
          <p className="text-2xl font-bold text-blue-600">{counts.approved}</p>
        </Card>
        <Card className="p-4 bg-white border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("completed")}>
          <p className="text-gray-500 text-xs font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-600">{counts.completed}</p>
        </Card>
        <Card className="p-4 bg-white border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("rejected")}>
          <p className="text-gray-500 text-xs font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
        </Card>
      </div>

      {/* Status Filter Bar */}
      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.key}
            variant={statusFilter === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(filter.key)}
            className={statusFilter === filter.key 
              ? "bg-green-600 hover:bg-green-700" 
              : "border-gray-300"}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Type Tabs */}
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
            {tab.key !== 'all' && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                {permits.filter(p => p.type === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by deceased name, plot, or requester..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Permits Table */}
      <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
        <PermitsTable
          permits={filteredByStatus}
          loading={loading}
          searchQuery={searchQuery}
          onViewDetails={handleViewDetails}
          onCheck={handleCheck}
          userRole={userRole}
          checkedPermits={checkedPermits}
        />
      </Card>

      {/* New Permit Modal - Only shown for staff/admin */}
      {(userRole === 'staff' || userRole === 'admin') && (
        <NewPermitModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onRefresh={fetchPermits} 
        />
      )}

      {/* Unified Permit Details Modal */}
      <PermitDetailsModal
        permit={selectedPermit}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedPermit(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        userRole={userRole}
        onRefresh={fetchPermits}
      />
    </div>
  );
}