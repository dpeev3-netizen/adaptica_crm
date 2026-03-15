"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoInput from "@/components/ui/NeoInput";
import { User, Tag, Users, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "team", label: "Team", icon: Users },
];

const TAG_COLORS = [
  "#4a90e2", "#38a169", "#dd6b20", "#e53e3e", "#805ad5",
  "#d69e2e", "#319795", "#d53f8c", "#667eea", "#48bb78",
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Fetch tags
  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Fetch team members
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Create tag
  const createTag = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewTagName("");
      toast.success("Tag created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete tag
  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted");
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">Settings</h1>
        <p className="text-muted font-medium mt-1">Manage your profile and workspace.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-surface shadow-neumorph-concave rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-neumorph-flat-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <NeoCard className="p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-foreground mb-6">Your Profile</h2>
          <div className="space-y-5">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-3xl shadow-neumorph-pressed">
                A
              </div>
              <div>
                <p className="font-bold text-foreground">Admin User</p>
                <p className="text-sm text-muted">Workspace Admin</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Full Name</label>
              <NeoInput value="Admin User" readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Email</label>
              <NeoInput value="admin@adapticacrm.com" readOnly />
            </div>
            <p className="text-xs text-muted">Profile editing will be available after you sign in with an account.</p>
          </div>
        </NeoCard>
      )}

      {/* Tags Tab */}
      {activeTab === "tags" && (
        <div className="max-w-2xl space-y-6">
          <NeoCard className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Create New Tag</h2>
            <div className="flex gap-3">
              <NeoInput
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-1">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewTagColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${newTagColor === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <NeoButton onClick={() => createTag.mutate()} className="flex items-center gap-2">
                <Plus size={16} /> Add
              </NeoButton>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">All Tags</h2>
            {!tags?.length ? (
              <p className="text-muted text-sm">No tags created yet.</p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag: any) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl shadow-neumorph-pressed group">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="font-bold text-foreground text-sm">{tag.name}</span>
                      <span className="text-xs text-muted">
                        {tag._count?.contacts || 0} contacts · {tag._count?.companies || 0} companies
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTag.mutate(tag.id)}
                      className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </NeoCard>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <NeoCard className="p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-foreground mb-4">Team Members</h2>
          {!users?.length ? (
            <p className="text-muted text-sm">No team members found. Register accounts to see them here.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user: any) => (
                <div key={user.id} className="flex items-center gap-4 p-3 rounded-xl shadow-neumorph-pressed">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-sm">{user.name}</p>
                    <p className="text-xs text-muted">{user.email || "No email"}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    user.role === "ADMIN" ? "bg-primary/20 text-primary" : "bg-muted/20 text-muted"
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </NeoCard>
      )}
    </div>
  );
}
