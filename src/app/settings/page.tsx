"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useAuth } from "@/store/useAuth";
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoInput from "@/components/ui/NeoInput";
import { User, Tag, Users, Trash2, Plus, Camera, Lock, Check, X } from "lucide-react";
import { toast } from "sonner";
import { fetchWithToken } from '@/lib/api';

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "team", label: "Team", icon: Users },
];

const TAG_COLORS = [
  "#6750A4", "#1B6B3B", "#B3261E", "#7C5800", "#7D5260",
  "#625B71", "#006D77", "#D4A373", "#3A86FF", "#8338EC",
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user profile
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetchWithToken('/users/profile');
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetchWithToken('/tags');
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetchWithToken('/users');
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Avatar upload mutation
  const updateAvatar = useMutation({
    mutationFn: async (avatarBase64: string) => {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: avatarBase64 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Profile image updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Password change mutation
  const changePassword = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 500KB
    if (file.size > 500 * 1024) {
      toast.error("Image must be under 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateAvatar.mutate(base64);
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    changePassword.mutate();
  };

  const userInitial = profile?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="md-headline-medium text-on-surface font-medium">Settings</h1>
        <p className="md-body-large text-on-surface-variant mt-0.5">Manage your profile and workspace.</p>
      </div>

      {/* M3 Tabs */}
      <div className="flex border-b border-outline-variant w-max">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 md-title-small flex items-center gap-2 transition-all duration-200 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="max-w-2xl space-y-6">
          {/* Profile Info Card */}
          <NeoCard variant="outlined" className="p-6">
            <h2 className="md-title-large text-on-surface mb-6">Your Profile</h2>
            <div className="space-y-5">
              {/* Avatar section */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative group">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center font-medium text-on-primary-container text-3xl">
                      {userInitial}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Camera size={24} className="text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="md-title-medium text-on-surface">{profile?.name || "Loading..."}</p>
                  <p className="md-body-medium text-on-surface-variant">@{profile?.username || "..."}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="md-label-medium text-primary mt-1 hover:underline cursor-pointer"
                  >
                    Change profile image
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="md-label-large text-on-surface">Full Name</label>
                <NeoInput value={profile?.name || ""} readOnly />
              </div>
              <div className="space-y-2">
                <label className="md-label-large text-on-surface">Username</label>
                <NeoInput value={profile?.username || ""} readOnly />
              </div>
            </div>
          </NeoCard>

          {/* Password Change Card */}
          <NeoCard variant="outlined" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                <Lock size={20} className="text-on-primary-container" />
              </div>
              <div>
                <h2 className="md-title-large text-on-surface">Change Password</h2>
                <p className="md-body-small text-on-surface-variant">Update your account password</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="md-label-large text-on-surface">Current Password</label>
                <NeoInput
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <label className="md-label-large text-on-surface">New Password</label>
                <NeoInput
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="space-y-2">
                <label className="md-label-large text-on-surface">Confirm New Password</label>
                <NeoInput
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
                {confirmPassword && newPassword && (
                  <div className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${
                    newPassword === confirmPassword ? "text-green-600" : "text-red-500"
                  }`}>
                    {newPassword === confirmPassword ? (
                      <><Check size={12} /> Passwords match</>
                    ) : (
                      <><X size={12} /> Passwords do not match</>
                    )}
                  </div>
                )}
              </div>
              <NeoButton
                onClick={handlePasswordChange}
                disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 mt-2"
              >
                <Lock size={16} />
                {changePassword.isPending ? "Changing..." : "Change Password"}
              </NeoButton>
            </div>
          </NeoCard>
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === "tags" && (
        <div className="max-w-2xl space-y-6">
          <NeoCard variant="outlined" className="p-6">
            <h2 className="md-title-large text-on-surface mb-4">Create New Tag</h2>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <NeoInput
                  placeholder="Tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>
              <div className="flex gap-1.5 items-center flex-wrap">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewTagColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${newTagColor === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <NeoButton onClick={() => createTag.mutate()} className="flex items-center gap-2">
                <Plus size={16} /> Add
              </NeoButton>
            </div>
          </NeoCard>

          <NeoCard variant="outlined" className="p-6">
            <h2 className="md-title-large text-on-surface mb-4">All Tags</h2>
            {!tags?.length ? (
              <p className="md-body-medium text-on-surface-variant">No tags created yet.</p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag: any) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-on-surface/5 transition-colors group border border-outline-variant">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="md-title-small text-on-surface">{tag.name}</span>
                      <span className="md-label-small text-on-surface-variant ml-1">
                        {tag._count?.contacts || 0} contacts · {tag._count?.companies || 0} companies
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTag.mutate(tag.id)}
                      className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-full hover:bg-error/8"
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
        <NeoCard variant="outlined" className="p-6 max-w-2xl">
          <h2 className="md-title-large text-on-surface mb-4">Team Members</h2>
          {!users?.length ? (
            <p className="md-body-medium text-on-surface-variant">No team members found.</p>
          ) : (
            <div className="space-y-2">
              {users.map((user: any) => (
                <div key={user.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-on-surface/5 transition-colors border border-outline-variant">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-medium text-on-primary-container text-sm">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="md-title-small text-on-surface">{user.name}</p>
                    <p className="md-body-small text-on-surface-variant">@{user.username || "—"}</p>
                  </div>
                  <span className={`md-label-medium px-3 py-1 rounded-full border ${
                    user.role === "ADMIN" ? "bg-primary-container text-on-primary-container border-primary/30" : "bg-surface-container-highest text-on-surface-variant border-outline-variant"
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
