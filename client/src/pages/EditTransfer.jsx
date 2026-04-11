import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getPermits, updatePermit } from "../services/api";

export default function EditTransfer({ onSuccess }) {
  const { id } = useParams();

  const [formData, setFormData] = useState({
    deceasedName: "",
    transferCompleted: ""
  });

  const [loading, setLoading] = useState(true);

  // FETCH RECORD
  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await getPermits();

        const record = res.data.find(p => p._id === id);

        if (record) {
          setFormData({
            deceasedName: record.deceasedName || "",
            transferCompleted: record.transferCompleted?.slice(0, 10) || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch transfer record:", err);
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
      await updatePermit(id, {
        transferCompleted: formData.transferCompleted
      });

      alert("Transfer record updated successfully!");
      onSuccess();

    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update transfer record.");
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

      <h1 className="text-2xl font-bold mb-6">Edit Transfer Record</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* RECORD ID */}
        <div>
          <label className="text-sm text-gray-500">Record ID</label>
          <Input value={`#${id.slice(-4).toUpperCase()}`} disabled />
        </div>

        {/* NAME LOCKED */}
        <div>
          <label>Deceased Name</label>
          <Input value={formData.deceasedName} disabled />
        </div>

        {/* ADMIN FIELD */}
        <div>
          <label>Transfer Completed</label>
          <Input
            type="date"
            value={formData.transferCompleted}
            onChange={(e) =>
              setFormData({
                ...formData,
                transferCompleted: e.target.value
              })
            }
          />
        </div>

        <Button className="bg-green-600 text-white w-full">
          Save Changes
        </Button>
      </form>
    </div>
  );
}