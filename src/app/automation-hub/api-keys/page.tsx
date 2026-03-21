"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithToken } from '@/lib/api';
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoInput from "@/components/ui/NeoInput";
import { Key, Plus, Trash2, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch API Keys
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const res = await fetchWithToken("/workspace/keys");
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return res.json();
    },
  });

  // Create API Key
  const createKey = useMutation({
    mutationFn: async () => {
      const res = await fetchWithToken("/workspace/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      setNewKeyName("");
      setIsCreating(false);
      setNewlyGeneratedKey(data.key); // Show the raw key!
      toast.success("API Key generated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Revoke API Key
  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithToken(`/workspace/keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke API key");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast.success("API Key revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleCopy = () => {
    if (newlyGeneratedKey) {
      navigator.clipboard.writeText(newlyGeneratedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl pb-12">
      <div>
        <h1 className="md-headline-medium text-on-surface flex items-center gap-3">
          <Key className="text-secondary" size={28} /> API Keys
        </h1>
        <p className="text-on-surface-variant md-body-large mt-1">
          Manage workspace API keys used to authenticate programmatic access to your CRM data.
        </p>
      </div>

      {newlyGeneratedKey && (
        <NeoCard variant="outlined" className="p-6 border-warning border bg-warning-container text-on-warning-container">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-warning shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-error font-bold md-title-medium">Important: Save your new API key</h3>
                <p className="md-body-small text-on-warning-container mt-1">
                  For security reasons, this key will never be shown again. Please copy it and store it somewhere safe.
                </p>
              </div>
              
              <div className="flex gap-2 items-center bg-surface-container-highest border border-outline-variant p-2 rounded-lg shadow-sm">
                <code className="flex-1 px-2 font-mono text-sm text-on-surface overflow-x-auto whitespace-nowrap">
                  {newlyGeneratedKey}
                </code>
                <NeoButton onClick={handleCopy} variant="secondary" className="px-3 shrink-0 flex items-center gap-2">
                  {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />} 
                  {copied ? "Copied" : "Copy"}
                </NeoButton>
              </div>

              <NeoButton onClick={() => setNewlyGeneratedKey(null)} variant="primary" className="mt-2 md-label-large px-4 py-1.5 h-auto">
                I have saved it
              </NeoButton>
            </div>
          </div>
        </NeoCard>
      )}

      <NeoCard variant="outlined" className="p-6 bg-surface">
        <div className="flex justify-between items-center mb-6">
          <h2 className="md-title-medium text-on-surface">Active Keys</h2>
          <NeoButton onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-2 md-label-large px-4">
            <Plus size={16} /> Generate New Key
          </NeoButton>
        </div>

        {isCreating && (
          <div className="mb-6 bg-surface-container border border-outline-variant p-4 rounded-xl shadow-sm flex items-end gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1 space-y-2">
              <label className="md-label-medium font-bold text-on-surface">Key Name</label>
              <NeoInput
                placeholder="e.g. Zapier Integration Worker"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                autoFocus
              />
            </div>
            <NeoButton 
              onClick={() => createKey.mutate()} 
              disabled={!newKeyName.trim() || createKey.isPending}
            >
              {createKey.isPending ? "Generating..." : "Create"}
            </NeoButton>
            <NeoButton variant="secondary" onClick={() => setIsCreating(false)}>
              Cancel
            </NeoButton>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 rounded-xl bg-surface-container border border-outline-variant animate-pulse" />
            ))}
          </div>
        ) : !apiKeys?.length ? (
          <div className="text-center py-12 bg-surface-container border border-outline-variant rounded-xl">
            <Key size={32} className="mx-auto text-on-surface-variant mb-3 opacity-50" />
            <p className="text-on-surface-variant md-body-medium">No API keys generated yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((apiKey: any) => (
              <div key={apiKey.id} className="flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:bg-surface-container-high transition-all group">
                <div>
                  <h3 className="md-title-small font-bold text-on-surface">{apiKey.name}</h3>
                  <div className="flex items-center gap-4 mt-1 md-body-small text-on-surface-variant">
                    <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                    <span>Last used: {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : "Never"}</span>
                  </div>
                </div>
                  <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to revoke the key "${apiKey.name}"? This action cannot be undone and integrations using this key will fail.`)) {
                      deleteKey.mutate(apiKey.id);
                    }
                  }}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-all self-start"
                  title="Revoke Key"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </NeoCard>
    </div>
  );
}
