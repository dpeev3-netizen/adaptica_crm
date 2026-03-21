"use client";

import { useState } from "react";
import { Plus, GripVertical, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { fetchWithToken } from "@/lib/api";

export default function PipelinesSettings() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [stages, setStages] = useState<any[]>([{ name: "New Lead", color: "#3B82F6", wipLimit: "", slaDays: "" }]);

  const addStage = () => {
    setStages([...stages, { name: "", color: "#3B82F6", wipLimit: "", slaDays: "" }]);
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName) return toast.error("Please enter a pipeline name");
    
    try {
      const res = await fetchWithToken("/pipelines", {
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
        setStages([{ name: "", color: "#3B82F6", wipLimit: "", slaDays: "" }]);
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
        <h1 className="md-headline-medium text-on-surface tracking-tight">Pipelines & Stages</h1>
        <p className="text-on-surface-variant md-body-large mt-2">Manage your sales pipelines and create dynamic tracking stages.</p>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <label className="md-label-medium mb-1.5 block text-on-surface">Pipeline Name</label>
          <input 
            value={newPipelineName}
            onChange={(e) => setNewPipelineName(e.target.value)}
            className="w-full bg-surface-container-highest border border-outline rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none transition-all md-body-medium shadow-sm" 
            placeholder="e.g. Enterprise Sales Pipeline" 
          />
        </div>

        <div className="space-y-4">
          <label className="md-label-medium block text-on-surface">Stages</label>
          {stages.map((stage, i) => (
            <div key={i} className="flex items-center gap-3 bg-surface-container p-2 rounded-lg border border-outline-variant group shadow-sm">
              <GripVertical className="text-on-surface-variant cursor-grab hover:text-on-surface transition-colors" size={20} />
              <input type="color" value={stage.color} onChange={(e) => {
                const newStages = [...stages];
                newStages[i].color = e.target.value;
                setStages(newStages);
              }} className="w-8 h-8 rounded cursor-pointer shrink-0 border border-white/20 bg-transparent" />
              <input 
                value={stage.name}
                onChange={(e) => {
                  const newStages = [...stages];
                  newStages[i].name = e.target.value;
                  setStages(newStages);
                }}
                className="w-1/3 bg-transparent outline-none md-body-medium font-bold text-on-surface placeholder:text-on-surface-variant" 
                placeholder="Stage Name" 
              />
              <input 
                type="number"
                value={stage.wipLimit === undefined ? "" : stage.wipLimit}
                onChange={(e) => {
                  const newStages = [...stages];
                  newStages[i].wipLimit = e.target.value;
                  setStages(newStages);
                }}
                className="w-24 bg-surface border border-outline rounded px-2 py-1.5 md-body-small text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-primary transition-all"
                placeholder="WIP Max"
                title="WIP Limit"
              />
              <input 
                type="number"
                value={stage.slaDays === undefined ? "" : stage.slaDays}
                onChange={(e) => {
                  const newStages = [...stages];
                  newStages[i].slaDays = e.target.value;
                  setStages(newStages);
                }}
                className="w-24 bg-surface border border-outline rounded px-2 py-1.5 md-body-small text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-primary transition-all"
                placeholder="SLA Days"
                title="SLA Days"
              />
              <button onClick={() => setStages(stages.filter((_, idx) => idx !== i))} className="text-on-surface-variant hover:text-error hover:bg-error-container p-2 rounded opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button onClick={addStage} className="md-label-large text-primary hover:text-primary/80 flex items-center gap-1.5 px-2 transition-colors">
            <Plus size={16} /> Add Stage
          </button>
        </div>

        <div className="pt-4 border-t border-outline-variant flex justify-end">
          <button onClick={handleCreatePipeline} className="bg-primary hover:bg-primary/90 text-on-primary md-label-large px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5">
            <Save size={18} className="fill-on-primary" /> Save Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}
