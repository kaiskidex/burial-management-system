import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { getPermits, updatePermit } from "../services/api";
import { ChevronLeft } from "lucide-react";

export default function EditExhumation({ onSuccess }) {
  const { id } = useParams();

  const [formData, setFormData] = useState({
    deceasedName: "",
    exhumationCompleted: ""
  });

  useEffect(() => {
    const fetch = async () => {
      const res = await getPermits();
      const record = res.data.find(p => p._id === id);

      if (record) {
        setFormData({
          deceasedName: record.deceasedName,
          exhumationCompleted: record.exhumationCompleted?.slice(0,10) || ""
        });
      }
    };
    fetch();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await updatePermit(id, {
      exhumationCompleted: formData.exhumationCompleted
    });

    alert("Updated!");
    onSuccess();
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <button
      onClick={() => onSuccess()}
      className="flex items-center text-sm text-gray-500 mb-4 hover:text-green-600"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Reccords
        </button>
      <h1 className="text-xl font-bold mb-4">Edit Exhumation Record</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* NAME (LOCKED) */}
        <div>
          <label>Deceased Name</label>
          <Input value={formData.deceasedName} disabled />
        </div>

        {/* ADMIN FIELD */}
        <div>
          <label>Exhumation Completed</label>
          <Input
            type="date"
            value={formData.exhumationCompleted}
            onChange={(e) =>
              setFormData({
                ...formData,
                exhumationCompleted: e.target.value
              })
            }
          />
        </div>

        <Button className="bg-green-600 text-white w-full">
          Save
        </Button>
      </form>
    </div>
  );
}