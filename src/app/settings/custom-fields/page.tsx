"use client";

import { useState } from "react";
import { Plus, Settings, Save } from "lucide-react";
import { toast } from "sonner";

export default function CustomFieldsSettings() {
  const [fields, setFields] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("CONTACT");
  const [fieldType, setFieldType] = useState("TEXT");
  const [options, setOptions] = useState(""); // Comma separated for DROPDOWN

  const handleCreate = async () => {
    if (!name) return toast.error("Please enter a field name");
    
    try {
      const res = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          entityType,
          type: fieldType,
          options: fieldType === "DROPDOWN" ? options.split(",").map(s => s.trim()) : null
        })
      });
      if (res.ok) {
        toast.success("Custom Field created successfully!");
        setName("");
        setOptions("");
      } else {
        toast.error("Failed to create Field");
      }
    } catch (e) {
      toast.error("Error creating Field");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
      <div>
        <h1 className="text-3xl font-bold tracking-tight drop-shadow-md">Custom Fields</h1>
        <p className="text-muted mt-2 font-medium">Add custom data tracking to your CRM entities.</p>
      </div>

      <div className="glass-card border border-white/5 rounded-xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-white">Entity</label>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-full bg-[#0B0C10]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-[#6366F1]/50 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
              <option value="CONTACT" className="bg-[#0B0C10]">Contact</option>
              <option value="COMPANY" className="bg-[#0B0C10]">Company</option>
              <option value="DEAL" className="bg-[#0B0C10]">Deal</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block text-white">Field Type</label>
            <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="w-full bg-[#0B0C10]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-[#6366F1]/50 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
              <option value="TEXT" className="bg-[#0B0C10]">Short Text</option>
              <option value="NUMBER" className="bg-[#0B0C10]">Number</option>
              <option value="DATE" className="bg-[#0B0C10]">DatePicker</option>
              <option value="DROPDOWN" className="bg-[#0B0C10]">Dropdown Menu</option>
              <option value="BOOLEAN" className="bg-[#0B0C10]">Checkbox (True/False)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block text-white">Field Label/Name</label>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0B0C10]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-muted focus:ring-1 focus:ring-[#6366F1]/50 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" 
            placeholder="e.g. Contract Expiration Date" 
          />
        </div>

        {fieldType === "DROPDOWN" && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium mb-1.5 block text-white">Dropdown Options (Comma Separated)</label>
            <input 
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              className="w-full bg-[#0B0C10]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-muted focus:ring-1 focus:ring-[#6366F1]/50 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" 
              placeholder="e.g. Enterprise, Mid-Market, SMB" 
            />
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex justify-end">
          <button onClick={handleCreate} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-[0_2px_15px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
            <Plus size={18} /> Create Custom Field
          </button>
        </div>
      </div>
    </div>
  );
}
