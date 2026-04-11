import { useState, useMemo, useEffect, useContext } from "react";
import axios from "axios";
import { Search, Eye, Edit, Trash2 } from "lucide-react";
import {
  getLeases,
  createLease,
  renewLease,
  terminateLease,
  getPlots,
} from "../services/api";
import { useAuth } from "../contexts/AuthContexts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addYears(dateStr, years) {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split("T")[0];
}

function calcDaysLeft(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function deriveStatus(daysLeft) {
  if (daysLeft === 0) return "Expired";
  if (daysLeft <= 90) return "Expiring Soon";
  return "Active";
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const styles = {
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Expiring Soon": "bg-amber-50 text-amber-700 border border-amber-200",
    Expired: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${styles[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function ViewLeaseModal({ lease, onClose }) {
  return (
    <Modal onClose={onClose}>
      <ModalHeader
        title="Lease Details"
        subtitle={`Lease ID: ${lease.id?.slice(-6).toUpperCase()}`}
        onClose={onClose}
      />
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Lessee Name
            </label>
            <p className="mt-1 text-sm text-gray-900">{lease.name}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Plot Number
            </label>
            <p className="mt-1 text-sm text-gray-900">{lease.plot}</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Email Address
          </label>
          <p className="mt-1 text-sm text-gray-900">{lease.email}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Contact Number
          </label>
          <p className="mt-1 text-sm text-gray-900">
            {lease.contactNumber || "N/A"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Start Date
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(lease.startDate)}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Expiry Date
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(lease.expiryDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Days Left
            </label>
            <p
              className={`mt-1 text-sm font-semibold ${lease.daysLeft <= 90 ? "text-amber-600" : "text-green-600"}`}
            >
              {lease.daysLeft} days
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Status
            </label>
            <div className="mt-1">
              <StatusBadge status={lease.status} />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Lease Duration
          </label>
          <p className="mt-1 text-sm text-gray-900">
            {lease.years || "N/A"} years
          </p>
        </div>
      </div>
      <div className="px-6 pb-6 flex justify-end">
        <Btn variant="outline" onClick={onClose}>
          Close
        </Btn>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-gray-600 transition text-xl leading-none"
      >
        ✕
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition ${className}`}
      {...props}
    />
  );
}

function Btn({ variant = "primary", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline:
      "border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
    amber: "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400",
    ghost:
      "text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ─── NEW LEASE MODAL ─────────────────────────────────────────
function NewLeaseModal({ onClose, onSave }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    plot: "",
    startDate: today,
    years: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const expiryDate =
    form.startDate && form.years
      ? addYears(form.startDate, Number(form.years))
      : "";
  const daysLeft = expiryDate ? calcDaysLeft(expiryDate) : null;

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const selectPlot = (plot) => {
    set("plot", `${plot.section}-${plot.plotNumber}`);
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handlePlotSearch = async (query) => {
    set("plot", query);

    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      setIsSearching(true);
      const res = await getPlots();
      const plotsData = res.data.data || res.data || [];
      const occupiedPlots = plotsData.filter((plot) => plot.occupiedBy);
      const filtered = occupiedPlots.filter((plot) => {
        const deceasedName = plot.occupiedBy?.deceasedName || "";
        const plotName = `${plot.section}-${plot.plotNumber}`;
        return (
          deceasedName.toLowerCase().includes(query.toLowerCase()) ||
          plotName.toLowerCase().includes(query.toLowerCase())
        );
      });
      setSearchResults(filtered);
      setShowDropdown(true);
    } catch (err) {
      console.error("Plot search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    if (
      !form.name ||
      !form.email ||
      !form.contactNumber ||
      !form.plot ||
      !form.startDate ||
      !form.years
    ) {
      alert("Please fill in all fields.");
      return;
    }
    onSave({
      name: form.name,
      email: form.email,
      contactNumber: form.contactNumber,
      plot: form.plot,
      startDate: form.startDate,
      expiryDate: expiryDate,
      daysLeft: daysLeft,
      status: deriveStatus(daysLeft),
      years: form.years,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader
        title="New Lease"
        subtitle="Search for an occupied plot to register a new lease."
        onClose={onClose}
      />
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Plot Number">
            <div className="relative">
              <Input
                placeholder="Search deceased or plot number..."
                value={form.plot}
                onChange={(e) => handlePlotSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => selectPlot(p)}
                      className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-50"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {p.occupiedBy?.deceasedName || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.section} - {p.plotNumber}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field label="Lessee Name">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Lessee Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Contact Number">
          <Input
            type="tel"
            value={form.contactNumber}
            onChange={(e) => set("contactNumber", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
          <Field label="Lease Duration (Years)">
            <Input
              type="number"
              min={1}
              max={99}
              value={form.years}
              onChange={(e) => set("years", e.target.value)}
            />
          </Field>
        </div>
        {expiryDate && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Calculated Details
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Expiry Date</span>
              <span className="font-semibold text-gray-900">
                {formatDate(expiryDate)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Days Until Expiry</span>
              <span
                className={`font-semibold ${daysLeft <= 90 ? "text-amber-600" : "text-green-600"}`}
              >
                {daysLeft?.toLocaleString()} days
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="px-6 pb-6 flex justify-end gap-3">
        <Btn variant="outline" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          variant="primary"
          onClick={handleSave}
          disabled={
            !form.name ||
            !form.email ||
            !form.plot ||
            !form.startDate ||
            !form.years
          }
        >
          ＋ Register Lease
        </Btn>
      </div>
    </Modal>
  );
}

// ─── RENEW MODAL (same as before) ─────────────────────────────────────────────
function RenewModal({ lease, onClose, onSave }) {
  const [startDate, setStartDate] = useState(lease.expiryDate);
  const [years, setYears] = useState("");
  const expiryDate =
    startDate && years ? addYears(startDate, Number(years)) : "";
  const daysLeft = expiryDate ? calcDaysLeft(expiryDate) : null;

  function handleSave() {
    if (!startDate || !years) return;
    onSave(lease.id, {
      startDate,
      expiryDate,
      daysLeft,
      status: deriveStatus(daysLeft),
      years: years,
    });
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader
        title={`Renew Lease — ${lease.name}`}
        subtitle={`Plot ${lease.plot}`}
        onClose={onClose}
      />
      <div className="px-6 py-5 space-y-4">
        <Field label="New Start Date">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field label="Lease Duration (Years)">
          <Input
            type="number"
            min={1}
            max={99}
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
        {expiryDate && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Renewal Preview
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New Expiry Date</span>
              <span className="font-semibold text-gray-900">
                {formatDate(expiryDate)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Days Until Expiry</span>
              <span className="font-semibold text-green-700">
                {daysLeft?.toLocaleString()} days
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="px-6 pb-6 flex justify-end gap-3">
        <Btn variant="outline" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          variant="primary"
          onClick={handleSave}
          disabled={!startDate || !years}
        >
          ✓ Confirm Renewal
        </Btn>
      </div>
    </Modal>
  );
}

function EditLeaseModal({ lease, onClose, onSave }) {
  // 1. Initialize state with the existing lease data
  // We use the Schema names (ownerName) or the UI names (name) 
  // depending on how your fetchLeases formatted the data.
  const [form, setForm] = useState({
    name: lease.name || "",
    email: lease.email || "",
    contactNumber: lease.contactNumber || "",
  });

  const handleSave = () => {
    // 2. Validate basic fields
    if (!form.name || !form.email) {
      alert("Name and Email are required.");
      return;
    }
    // 3. Pass the ID and the new form data back to handleEditLease
    onSave(lease.id, form);
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader 
        title="Edit Lease Information" 
        subtitle={`Plot: ${lease.plot}`} 
        onClose={onClose} 
      />
      <div className="px-6 py-5 space-y-4">
        <Field label="Lessee Name">
          <Input 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
          />
        </Field>
        
        <Field label="Email Address">
          <Input 
            type="email"
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
          />
        </Field>

        <Field label="Contact Number">
          <Input 
            type="tel"
            value={form.contactNumber} 
            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} 
          />
        </Field>
      </div>

      <div className="px-6 pb-6 flex justify-end gap-3">
        <Btn variant="outline" onClick={onClose}>
          Cancel
        </Btn>
        <Btn variant="primary" onClick={handleSave}>
          Save Changes
        </Btn>
      </div>
    </Modal>
  );
}

// ─── TERMINATE CONFIRM MODAL (same as before) ─────────────────────────────────
function TerminateModal({ lease, onClose, onConfirm }) {
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Terminate Lease" onClose={onClose} />
      <div className="px-6 py-5">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-1">
          <p className="font-semibold">⚠ This action cannot be undone.</p>
          <p>
            Terminating the lease for <strong>{lease.name}</strong> (Plot{" "}
            {lease.plot}) will mark the plot as available again.
          </p>
        </div>
      </div>
      <div className="px-6 pb-6 flex justify-end gap-3">
        <Btn variant="outline" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          variant="danger"
          onClick={() => {
            onConfirm(lease.id);
            onClose();
          }}
        >
          Terminate Lease
        </Btn>
      </div>
    </Modal>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function Leases() {
  // Use useAuth hook instead of useContext
  const { user, isAdmin, isStaff } = useAuth();

  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [modal, setModal] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log("User from auth:", user);
    console.log("Is Admin:", isAdmin);
    console.log("Is Staff:", isStaff);
  }, [user, isAdmin, isStaff]);

  const fetchLeases = async () => {
    setLoading(true);
    try {
      const response = await getLeases();
      const leasesData = response.data.data || response.data || [];

      const formattedLeases = leasesData.map((lease) => ({
        id: lease.id || lease._id,
        name: lease.name || lease.ownerName || "Unknown",
        email: lease.email || lease.ownerEmail || "N/A",
        plot: lease.plot || "N/A",
        startDate: lease.startDate || "",
        expiryDate: lease.expiryDate || lease.endDate || "",
        daysLeft: lease.daysLeft || 0,
        status: lease.status || "Active",
        contactNumber: lease.contactNumber || lease.ownerContact || "N/A",
        years: lease.years || lease.durationYears || 0,
      }));

      setLeases(formattedLeases);
    } catch (error) {
      console.error("Error fetching leases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  const total = leases.length;
  const activeCount = leases.filter((l) => l.status === "Active").length;
  const expiring = leases.filter((l) => l.status === "Expiring Soon").length;
  const expired = leases.filter((l) => l.status === "Expired").length;

  const filtered = useMemo(() => {
    return leases.filter((l) => {
      const searchLower = searchQuery.toLowerCase();
      const name = (l.name || "").toLowerCase();
      const plot = (l.plot || "").toLowerCase();
      const email = (l.email || "").toLowerCase();
      const matchSearch =
        name.includes(searchLower) ||
        plot.includes(searchLower) ||
        email.includes(searchLower);
      const matchFilter = filterStatus === "All" || l.status === filterStatus;
      return matchSearch && matchFilter;
    });
  }, [leases, searchQuery, filterStatus]);

  const handleNewLease = async (data) => {
    try {
      const plotsRes = await getPlots();
      const plotNumberParts = data.plot.split("-");
      const section = plotNumberParts[0];
      const plotNumber = plotNumberParts[1];
      const plotsData = plotsRes.data.data || plotsRes.data || [];
      const existingPlot = plotsData.find(
        (p) => p.section === section && p.plotNumber === plotNumber,
      );

      if (!existingPlot)
        return alert("Plot not found. Ensure the plot exists first.");

      const payload = {
        ownerName: data.name,
        ownerEmail: data.email,
        ownerContact: data.contactNumber,
        plotId: existingPlot._id,
        startDate: data.startDate,
        durationYears: parseInt(data.years),
      };

      await createLease(payload);
      await fetchLeases();
      alert("Lease registered successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create lease");
    }
  };

  const handleRenew = async (id, updates) => {
    try {
      await renewLease(id, {
        startDate: updates.startDate,
        durationYears: parseInt(updates.years),
      });
      await fetchLeases();
      alert("Lease renewed!");
    } catch (error) {
      alert("Renewal failed");
    }
  };

  const handleTerminate = async (id) => {
    try {
      await terminateLease(id);
      await fetchLeases();
      alert("Lease terminated");
    } catch (error) {
      alert("Termination failed");
    }
  };

const handleEditLease = async (id, updatedData) => {
  // 1. Safety Check: Ensure we actually have an ID
  if (!id) {
    console.error("Update failed: No Lease ID provided.");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    
    // 2. Map UI fields to your Mongoose Schema (ownerName, ownerEmail, etc.)
    const payload = {
      ownerName: updatedData.name,
      ownerEmail: updatedData.email,
      ownerContact: updatedData.contactNumber,
      // If you added a 'remarks' field in the modal, include it here:
      // remarks: updatedData.remarks 
    };

    // 3. Dynamic Host Resolution
    const isDevTunnel = window.location.hostname.includes('devtunnels.ms');
    const host = isDevTunnel 
      ? window.location.hostname.replace('-3000', '-5000') 
      : 'localhost:5000';
    
    // Dev tunnels REQUIRE https to work properly
    const protocol = isDevTunnel ? 'https' : 'http';
    const url = `${protocol}://${host}/api/leases/${id}`;

    // 4. Execute Update
    const response = await axios.put(url, payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      await fetchLeases(); // Refresh the table
      setModal(null);      // Close the modal
      alert("Lease record updated successfully!");
    }
  } catch (error) {
    // 5. Improved Error Logging
    const errorMessage = error.response?.data?.message || error.message;
    console.error("Update Error Details:", error.response?.data);
    alert(`Update Failed: ${errorMessage}`);
  }
};

  const handleDeleteLease = async (id) => {
    if (window.confirm("Delete this lease permanentely?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/leases/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchLeases();
        alert("Lease deleted.");
      } catch (error) {
        alert("Delete failed.");
      }
    }
  };

  function openEmailClient(lease) {
    const subject = encodeURIComponent(
      `Lease Renewal Notice — Plot ${lease.plot}`,
    );
    const body = encodeURIComponent(
      `Dear ${lease.name},\n\nThis is a notice that your lease for plot ${lease.plot} is expiring on ${formatDate(lease.expiryDate)} (${lease.daysLeft} days remaining).\n\nPlease contact us to arrange a renewal at your earliest convenience.\n\nThank you.`,
    );
    window.open(`mailto:${lease.email}?subject=${subject}&body=${body}`);
  }

  const filterOptions = ["All", "Active", "Expiring Soon", "Expired"];

  if (loading) {
    return (
      <div className="p-6 md:p-8 bg-gray-50 min-h-screen font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-500">Loading leases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Lease Management
        </h1>
        <p className="text-gray-500 mt-1">
          Manage cemetery plot leases, renewals, and terminations
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "TOTAL LEASES",
            value: total,
            color: "text-gray-900",
            border: "border-gray-200",
          },
          {
            label: "ACTIVE",
            value: activeCount,
            color: "text-green-600",
            border: "border-green-500",
          },
          {
            label: "EXPIRING SOON",
            value: expiring,
            color: "text-amber-500",
            border: "border-amber-400",
          },
          {
            label: "EXPIRED",
            value: expired,
            color: "text-red-500",
            border: "border-red-500",
          },
        ].map((c) => (
          <div
            key={c.label}
            className={`bg-white border-l-4 ${c.border} rounded-xl p-5 shadow-sm`}
          >
            <p className="text-xs text-gray-500 font-semibold tracking-wide uppercase">
              {c.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, plot, or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilterStatus(opt)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                filterStatus === opt
                  ? "bg-green-600 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {opt}
            </button>
          ))}
          {/* Only show New Lease button for staff (or both, depending on requirements) */}
          {isStaff && (
            <Btn variant="primary" onClick={() => setModal({ type: "new" })}>
              ＋ New Lease
            </Btn>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "ID",
                  "Lessee",
                  "Email",
                  "Plot",
                  "Start Date",
                  "Expiry Date",
                  "Days Left",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    No leases found matching your search.
                  </td>
                </tr>
              )}
              {filtered.map((lease, index) => (
                <tr
                  key={lease.id || `lease-${index}`}
                  className={`border-b border-gray-100 last:border-none transition hover:bg-gray-50/70 ${lease.status === "Expired" ? "opacity-60" : ""}`}
                >
                  <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                    #{lease.id?.toString().slice(-6).toUpperCase() || "N/A"}
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                    {lease.name || "N/A"}
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {lease.email || "N/A"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="bg-gray-100 text-gray-700 font-mono text-xs px-2 py-1 rounded-md">
                      {lease.plot || "N/A"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {formatDate(lease.startDate)}
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {formatDate(lease.expiryDate)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {lease.daysLeft === 0 ? (
                      <span className="text-red-500 font-semibold">
                        Expired
                      </span>
                    ) : (
                      <span
                        className={`font-semibold ${lease.daysLeft <= 90 ? "text-amber-600" : "text-gray-900"}`}
                      >
                        {lease.daysLeft?.toLocaleString() || 0}d
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={lease.statusText || lease.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* VIEW button - visible to EVERYONE */}
                      <Btn
                        variant="outline"
                        className="text-xs px-3 py-1.5"
                        onClick={() => setModal({ type: "view", lease })}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Btn>

                      {/* STAFF ONLY: Email & Renew */}
                      {isStaff && lease.status !== "Expired" && (
                        <>
                          <Btn
                            variant="outline"
                            className="text-xs px-3 py-1.5"
                            onClick={() => openEmailClient(lease)}
                          >
                            ✉ Email
                          </Btn>
                          <Btn
                            variant="primary"
                            className="text-xs px-3 py-1.5"
                            onClick={() => setModal({ type: "renew", lease })}
                          >
                            ↻ Renew
                          </Btn>
                        </>
                      )}

                      {/* ADMIN ONLY: Edit & Delete */}
                      {isAdmin && (
                        <>
                          <Btn
                            variant="outline"
                            className="text-xs px-3 py-1.5"
                            onClick={() => setModal({ type: "edit", lease })}
                          >
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Btn>
                          <Btn
                            variant="danger"
                            className="text-xs px-3 py-1.5"
                            onClick={() => handleDeleteLease(lease.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Btn>
                        </>
                      )}

                      {/* TERMINATE: Both can see if Expired */}
                      {(isStaff || isAdmin) && lease.status === "Expired" && (
                        <Btn
                          variant="danger"
                          className="text-xs px-3 py-1.5"
                          onClick={() => setModal({ type: "terminate", lease })}
                        >
                          Terminate
                        </Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {leases.length} leases
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "new" && (
        <NewLeaseModal onClose={() => setModal(null)} onSave={handleNewLease} />
      )}
      {modal?.type === "renew" && (
        <RenewModal
          lease={modal.lease}
          onClose={() => setModal(null)}
          onSave={handleRenew}
        />
      )}
      {modal?.type === "terminate" && (
        <TerminateModal
          lease={modal.lease}
          onClose={() => setModal(null)}
          onConfirm={handleTerminate}
        />
      )}
      {modal?.type === "view" && (
        <ViewLeaseModal lease={modal.lease} onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit" && (
        <EditLeaseModal
          lease={modal.lease}
          onClose={() => setModal(null)}
          onSave={handleEditLease}
        />
      )}
    </div>
  );
}
