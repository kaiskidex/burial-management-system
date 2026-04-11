import { useState, useEffect } from "react";
import { ChevronLeft, Search, Check, CalendarDays, UserCircle2, MapPin } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { createBurialRecord, getPlots } from "../services/api";
import { cn } from "../components/ui/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

export default function AddRecord({ onSuccess }) {
  const [formData, setFormData] = useState({
    deceasedName: "",
    dateOfDeath: "",
    dateOfInterment: "",
    plotId: "",
  });

  const [availablePlots, setAvailablePlots] = useState([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

console.log("DEBUG - Available Plots: ", availablePlots);

  useEffect(() => {
    getPlots()
      .then((res) => {
        const free = res.data.filter((p) => p.status === "available");

        const plotsForSearch = free.map((p) => ({
          id: p._id,
          label: `${p.section}-${p.plotNumber}`,
        }));

        setAvailablePlots(plotsForSearch);
      })
      .catch((err) => console.error("Error fetching plots:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date(formData.dateOfInterment) < new Date(formData.dateOfDeath)){
      return alert("Error: Date of Interment cannot be earlier than Date of Death.");
    }

    if (!formData.plotId) {
      return alert("Please select a specific cemetery plot.");
    }

    setIsSubmitting(true);
    try {
      await createBurialRecord(formData);
      alert("New Burial Entry Confirmed!");
      onSuccess();
    } catch (err) {
      alert(
        "Error: " +
          (err.response?.data?.message || "Check your database connection")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen pt-12 pb-24 bg-gray-50/50 px-4">
      <div className="w-full max-w-2xl bg-white p-10 rounded-3xl shadow-lg border border-gray-100 space-y-10">
        
        {/* HEADER */}
        <div className="space-y-4 text-left">
          <button
            type="button"
            onClick={() => onSuccess()}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-green-700 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Records
          </button>

          <div>
            <h1 className="text-4xl font-extrabold text-gray-950 tracking-tight">
              Create New Entry
            </h1>
            <p className="text-gray-500 mt-2 max-w-md">
              Ensure plot availability before confirming interment.
            </p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* NAME */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <UserCircle2 className="w-4 h-4 text-gray-400" />
              Deceased Full Name
            </label>
            <Input
              required
              placeholder="Juan Dela Cruz, Sr."
              value={formData.deceasedName}
              onChange={(e) =>
                setFormData({ ...formData, deceasedName: e.target.value })
              }
              className="h-12 rounded-xl"
            />
          </div>

          {/* DATE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                Date of Death
              </label>
              <Input
                type="date"
                required
                value={formData.dateOfDeath}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfDeath: e.target.value })
                }
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                Date of Interment
              </label>
              <Input
                type="date"
                required
                value={formData.dateOfInterment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dateOfInterment: e.target.value,
                  })
                }
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <hr />

          {/* COMBOBOX */}
<div className="space-y-2">
  <label className="text-sm font-semibold flex items-center gap-2">
    <MapPin className="w-4 h-4 text-gray-400" />
    Assign Cemetery Plot
  </label>

  <Popover
    open={comboboxOpen}
    onOpenChange={setComboboxOpen}
  >
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={comboboxOpen}
        className="w-full h-12 justify-between rounded-xl bg-white border-gray-200"
      >
        {formData.plotId
          ? availablePlots.find((p) => p.id === formData.plotId)?.label
          : "Select a plot..."}
        <Search className="ml-2 h-4 w-4 shrink-0 opacity-40" />
      </Button>
    </PopoverTrigger>

    <PopoverContent
      align="start"
      className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border shadow-xl bg-white z-[9999]"
    >
      <Command>
        <CommandInput placeholder="Search plot (e.g. A-001)..." className="h-10" />
        
        
        <CommandList className="max-h-[300px] overflow-y-auto">
          <CommandEmpty className="p-4 text-sm text-gray-500">No plots available.</CommandEmpty>

          <CommandGroup>
            {availablePlots.map((plot) => (
              <CommandItem
                key={plot.id}
                value={plot.label}
                onSelect={(currentValue) => {
                  const selected = availablePlots.find(
                    (p) => p.label.toLowerCase() === currentValue.toLowerCase()
                  );

                  if (selected) {
                    setFormData((prev) => ({
                      ...prev,
                      plotId: selected.id,
                    }));
                  }
                  setComboboxOpen(false);
                }}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-green-50 data-[selected='true']:bg-green-50"
              >
                <span className="font-medium text-gray-900">{plot.label}</span>

                <Check
                  className={cn(
                    "h-4 w-4 text-green-600",
                    formData.plotId === plot.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>


          {/* SUBMIT */}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.plotId}
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg rounded-xl"
          >
            {isSubmitting ? "Processing..." : "Save Record"}
          </Button>
        </form>
      </div>
    </div>
  );
}