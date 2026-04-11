import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getBurialRecords, updateBurialRecord } from "../services/api";

export default function EditBurial({ onSuccess }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    deceasedName: "",
    dateOfDeath: "",
    dateOfInterment: "",
    plotId: "",
    plotDetails: null, 
  });

  const [loading, setLoading] = useState(true);

  // FETCH RECORD
  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await getBurialRecords();

        const record = res.data.find(r => r._id.toString()=== id);

        if (record) {
          setFormData({
            deceasedName: record.deceasedName || "",
            dateOfDeath: record.dateOfDeath?.slice(0, 10) || "",
            dateOfInterment: record.dateOfInterment?.slice(0, 10) || "",
            plotId: record.plotId?._id || "",
            plotDetails: record.plotId || null, // ✅ FIX
          });
        }
      } catch (err) {
        console.error("Failed to fetch record:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  // UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateBurialRecord(id, formData);

      alert("Record updated successfully!");

      onSuccess(); 

    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update record.");
    }
  };

  if (loading) return <p className="p-8">Loading...</p>;

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* BACK BUTTON */}
      <button
        onClick={() => onSuccess()}
        className="flex items-center text-sm text-gray-500 mb-4 hover:text-green-600"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Records
      </button>

      <h1 className="text-2xl font-bold mb-6">Edit Burial Record</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* MATCH TABLE FORMAT ID */}
        <div>
          <label className="text-sm text-gray-500">Record ID</label>
          <Input value={`#${id.slice(-4).toUpperCase()}`} disabled />
        </div>

        <div>
          <label>Deceased Name</label>
          <Input
            value={formData.deceasedName}
            onChange={(e) =>
              setFormData({ ...formData, deceasedName: e.target.value })
            }
          />
        </div>

        <div>
          <label>Date of Death</label>
          <Input
            type="date"
            value={formData.dateOfDeath}
            onChange={(e) =>
              setFormData({ ...formData, dateOfDeath: e.target.value })
            }
          />
        </div>

        <div>
          <label>Date of Interment</label>
          <Input
            type="date"
            value={formData.dateOfInterment}
            onChange={(e) =>
              setFormData({ ...formData, dateOfInterment: e.target.value })
            }
          />
        </div>

        {/* FIXED PLOT DISPLAY */}
        <div>
          <label>Plot Details</label>
          <Input
            value={
              formData.plotDetails
                ? `Section ${formData.plotDetails.section}-${formData.plotDetails.plotNumber}`
                : "Unassigned"
            }
            disabled
          />
        </div>

        <Button className="bg-green-600 text-white w-full">
          Save Changes
        </Button>
      </form>
    </div>
  );
}