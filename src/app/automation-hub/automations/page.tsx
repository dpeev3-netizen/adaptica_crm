"use client";

import { useState, useEffect } from "react";
import { Plus, Zap, ArrowRight, Trash2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { fetchWithToken } from '@/lib/api';

interface WorkflowAction {
  type: string;
  config: Record<string, string>;
}

interface Workflow {
  id: string;
  name: string;
  isActive: boolean;
  entityType: string;
  triggerType: string;
  actions: { type: string; configJson: string }[];
}

export default function AutomationsSettings() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowName, setWorkflowName] = useState("");
  const [triggerType, setTriggerType] = useState("CREATED");
  const [entityType, setEntityType] = useState("DEAL");
  const [actions, setActions] = useState<WorkflowAction[]>([
    { type: "CREATE_TASK", config: { title: "Follow up with client" } },
  ]);

  const fetchWorkflows = async () => {
    try {
      const res = await fetchWithToken('/workflows');
      if (res.ok) setWorkflows(await res.json());
    } catch {}
  };

  useEffect(() => { fetchWorkflows(); }, []);

  const handleSave = async () => {
    if (!workflowName.trim()) return toast.error("Please enter a workflow name");
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workflowName, entityType, triggerType, actions }),
      });
      if (res.ok) {
        toast.success("Workflow created!");
        setWorkflowName("");
        setActions([{ type: "CREATE_TASK", config: { title: "" } }]);
        fetchWorkflows();
      } else {
        toast.error("Failed to create workflow");
      }
    } catch {
      toast.error("Error creating workflow");
    }
  };

  const toggleWorkflow = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchWorkflows();
      toast.success(currentActive ? "Workflow paused" : "Workflow activated");
    } catch {
      toast.error("Failed to toggle workflow");
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await fetchWithToken(`/workflows/${id}`, { method: "DELETE" });
      fetchWorkflows();
      toast.success("Workflow deleted");
    } catch {
      toast.error("Failed to delete workflow");
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "CREATE_TASK": return "Create a Task";
      case "SEND_EMAIL": return "Send an Email";
      case "WEBHOOK": return "Fire Webhook";
      case "UPDATE_FIELD": return "Update a Field";
      default: return type;
    }
  };

  const getActionPlaceholder = (type: string) => {
    switch (type) {
      case "CREATE_TASK": return "Task title, e.g. 'Follow up with client'";
      case "SEND_EMAIL": return "Email subject, e.g. 'Welcome aboard!'";
      case "WEBHOOK": return "Webhook URL, e.g. https://hooks.example.com/crm";
      case "UPDATE_FIELD": return "Field=Value, e.g. 'status=active'";
      default: return "Configuration";
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="md-headline-medium text-on-surface tracking-tight">Workflow Automations</h1>
        <p className="text-on-surface-variant mt-2 md-body-large">
          Build &ldquo;If This, Then That&rdquo; rules to automate your CRM pipeline.
        </p>
      </div>

      {/* Existing Workflows List */}
      {workflows.length > 0 && (
        <div className="space-y-3">
          <h2 className="md-label-large uppercase tracking-wider text-on-surface-variant">Active Workflows</h2>
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className={`border rounded-xl p-5 shadow-sm flex items-center justify-between transition-all ${
                wf.isActive
                  ? "bg-secondary-container border-l-[3px] border-l-secondary border-outline-variant"
                  : "bg-surface border-outline-variant opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${wf.isActive ? "bg-secondary shadow-sm animate-pulse" : "bg-on-surface-variant/40"}`} />
                <div>
                  <p className="md-title-medium text-on-surface">{wf.name}</p>
                  <p className="md-body-small text-on-surface-variant mt-0.5">
                    When <span className="font-medium text-on-surface">{wf.entityType}</span> is{" "}
                    <span className="font-medium text-on-surface">{wf.triggerType.replace("_", " ").toLowerCase()}</span>
                    {" → "}
                    {wf.actions.map((a, i) => (
                      <span key={i} className="font-medium text-primary">{getActionLabel(a.type)}{i < wf.actions.length - 1 ? ", " : ""}</span>
                    ))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleWorkflow(wf.id, wf.isActive)}
                  className={`p-2 rounded-lg transition-colors ${
                    wf.isActive ? "hover:bg-warning/20 text-warning" : "hover:bg-[#6366F1]/20 text-[#6366F1]"
                  }`}
                  title={wf.isActive ? "Pause" : "Activate"}
                >
                  {wf.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                </button>
                <button
                  onClick={() => deleteWorkflow(wf.id)}
                  className="p-2 rounded-lg hover:bg-danger/20 text-danger transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Workflow */}
      <div className="bg-surface border border-outline-variant rounded-xl p-8 shadow-sm space-y-8">
        <h2 className="md-title-large text-on-surface">Create New Workflow</h2>
        <div>
          <label className="md-label-medium mb-1.5 block text-on-surface">Rule Name</label>
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-full max-w-md bg-surface border border-outline rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary outline-none transition-all md-body-medium text-on-surface placeholder:text-on-surface-variant shadow-sm"
            placeholder="e.g. Onboard Won Deal"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
          {/* TRIGGER */}
          <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 bg-surface-container-highest relative">
            <div className="absolute -top-3 left-4 bg-surface px-2 md-label-small text-on-surface-variant uppercase tracking-wider rounded-md border border-outline-variant">
              When this happens
            </div>
            <div className="space-y-4">
              <div>
                <label className="md-label-small text-on-surface-variant mb-1 block">Entity</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full border border-outline rounded-lg p-2.5 bg-surface text-on-surface md-body-medium"
                >
                  <option value="DEAL">Deal</option>
                  <option value="CONTACT">Contact</option>
                  <option value="COMPANY">Company</option>
                </select>
              </div>
              <div>
                <label className="md-label-small text-on-surface-variant mb-1 block">Trigger Event</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full border border-outline rounded-lg p-2.5 bg-surface text-on-surface md-body-medium"
                >
                  <option value="CREATED">Is Created</option>
                  <option value="STAGE_CHANGED">Stage is Changed</option>
                  <option value="UPDATED">Is Updated</option>
                  <option value="DELETED">Is Deleted</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-on-surface-variant hidden md:flex items-center pt-10 opacity-50">
            <ArrowRight size={32} />
          </div>

          {/* ACTIONS */}
          <div className="border-2 border-secondary/20 rounded-xl p-6 bg-secondary-container/30 relative">
            <div className="absolute -top-3 left-4 bg-surface px-2 md-label-small text-secondary uppercase tracking-wider rounded-md border border-secondary/20 shadow-sm">
              Then do this
            </div>
            <div className="space-y-4">
              {actions.map((action, i) => (
                <div key={i} className="bg-surface-container p-4 rounded-lg shadow-sm border border-outline-variant relative">
                  {actions.length > 1 && (
                    <button
                      onClick={() => setActions(actions.filter((_, j) => j !== i))}
                      className="absolute top-2 right-2 text-on-surface-variant hover:text-error hover:bg-error-container p-1 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <select
                    value={action.type}
                    onChange={(e) => {
                      const updated = [...actions];
                      updated[i] = { ...updated[i], type: e.target.value };
                      setActions(updated);
                    }}
                    className="w-full border-0 border-b border-outline-variant pb-2 mb-3 bg-transparent md-title-small text-primary focus:ring-0 outline-none"
                  >
                    <option value="CREATE_TASK" className="bg-surface">Create a Task</option>
                    <option value="SEND_EMAIL" className="bg-surface">Send an Email</option>
                    <option value="WEBHOOK" className="bg-surface">Fire Webhook</option>
                    <option value="UPDATE_FIELD" className="bg-surface">Update a Field</option>
                  </select>
                  <input
                    value={action.config.title || ""}
                    onChange={(e) => {
                      const updated = [...actions];
                      updated[i] = { ...updated[i], config: { ...updated[i].config, title: e.target.value } };
                      setActions(updated);
                    }}
                    className="w-full md-body-medium bg-surface p-2 rounded-lg border border-outline text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
                    placeholder={getActionPlaceholder(action.type)}
                  />
                </div>
              ))}
              <button
                onClick={() => setActions([...actions, { type: "CREATE_TASK", config: { title: "" } }])}
                className="w-full py-2.5 rounded-lg border border-dashed border-primary/30 text-primary md-label-large hover:bg-primary/10 flex items-center justify-center gap-2 transition-colors duration-300"
              >
                <Plus size={16} /> Add Another Action
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-outline-variant flex justify-end">
          <button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-on-primary px-8 py-2.5 rounded-full md-label-large flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Zap size={18} className="fill-on-primary" /> Activate Automation
          </button>
        </div>
      </div>
    </div>
  );
}
