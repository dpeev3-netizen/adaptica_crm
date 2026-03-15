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
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Custom Fields</h1>
        <p className="text-muted-foreground mt-2">Add custom data tracking to your CRM entities.</p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Entity</label>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none bg-white">
              <option value="CONTACT">Contact</option>
              <option value="COMPANY">Company</option>
              <option value="DEAL">Deal</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Field Type</label>
            <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none bg-white">
              <option value="TEXT">Short Text</option>
              <option value="NUMBER">Number</option>
              <option value="DATE">DatePicker</option>
              <option value="DROPDOWN">Dropdown Menu</option>
              <option value="BOOLEAN">Checkbox (True/False)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Field Label/Name</label>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none transition-all" 
            placeholder="e.g. Contract Expiration Date" 
          />
        </div>

        {fieldType === "DROPDOWN" && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium mb-1.5 block">Dropdown Options (Comma Separated)</label>
            <input 
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none transition-all" 
              placeholder="e.g. Enterprise, Mid-Market, SMB" 
            />
          </div>
        )}

        <div className="pt-4 border-t flex justify-end">
          <button onClick={handleCreate} className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Plus size={18} /> Create Custom Field
          </button>
        </div>
      </div>
    </div>
  );
}
