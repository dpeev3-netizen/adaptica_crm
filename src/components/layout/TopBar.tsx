"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fetchWithToken } from '@/lib/api';

export default function TopBar() {
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // TODO: Replace with actual user ID from session
  const userId = "current-user";

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetchWithToken(`/notifications?userId=${userId}`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 10000,
  });

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications?.filter((n: any) => !n.read)?.length || 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = () => {
    setNotifOpen(!notifOpen);
    // Mark all as read when opening
    if (!notifOpen && unreadCount > 0) {
      const unreadIds = notifications.filter((n: any) => !n.read).map((n: any) => n.id);
      markRead.mutate(unreadIds);
    }
  };

  return (
    <header className="h-20 w-full flex flex-row items-center justify-between px-8 bg-[#0B0C10]/60 backdrop-blur-xl border-b border-white/5 z-10 sticky top-0 transition-all duration-300">
      <div className="flex-1 max-w-xl">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          className="relative flex items-center w-full"
        >
          <div className="absolute left-4 text-muted pointer-events-none group-hover:text-primary transition-colors">
            <Search size={18} />
          </div>
          <div className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-sm font-medium text-muted hover:text-white text-left cursor-pointer focus:outline-none transition-all duration-300 group">
            Search leads, deals, or contacts...
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono shadow-inner text-muted group-hover:text-white transition-colors">Ctrl+K</kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-6 ml-4 relative" ref={notifRef}>
        <button
          onClick={handleBellClick}
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-white bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-300 relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {notifOpen && (
          <div className="absolute right-0 top-14 w-80 glass-panel rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <span className="font-bold text-white text-sm">Notifications</span>
              <button onClick={() => setNotifOpen(false)} className="text-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {!notifications?.length ? (
                <div className="p-6 text-center text-muted text-sm">No notifications yet.</div>
              ) : (
                notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                        !n.read ? "bg-primary/5 border-l-[3px] border-l-primary" : "border-l-[3px] border-l-transparent"
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted mt-1">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
