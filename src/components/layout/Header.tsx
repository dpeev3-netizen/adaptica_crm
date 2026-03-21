"use client";

import { Search, Plus, Bell, Command, Sun, Moon, ChevronDown, User, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/store/useAuth";
import NeoButton from "@/components/ui/NeoButton";
import { fetchWithToken } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { io } from "socket.io-client";
import { toast } from "sonner";

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setNotifsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Real-time notifications socket
  useEffect(() => {
    if (!user) return;
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://adaptica-crm.onrender.com";
    const socket = io(socketUrl);
    
    socket.on("connect", () => {
      socket.emit("join", user.id); 
    });
    
    socket.on("new_notification", (notif: any) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      toast.info(notif.title, { description: notif.message });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetchWithToken('/notifications');
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetchWithToken('/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) markReadMutation.mutate([notif.id]);
    setNotifsOpen(false);
    if (notif.link) router.push(notif.link);
  };

  // Breadcrumbs
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => ({
    name: part.charAt(0).toUpperCase() + part.slice(1).replace("-", " "),
    href: "/" + pathParts.slice(0, i + 1).join("/"),
  }));

  if (pathname === "/login") return null;

  const openCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  };

  const userName = user?.name || "Admin User";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="h-16 border-b border-outline-variant bg-surface sticky top-0 z-10 px-6 flex items-center justify-between transition-colors duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 md-label-large text-on-surface-variant">
          <span className="hover:text-on-surface cursor-pointer transition-colors">Workspace</span>
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              <span className="text-outline">/</span>
              <span className={`transition-colors ${i === breadcrumbs.length - 1 ? "text-on-surface font-medium" : "hover:text-on-surface cursor-pointer"}`}>
                {crumb.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="relative group hidden md:block">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant">
            <Search size={16} />
          </div>
          <button
            onClick={openCommandPalette}
            className="w-72 h-10 pl-10 pr-14 rounded-full bg-surface-container-highest border border-transparent text-sm text-left text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer"
          >
            Search everything...
          </button>
          <div className="absolute inset-y-0 right-3 flex items-center gap-1 pointer-events-none">
            <kbd className="h-5 px-1.5 rounded-md border border-outline-variant bg-surface-container text-[10px] font-medium text-on-surface-variant flex items-center gap-0.5">
              <Command size={10} /> K
            </kbd>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifsRef}>
          <button 
            onClick={() => setNotifsOpen(!notifsOpen)}
            className="p-2 rounded-full hover:bg-on-surface/8 text-on-surface-variant transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 outline outline-2 outline-surface rounded-full bg-error" />}
          </button>

          {notifsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container rounded-xl shadow-[var(--shadow-elevation-3)] border border-outline-variant py-2 z-50 animate-scale-in max-h-[400px] flex flex-col">
              <div className="px-4 py-3 border-b border-outline-variant flex justify-between items-center shrink-0">
                <h3 className="text-sm font-bold text-on-surface">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={() => markReadMutation.mutate(notifications.filter((n: any) => !n.read).map((n: any) => n.id))} className="text-xs text-primary hover:underline font-medium">Mark all as read</button>
                )}
              </div>
              <div className="overflow-y-auto flex-1 py-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-sm text-on-surface-variant py-8">No notifications yet.</p>
                ) : (
                  notifications.map((notif: any) => (
                    <button 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left px-4 py-3 hover:bg-on-surface/5 transition-colors flex gap-3 ${notif.read ? 'opacity-70' : ''}`}
                    >
                      <div className="mt-1 shrink-0">
                        {!notif.read ? <div className="w-2 h-2 rounded-full bg-primary" /> : <div className="w-2 h-2 rounded-full border border-outline" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${notif.read ? 'text-on-surface-variant font-medium' : 'text-on-surface font-bold'}`}>{notif.title}</p>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-on-surface-variant/70 mt-1.5">{formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Button */}
        <NeoButton size="sm" variant="tonal" className="hidden sm:flex items-center gap-2 px-4 h-9">
          <Plus size={16} /> Create
        </NeoButton>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-on-surface/8 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-medium">
              {userInitials}
            </div>
            <ChevronDown size={14} className={`text-on-surface-variant transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-surface-container rounded-2xl shadow-[var(--shadow-elevation-3)] border border-outline-variant py-2 z-50 animate-scale-in">
              {/* Profile Info */}
              <div className="px-4 py-3 border-b border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm font-medium">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{userName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user?.email || "admin@adapticacrm.com"}</p>
                  </div>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <div className="px-4 py-3 border-b border-outline-variant">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-between w-full group"
                >
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? <Moon size={18} className="text-on-surface-variant" /> : <Sun size={18} className="text-on-surface-variant" />}
                    <span className="text-sm font-medium text-on-surface">Dark Mode</span>
                  </div>
                  {/* M3 Switch */}
                  <div className={`w-12 h-7 rounded-full flex items-center transition-colors duration-200 ${theme === "dark" ? "bg-primary justify-end" : "bg-surface-container-highest border-2 border-outline justify-start"}`}>
                    <div className={`w-5 h-5 rounded-full mx-1 transition-all duration-200 ${theme === "dark" ? "bg-on-primary" : "bg-outline"}`} />
                  </div>
                </button>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-on-surface/8 transition-colors text-left">
                  <User size={18} className="text-on-surface-variant" />
                  <span className="text-sm text-on-surface">Profile</span>
                </button>
                {user && (
                  <button
                    onClick={() => { logout(); router.push('/login'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-error/8 transition-colors text-left"
                  >
                    <LogOut size={18} className="text-error" />
                    <span className="text-sm text-error">Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
