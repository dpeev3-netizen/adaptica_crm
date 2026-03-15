"use client";

import { useState } from "react";
import { Plus, GripVertical, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export default function PipelinesSettings() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [stages, setStages] = useState([{ name: "New Lead", color: "#3B82F6" }]);

  const addStage = () => {
    setStages([...stages, { name: "", color: "#3B82F6" }]);
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName) return toast.error("Please enter a pipeline name");
    
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPipelineName,
          stages: stages
        })
      });
      if (res.ok) {
        toast.success("Pipeline created successfully!");
        setNewPipelineName("");
        setStages([{ name: "", color: "#3B82F6" }]);
      } else {
        toast.error("Failed to create pipeline");
      }
    } catch (error) {
      toast.error("Error creating pipeline");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipelines & Stages</h1>
        <p className="text-muted-foreground mt-2">Manage your sales pipelines and create dynamic tracking stages.</p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Pipeline Name</label>
          <input 
            value={newPipelineName}
            onChange={(e) => setNewPipelineName(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none transition-all" 
            placeholder="e.g. Enterprise Sales Pipeline" 
          />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium block">Stages</label>
          {stages.map((stage, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border group">
              <GripVertical className="text-gray-400 cursor-grab" size={20} />
              <input type="color" value={stage.color} onChange={(e) => {
                const newStages = [...stages];
                newStages[i].color = e.target.value;
                setStages(newStages);
              }} className="w-8 h-8 rounded cursor-pointer shrink-0" />
              <input 
                value={stage.name}
                onChange={(e) => {
                  const newStages = [...stages];
                  newStages[i].name = e.target.value;
                  setStages(newStages);
                }}
                className="w-full bg-transparent outline-none font-medium" 
                placeholder="Stage Name" 
              />
              <button onClick={() => setStages(stages.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button onClick={addStage} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-2">
            <Plus size={16} /> Add Stage
          </button>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button onClick={handleCreatePipeline} className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Save size={18} /> Save Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}
