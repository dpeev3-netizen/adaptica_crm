"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Globe, Shield, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { fetchWithToken } from '@/lib/api';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  { value: "DEAL_CREATED", label: "Deal Created" },
  { value: "DEAL_STAGE_CHANGED", label: "Deal Stage Changed" },
  { value: "CONTACT_CREATED", label: "Contact Created" },
  { value: "CONTACT_UPDATED", label: "Contact Updated" },
  { value: "*", label: "All Events" },
];

export default function WebhooksSettings() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["*"]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const fetchWebhooks = async () => {
    try {
      const res = await fetchWithToken('/webhooks');
      if (res.ok) setWebhooks(await res.json());
    } catch {}
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const handleCreate = async () => {
    if (!newUrl.trim()) return toast.error("Enter a webhook URL");
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: selectedEvents }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedSecret(data.secret);
        setNewUrl("");
        setSelectedEvents(["*"]);
        fetchWebhooks();
        toast.success("Webhook created!");
      } else {
        toast.error("Failed to create webhook");
      }
    } catch {
      toast.error("Error creating webhook");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchWithToken(`/webhooks/${id}`, { method: "DELETE" });
      fetchWebhooks();
      toast.success("Webhook deleted");
    } catch {
      toast.error("Failed to delete webhook");
    }
  };

  const toggleWebhook = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchWebhooks();
      toast.success(currentActive ? "Webhook paused" : "Webhook activated");
    } catch {
      toast.error("Failed to toggle webhook");
    }
  };

  const toggleEvent = (event: string) => {
    if (event === "*") {
      setSelectedEvents(["*"]);
      return;
    }
    setSelectedEvents((prev) => {
      const next = prev.filter((e) => e !== "*");
      return next.includes(event) ? next.filter((e) => e !== event) : [...next, event];
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="md-headline-medium text-on-surface tracking-tight">Webhooks</h1>
        <p className="text-on-surface-variant md-body-large mt-2">
          Send real-time HTTP notifications to external services when events occur in your CRM.
        </p>
      </div>

      {/* Secret Display */}
      {createdSecret && (
        <div className="bg-secondary-container border border-secondary/30 rounded-xl p-5 space-y-3 shadow-sm">
          <p className="md-label-large font-bold text-on-secondary-container">
            <Shield size={14} className="inline mr-1" /> Signing Secret — Copy it now, it won't be shown again!
          </p>
          <div className="flex items-center gap-2 bg-surface border border-outline-variant p-3 rounded-lg">
            <code className="flex-1 md-body-small font-mono break-all text-on-surface">
              {showSecret ? createdSecret : "•".repeat(48)}
            </code>
            <button onClick={() => setShowSecret(!showSecret)} className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors">
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdSecret);
                toast.success("Copied!");
              }}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors"
            >
              <Copy size={14} />
            </button>
          </div>
          <button onClick={() => setCreatedSecret(null)} className="md-body-small text-on-surface-variant hover:text-secondary underline transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* Existing Webhooks */}
      {webhooks.length > 0 && (
        <div className="space-y-3">
          <h2 className="md-label-large uppercase tracking-wider text-on-surface-variant">Registered Webhooks</h2>
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className={`border rounded-xl p-5 shadow-sm flex items-center justify-between transition-all ${
                wh.isActive ? "bg-secondary-container border-l-[3px] border-l-secondary border-outline-variant" : "bg-surface border-outline-variant opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Globe size={18} className={wh.isActive ? "text-secondary" : "text-on-surface-variant"} />
                <div className="min-w-0">
                  <p className="font-mono md-body-medium text-on-surface truncate">{wh.url}</p>
                  <p className="md-body-small text-on-surface-variant mt-0.5">
                    Events: {(wh.events as string[]).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => toggleWebhook(wh.id, wh.isActive)}
                  className={`md-body-small px-3 py-1.5 rounded-lg transition-colors ${
                    wh.isActive
                      ? "hover:bg-warning-container text-warning border border-transparent"
                      : "hover:bg-secondary-container text-secondary border border-transparent"
                  }`}
                >
                  {wh.isActive ? "Pause" : "Enable"}
                </button>
                <button
                  onClick={() => handleDelete(wh.id)}
                  className="p-2 rounded-lg hover:bg-error-container text-error transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register New Webhook */}
      <div className="bg-surface border border-outline-variant rounded-xl p-8 shadow-sm space-y-6">
        <h2 className="md-title-large font-bold text-on-surface">Register New Webhook</h2>
        <div>
          <label className="md-label-medium mb-1.5 block text-on-surface">Endpoint URL</label>
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full bg-surface-container-highest border border-outline rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary outline-none transition-all font-mono md-body-medium text-on-surface placeholder:text-on-surface-variant shadow-sm"
            placeholder="https://api.yourservice.com/webhooks/crm"
          />
        </div>

        <div>
          <label className="md-label-medium mb-2 block text-on-surface">Subscribe to Events</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_EVENTS.map((evt) => (
              <button
                key={evt.value}
                onClick={() => toggleEvent(evt.value)}
                className={`px-3 py-1.5 rounded-lg md-body-medium border transition-all duration-300 ${
                  selectedEvents.includes(evt.value)
                    ? "bg-primary-container text-on-primary-container border-primary shadow-sm"
                    : "bg-surface text-on-surface-variant border-outline hover:border-outline-variant hover:text-on-surface"
                }`}
              >
                {evt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant flex justify-end">
          <button
            onClick={handleCreate}
            disabled={!newUrl.trim()}
            className="bg-primary hover:bg-primary/90 text-on-primary px-8 py-2.5 rounded-lg md-label-large flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Plus size={18} /> Register Webhook
          </button>
        </div>
      </div>
    </div>
  );
}
