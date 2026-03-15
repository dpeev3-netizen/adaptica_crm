"use client";

import { useState } from "react";
import { Plus, Zap, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";

export default function AutomationsSettings() {
  const [workflowName, setWorkflowName] = useState("");
  const [triggerType, setTriggerType] = useState("STAGE_CHANGED");
  const [entityType, setEntityType] = useState("DEAL");
  const [actions, setActions] = useState([{ type: "CREATE_TASK", config: { title: "Follow up with client" } }]);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName || "New Automation",
          entityType,
          triggerType,
          actions
        })
      });
      if (res.ok) {
        toast.success("Workflow created successfully!");
        setWorkflowName("");
      } else {
        toast.error("Failed to save workflow");
      }
    } catch (e) {
      toast.error("Error saving workflow");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflow Automations</h1>
        <p className="text-muted-foreground mt-2">Build "If This, Then That" rules to automate your CRM.</p>
      </div>

      <div className="bg-white border rounded-xl p-8 shadow-sm space-y-8">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Rule Name</label>
          <input 
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-full max-w-md border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none transition-all text-lg font-medium" 
            placeholder="e.g. Onboard Won Deal" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          {/* TRIGGER */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 relative">
            <div className="absolute -top-3 left-4 bg-gray-50 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">When this happens</div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Entity</label>
                <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-full border rounded-lg p-2 bg-white">
                  <option value="DEAL">Deal</option>
                  <option value="CONTACT">Contact</option>
                  <option value="COMPANY">Company</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Trigger Event</label>
                <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} className="w-full border rounded-lg p-2 bg-white">
                  <option value="CREATED">Is Created</option>
                  <option value="STAGE_CHANGED">Stage is Changed</option>
                  <option value="UPDATED">Is Updated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-gray-300 hidden md:block">
            <ArrowRight size={32} />
          </div>

          {/* ACTION */}
          <div className="border-2 border-blue-100 rounded-xl p-6 bg-blue-50/50 relative">
            <div className="absolute -top-3 left-4 bg-blue-50 px-2 text-xs font-bold text-blue-600 uppercase tracking-wider">Do this</div>
            <div className="space-y-4">
              {actions.map((action, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <select 
                    value={action.type}
                    onChange={(e) => {
                      const newActions = [...actions];
                      newActions[i].type = e.target.value;
                      setActions(newActions);
                    }}
                    className="w-full border-0 border-b pb-2 mb-3 bg-transparent font-medium text-blue-900 focus:ring-0 outline-none"
                  >
                    <option value="CREATE_TASK">Create a Task</option>
                    <option value="SEND_EMAIL">Send an Email</option>
                    <option value="WEBHOOK">Trigger Webhook</option>
                  </select>
                  
                  <input 
                    value={action.config.title || ""}
                    onChange={(e) => {
                      const newActions = [...actions];
                      newActions[i].config.title = e.target.value;
                      setActions(newActions);
                    }}
                    className="w-full text-sm bg-gray-50 p-2 rounded border" 
                    placeholder="Configuration (e.g. Task Title)"
                  />
                </div>
              ))}
              <button 
                onClick={() => setActions([...actions, { type: "SEND_EMAIL", config: { title: "" } }])}
                className="w-full py-2 rounded-lg border border-dashed border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={16} /> Add Another Action
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button onClick={handleSave} className="bg-black hover:bg-gray-800 text-white px-8 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5">
            <Zap size={18} className="text-yellow-400 fill-yellow-400" /> Activate Automation
          </button>
        </div>
      </div>
    </div>
  );
}
